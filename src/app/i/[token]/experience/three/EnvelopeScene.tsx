"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { sound } from "../sound";
import { Glitter, type GlitterApi } from "./Glitter";
import { Lights } from "./Lights";
import { Rays, useRaysUniforms } from "./Rays";
import { cardBack, cardFront, envelopeName, glow, paperGrain, sealFace, shineBand } from "./textures";

const W = 3; // envelope width
const H = 2; // envelope height
const V = -0.15; // where the pocket's V and the flap's tip meet
const CARD_W = W * 0.9;
const CARD_H = H * 0.86;
const SEAL = new THREE.Vector3(0, V - 0.06, 0.08);

// The reveal, in seconds after the tap.
const T = {
  pop: 0.6, // seal bursts
  flap: [0.7, 0.7], // [start, length]
  rise: [1.25, 1.0],
  fly: [2.25, 1.4],
  fall: [2.3, 1.1],
  shine: [3.5, 0.6],
  fanfare: 3.45,
  flash: 3.95,
  done: 4.3,
} as const;

// `?slowmo=20` plays the reveal 20× slower — handy for checking each stage.
const slowMotion =
  typeof window === "undefined" ? 1 : Math.max(1, Number(new URLSearchParams(window.location.search).get("slowmo")) || 1);

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeIn = (x: number) => x * x * x;
const phase = (t: number, [start, length]: readonly [number, number], ease = easeInOut) =>
  ease(clamp01((t - start) / length));

type Props = {
  guestName: string;
  classYear: string | null;
  honoreeName: string;
  photoUrl: string | null;
  opening: boolean;
  onFlash: () => void;
  onOpened: () => void;
  onReady: () => void;
};

export default function EnvelopeScene(props: Props) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={props.onReady}
    >
      <Lights />
      <Sparkles count={70} scale={[9, 7, 4]} size={3.5} speed={0.35} color="#c9a24d" opacity={0.9} />
      <Envelope {...props} />
    </Canvas>
  );
}

