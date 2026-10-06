"use client";

import { RoundedBox } from "@react-three/drei";

const GOLD = { color: "#d4ae5c", metalness: 0.9, roughness: 0.3 } as const;

/** A graduation cap built from simple shapes. */
export function Mortarboard({ color = "#203470" }: { color?: string }) {
  return (
    <group>
      <RoundedBox args={[1.2, 0.05, 1.2]} radius={0.02}>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.35} />
      </RoundedBox>
      <mesh position={[0, -0.17, 0]}>
        <cylinderGeometry args={[0.42, 0.46, 0.3, 32]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 16]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {/* Tassel cord to the corner, then hanging down */}
      <mesh position={[0.29, 0.04, 0.29]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[0.82, 0.015, 0.025]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0.58, -0.17, 0.58]}>
        <cylinderGeometry args={[0.014, 0.014, 0.42, 8]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      <mesh position={[0.58, -0.45, 0.58]}>
        <coneGeometry args={[0.07, 0.2, 16]} />
        <meshStandardMaterial {...GOLD} roughness={0.5} />
      </mesh>
    </group>
  );
}
