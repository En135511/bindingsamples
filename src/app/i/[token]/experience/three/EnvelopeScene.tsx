"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Float, RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { sound } from "../sound";
import { Lights } from "./Lights";
import { cardFace, envelopeName, paperGrain, sealFace } from "./textures";

const W = 3; // envelope width
const H = 2; // envelope height
const V = -0.15; // where the pocket's V and the flap's tip meet

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const progress = (t: number, start: number, length: number) => easeInOut(clamp01((t - start) / length));

type Props = {
  guestName: string;
  classYear: string | null;
  opening: boolean;
  onOpened: () => void;
  onReady: () => void;
};

export default function EnvelopeScene(props: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={props.onReady}
    >
      <Lights />
      <Sparkles count={80} scale={[9, 7, 4]} size={2.4} speed={0.35} color="#ead39a" opacity={0.85} />
      <Envelope {...props} />
      <ContactShadows position={[0, -1.55, 0]} opacity={0.55} scale={7} blur={2.6} far={3} color="#000814" />
    </Canvas>
  );
}

function Envelope({ guestName, classYear, opening, onOpened }: Props) {
  const tilt = useRef<THREE.Group>(null!);
  const flap = useRef<THREE.Group>(null!);
  const card = useRef<THREE.Group>(null!);
  const seal = useRef<THREE.Group>(null!);
  const startedAt = useRef<number | null>(null);
  const cues = useRef({ swoosh: false, slide: false, chime: false, done: false });
  const { camera, viewport } = useThree();
  // Shrink the envelope to fit narrow (portrait phone) screens.
  const fit = Math.min(1, (viewport.width * 0.86) / W);

  const textures = useMemo(
    () => ({
      grain: paperGrain(),
      card: cardFace(classYear),
      name: envelopeName(guestName),
      seal: sealFace(),
    }),
    [classYear, guestName],
  );
  useEffect(() => () => Object.values(textures).forEach((t) => t.dispose()), [textures]);

  const pocketShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-W / 2, -H / 2);
    s.lineTo(W / 2, -H / 2);
    s.lineTo(W / 2, H / 2);
    s.lineTo(0, V);
    s.lineTo(-W / 2, H / 2);
    s.closePath();
    return s;
  }, []);
  const flapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0);
    s.lineTo(W / 2, 0);
    s.lineTo(0, V - H / 2 - 0.08);
    s.closePath();
    return s;
  }, []);

  useFrame((state, delta) => {
    // Follow the finger/mouse a little, so it feels like a real object in your hand.
    const g = tilt.current;
    // At rest it sits at a slight angle and sways, so you see its depth even without touching.
    const sway = Math.sin(state.clock.elapsedTime * 0.7);
    const targetX = opening ? 0 : 0.12 - state.pointer.y * 0.22;
    const targetY = opening ? 0 : -0.18 + sway * 0.12 + state.pointer.x * 0.32;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, targetX, 4, delta);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, targetY, 4, delta);

    if (!opening) return;
    if (startedAt.current === null) {
      startedAt.current = state.clock.elapsedTime;
      sound.crack();
    }
    const t = state.clock.elapsedTime - startedAt.current;
    const cue = cues.current;

    // 1. The seal pops off.
    const pop = t < 0.12 ? 1 + t * 2 : Math.max(0, 1.24 - (t - 0.12) * 5);
    seal.current.scale.setScalar(Math.max(pop, 0.0001));
    seal.current.rotation.z = t * 5;
    seal.current.position.z = 0.075 + t * 0.6;

    // 2. The flap swings open toward you, then tucks behind.
    if (t > 0.3 && !cue.swoosh) {
      cue.swoosh = true;
      sound.swoosh(0.7);
    }
    const f = progress(t, 0.3, 0.8);
    // Slightly past upright so it leans back, behind the card.
    flap.current.rotation.x = -Math.PI * 1.06 * f;
    flap.current.position.z = f > 0.55 ? -0.05 : 0.045;

    // 3. The card rises out of the envelope.
    if (t > 1.0 && !cue.slide) {
      cue.slide = true;
      sound.swoosh(0.9);
    }
    const c = progress(t, 1.0, 1.0);
    card.current.position.y = -0.02 + c * 1.6;
    if (t > 1.7 && !cue.chime) {
      cue.chime = true;
      sound.chime();
    }

    // 4. The camera glides in to the card.
    const m = progress(t, 1.9, 1.0);
    const cardY = 1.58 * fit;
    camera.position.set(0, cardY * m, 6 - m * 2.4);
    camera.lookAt(0, cardY * m, 0);

    if (t > 2.95 && !cue.done) {
      cue.done = true;
      onOpened();
    }
  });

  const paper = { roughness: 0.62, bumpMap: textures.grain, bumpScale: 0.6 };

  return (
    <group scale={fit}>
      <group ref={tilt}>
        <Float enabled={!opening} speed={1.6} rotationIntensity={0.35} floatIntensity={0.5}>
          {/* Back of the envelope */}
          <RoundedBox args={[W, H, 0.03]} radius={0.015} position={[0, 0, -0.016]}>
            <meshStandardMaterial color="#0b1631" {...paper} />
          </RoundedBox>

          {/* The card inside */}
          <group ref={card} position={[0, -0.02, 0.012]}>
            <mesh>
              <boxGeometry args={[W * 0.9, H * 0.86, 0.006]} />
              <meshStandardMaterial color="#efe6cf" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0, 0.0035]}>
              <planeGeometry args={[W * 0.9, H * 0.86]} />
              <meshStandardMaterial
                map={textures.card}
                emissiveMap={textures.card}
                emissive="#ffffff"
                emissiveIntensity={0.35}
                roughness={0.85}
                bumpMap={textures.grain}
                bumpScale={0.3}
              />
            </mesh>
          </group>

          {/* Front pocket */}
          <mesh position={[0, 0, 0.025]}>
            <extrudeGeometry args={[pocketShape, { depth: 0.012, bevelEnabled: false }]} />
            <meshStandardMaterial color="#1b3166" {...paper} />
          </mesh>

          {/* Guest's name in gold */}
          <mesh position={[0, -0.7, 0.039]}>
            <planeGeometry args={[2.6, 2.6 * (260 / 1200)]} />
            <meshStandardMaterial map={textures.name} transparent metalness={0.55} roughness={0.35} />
          </mesh>

          {/* Top flap, hinged along the top edge */}
          <group ref={flap} position={[0, H / 2, 0.045]}>
            <mesh>
              <extrudeGeometry args={[flapShape, { depth: 0.012, bevelEnabled: false }]} />
              <meshStandardMaterial color="#24407f" {...paper} side={THREE.DoubleSide} />
            </mesh>
          </group>

          {/* Gold wax seal */}
          <group ref={seal} position={[0, V - 0.06, 0.075]}>
            <WaxSeal face={textures.seal} />
          </group>
        </Float>
      </group>
    </group>
  );
}

function WaxSeal({ face }: { face: THREE.Texture }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.27, 0.29, 0.06, 48]} />
        <meshStandardMaterial color="#d9b25e" metalness={0.75} roughness={0.32} emissive="#5a3f10" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.0305, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.27, 48]} />
        <meshStandardMaterial
          map={face}
          emissiveMap={face}
          emissive="#ffffff"
          emissiveIntensity={0.25}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}