function Envelope({ guestName, classYear, honoreeName, photoUrl, opening, onFlash, onOpened }: Props) {
  const tilt = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const flap = useRef<THREE.Group>(null!);
  const card = useRef<THREE.Group>(null!);
  const seal = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  const shine = useRef<THREE.Mesh>(null!);
  const raysGroup = useRef<THREE.Group>(null!);
  const bob = useRef<THREE.Group>(null!);
  const glitter = useRef<GlitterApi | null>(null);
  const rays = useRaysUniforms();
  const startedAt = useRef<number | null>(null);
  const fired = useRef(new Set<string>());
  const { camera, viewport, size } = useThree();
  // Shrink the envelope to fit narrow (portrait phone) screens.
  const fit = Math.min(1, (viewport.width * 0.86) / W);

  const tex = useMemo(
    () => ({
      grain: paperGrain(),
      front: cardFront({ classYear, honoreeName, photoUrl }),
      back: cardBack(),
      name: envelopeName(guestName),
      seal: sealFace(),
      glow: glow(),
      shine: shineBand(),
    }),
    [classYear, honoreeName, photoUrl, guestName],
  );
  useEffect(() => () => Object.values(tex).forEach((t) => t.dispose()), [tex]);

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
  const flapTip = V - H / 2 - 0.08;
  const flapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-W / 2, 0);
    s.lineTo(W / 2, 0);
    s.lineTo(0, flapTip);
    s.closePath();
    return s;
  }, [flapTip]);

  // A wax seal is never a perfect circle: wobble the rim.
  const sealGeometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.3, 0.31, 0.07, 64, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const r = Math.hypot(x, z);
      if (r > 0.2) {
        const a = Math.atan2(z, x);
        const k = 1 + 0.05 * Math.sin(a * 7) + 0.035 * Math.sin(a * 13 + 1.7);
        pos.setX(i, x * k);
        pos.setZ(i, z * k);
      }
    }
    g.computeVertexNormals();
    return g;
  }, []);

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime;
    const g = tilt.current;

    // Idle: rest at a slight angle, sway, and follow the finger/mouse.
    const sway = Math.sin(now * 0.7);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, opening ? 0 : 0.12 - state.pointer.y * 0.22, 4, delta);
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      opening ? 0 : -0.18 + sway * 0.12 + state.pointer.x * 0.32,
      4,
      delta,
    );

    // Gentle floating while idle; settles perfectly still for the reveal so the card flies straight.
    const b = bob.current;
    b.position.y = THREE.MathUtils.damp(b.position.y, opening ? 0 : Math.sin(now * 1.5) * 0.09, 5, delta);
    b.rotation.z = THREE.MathUtils.damp(b.rotation.z, opening ? 0 : Math.sin(now * 1.1) * 0.035, 5, delta);
    b.rotation.x = THREE.MathUtils.damp(b.rotation.x, opening ? 0 : Math.sin(now * 0.9) * 0.05, 5, delta);

    if (!opening) {
      // "Tap here" pulse around the seal, like a game prompt.
      const k = (now % 1.4) / 1.4;
      ring.current.scale.setScalar(1 + k * 0.9);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k);
      return;
    }

    if (startedAt.current === null) startedAt.current = now;
    const t = (now - startedAt.current) / slowMotion;
    const once = (key: string, at: number, fn: () => void) => {
      if (t >= at && !fired.current.has(key)) {
        fired.current.add(key);
        fn();
      }
    };
    ring.current.visible = false;

    // 1. Charge-up: tremble harder and harder while light leaks out around the edges.
    once("riser", 0, () => sound.riser(T.pop));
    const charge = clamp01(t / T.pop);
    const haloMat = halo.current.material as THREE.MeshBasicMaterial;
    if (t < T.pop) {
      const shake = 0.012 + charge * charge * 0.06;
      body.current.position.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0);
      body.current.rotation.z = (Math.random() - 0.5) * shake * 0.8;
      seal.current.scale.setScalar(1 + charge * 0.25);
      halo.current.scale.setScalar(3 + charge * 4);
      haloMat.opacity = charge * 0.9;
    } else {
      body.current.rotation.z = 0;
      haloMat.opacity = Math.max(0, 0.9 - (t - T.pop) * 0.8);
    }

    // 2. Burst: the seal shatters into glitter, the camera shakes.
    once("pop", T.pop, () => {
      sound.impact();
      seal.current.visible = false;
      glitter.current?.burst(SEAL, 110, 3.2);
    });
    const kick = t > T.pop ? Math.max(0, 1 - (t - T.pop) / 0.35) : 0;
    const shakeX = (Math.random() - 0.5) * 0.09 * kick;
    const shakeY = (Math.random() - 0.5) * 0.09 * kick;

    // 3. The flap flies open and light pours out.
    once("flap", T.flap[0], () => sound.swoosh(0.6));
    once("shimmer", T.flap[0] + 0.25, () => sound.shimmer());
    const f = phase(t, T.flap, easeOut);
    flap.current.rotation.x = -Math.PI * 1.06 * f;
    flap.current.position.z = f > 0.55 ? -0.05 : 0.045;
    rays.uIntensity.value = clamp01((t - 0.85) / 0.6);
    raysGroup.current.visible = rays.uIntensity.value > 0;

    if (glitter.current) {
      glitter.current.fountainRate = t > 1.0 && t < 2.4 ? 70 : 0;
      glitter.current.fountainOrigin.set((Math.random() - 0.5) * 2, H / 2 - 0.1, 0.05);
    }

    // 4. The card rises out of the envelope...
    once("rise", T.rise[0], () => sound.swoosh(0.9));
    const rise = phase(t, T.rise);
    // ...then flies at you with a full spin, like an item being revealed.
    once("fly", T.fly[0], () => sound.swoosh(1.1));
    const fly = phase(t, T.fly, easeOut);
    const aspect = size.width / size.height;
    const fraction = aspect < 1 ? 0.94 : 0.5;
    const distance = Math.max(
      (CARD_W * fit) / (fraction * 0.6306 * aspect),
      (CARD_H * fit) / (0.62 * 0.6306),
    );
    const flyZ = (6 - distance) / fit;
    const riseY = -0.02 + rise * 1.6;
    card.current.position.set(0, THREE.MathUtils.lerp(riseY, 0, fly) + Math.sin(fly * Math.PI) * 0.35, THREE.MathUtils.lerp(0.012, flyZ, fly));
    card.current.rotation.y = fly * Math.PI * 2;
    card.current.rotation.x = Math.sin(fly * Math.PI) * -0.25;

    // The envelope drops away below.
    const fall = phase(t, T.fall, easeIn);
    body.current.position.y = -fall * 4.5;
    body.current.rotation.x = fall * 0.8;

    // 5. A glossy shine sweeps across the card, a fanfare, then a flash to the invitation.
    const sh = phase(t, T.shine, easeInOut);
    tex.shine.offset.x = 0.6 - sh * 1.2;
    (shine.current.material as THREE.MeshBasicMaterial).opacity = t > T.shine[0] && t < T.shine[0] + T.shine[1] ? 0.9 : 0;
    once("fanfare", T.fanfare, () => sound.fanfare());
    once("flash", T.flash, onFlash);
    once("done", T.done, onOpened);

    camera.position.set(shakeX, shakeY, 6);
    camera.lookAt(0, 0, 0);
  });

  const paper = { roughness: 0.75, bumpMap: tex.grain, bumpScale: 0.5 };
  const goldLine = { color: "#c9a24d", lineWidth: 2 } as const;

  return (
    <group scale={fit}>
      <group ref={tilt}>
        <Glitter api={glitter} />

        {/* Soft shadow on the "floor" */}
        <mesh position={[0, -1.45, -0.6]} scale={[3.6, 0.7, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex.glow} color="#8a6a2e" transparent opacity={0.35} depthWrite={false} />
        </mesh>

        {/* Warm light leaking out from behind while it charges up */}
        <mesh ref={halo} position={[0, 0, -0.3]} scale={3}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={tex.glow} transparent opacity={0} depthWrite={false} />
        </mesh>

        <group ref={bob}>
          {/* The card (sibling of the envelope body so it can fly free) */}
          <group ref={card} position={[0, -0.02, 0.012]}>
            <group ref={raysGroup} position={[0, 0, -0.1]} visible={false}>
              <Rays uniforms={rays} size={9} />
            </group>
            <mesh>
              <boxGeometry args={[CARD_W, CARD_H, 0.008]} />
              <meshStandardMaterial color="#e9dcc0" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0.0045]}>
              <planeGeometry args={[CARD_W, CARD_H]} />
              <meshStandardMaterial
                map={tex.front}
                emissiveMap={tex.front}
                emissive="#ffffff"
                emissiveIntensity={0.3}
                roughness={0.7}
                metalness={0.05}
                bumpMap={tex.grain}
                bumpScale={0.25}
              />
            </mesh>
            <mesh position={[0, 0, -0.0045]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[CARD_W, CARD_H]} />
              <meshStandardMaterial map={tex.back} metalness={0.7} roughness={0.3} emissiveMap={tex.back} emissive="#ffffff" emissiveIntensity={0.15} />
            </mesh>
            <mesh ref={shine} position={[0, 0, 0.006]}>
              <planeGeometry args={[CARD_W, CARD_H]} />
              <meshBasicMaterial map={tex.shine} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>

          <group ref={body}>
            {/* Back of the envelope, with a gold-foil lining */}
            <RoundedBox args={[W, H, 0.03]} radius={0.015} position={[0, 0, -0.016]}>
              <meshStandardMaterial color="#efe3c8" {...paper} />
            </RoundedBox>
            <mesh position={[0, 0, 0.002]}>
              <planeGeometry args={[W * 0.96, H * 0.96]} />
              <meshStandardMaterial color="#e8c873" metalness={0.45} roughness={0.35} emissive="#c9a24d" emissiveIntensity={0.35} />
            </mesh>

            {/* Front pocket with a gold border */}
            <mesh position={[0, 0, 0.025]}>
              <extrudeGeometry args={[pocketShape, { depth: 0.012, bevelEnabled: false }]} />
              <meshStandardMaterial color="#fff8ea" {...paper} />
            </mesh>
            <Line
              points={[
                [-W / 2 + 0.07, H / 2 - 0.12, 0.038],
                [-W / 2 + 0.07, -H / 2 + 0.07, 0.038],
                [W / 2 - 0.07, -H / 2 + 0.07, 0.038],
                [W / 2 - 0.07, H / 2 - 0.12, 0.038],
              ]}
              {...goldLine}
            />

            {/* Guest's name */}
            <mesh position={[0, -0.68, 0.039]}>
              <planeGeometry args={[2.5, 2.5 * (260 / 1200)]} />
              <meshStandardMaterial map={tex.name} transparent roughness={0.6} />
            </mesh>

            {/* Top flap, hinged along the top edge, with gold trim */}
            <group ref={flap} position={[0, H / 2, 0.045]}>
              <mesh>
                <extrudeGeometry args={[flapShape, { depth: 0.012, bevelEnabled: false }]} />
                <meshStandardMaterial color="#fbf1dc" {...paper} side={THREE.DoubleSide} />
              </mesh>
              <Line
                points={[
                  [-W / 2 + 0.12, -0.04, 0.0135],
                  [0, flapTip + 0.1, 0.0135],
                  [W / 2 - 0.12, -0.04, 0.0135],
                ]}
                {...goldLine}
              />
            </group>
          </group>

          {/* Navy wax seal with an embossed gold cap */}
          <group ref={seal} position={SEAL}>
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh geometry={sealGeometry}>
                <meshStandardMaterial color="#1d2f63" roughness={0.38} metalness={0.15} />
              </mesh>
              <mesh position={[0, 0.0355, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.27, 48]} />
                <meshStandardMaterial map={tex.seal} roughness={0.35} metalness={0.3} />
              </mesh>
            </group>
            {/* Pulsing "tap me" ring */}
            <mesh ref={ring} position={[0, 0, 0.05]}>
              <ringGeometry args={[0.36, 0.385, 64]} />
              <meshBasicMaterial color="#c9a24d" transparent opacity={0.8} depthWrite={false} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
