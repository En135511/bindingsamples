"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { Lights } from "./Lights";
import { Mortarboard } from "./Mortarboard";

// Deterministic "random" so the layout is the same every render.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** Graduation caps tumbling slowly in 3D behind the invitation, moving with the scroll. */
export default function CapsBackground() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 9], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Lights />
      <ScrollParallax />
    </Canvas>
  );
}

function ScrollParallax() {
  const group = useRef<THREE.Group>(null!);
  const caps = useMemo(() => {
    const r = rng(42);
    return Array.from({ length: 24 }, (_, i) => ({
      key: i,
      // Mostly off to the sides, so they peek out around the card.
      position: [(r() < 0.5 ? -1 : 1) * (2.6 + r() * 4.5), 4 - r() * 24, -1.5 - r() * 6.5] as [
        number,
        number,
        number,
      ],
      rotation: [r() * Math.PI, r() * Math.PI, r() * 0.6] as [number, number, number],
      scale: 0.55 + r() * 0.5,
      speed: 0.6 + r() * 1.2,
      spin: (r() - 0.5) * 0.4,
    }));
  }, []);
  const spinners = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, delta) => {
    // Scrolling the page lifts the scene, and nearer caps move faster: real depth.
    const target = window.scrollY * 0.006;
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, target, 6, delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, state.pointer.x * 0.08, 2, delta);
    spinners.current.forEach((s, i) => {
      if (s) s.rotation.y += caps[i].spin * delta;
    });
  });

  return (
    <group ref={group}>
      {/* A big cap tossed in the air, in the space above the card */}
      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.6}>
        <HeroCap />
      </Float>
      <Sparkles count={140} scale={[16, 26, 8]} position={[0, -8, -3]} size={3.2} speed={0.25} color="#c9a24d" opacity={0.9} />
      {caps.map((c, i) => (
        <Float key={c.key} speed={c.speed} rotationIntensity={0.8} floatIntensity={1.2}>
          <group
            ref={(el) => {
              spinners.current[i] = el;
            }}
            position={c.position}
            rotation={c.rotation}
            scale={c.scale}
          >
            <Mortarboard />
          </group>
        </Float>
      ))}
    </group>
  );
}

function HeroCap() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.5;
  });
  return (
    <group position={[0, 2.35, 0]} rotation={[0.45, 0, -0.15]}>
      <group ref={ref} scale={1.35}>
        <Mortarboard />
      </group>
    </group>
  );
}
