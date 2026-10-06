"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type GlitterApi = {
  /** Throw `count` pieces out from `origin` in every direction. */
  burst: (origin: THREE.Vector3, count: number, speed: number) => void;
  /** Pieces per second sprayed upward from `fountainOrigin` (0 = off). */
  fountainRate: number;
  fountainOrigin: THREE.Vector3;
};

const COLORS = ["#f0d78f", "#c9a24d", "#fff3c4", "#b8892e", "#1d2f63"].map((c) => new THREE.Color(c));

type Piece = {
  alive: boolean;
  life: number;
  size: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  spin: THREE.Vector3;
};

/** Shiny metallic flakes that burst and rain down — the "loot explosion". */
export function Glitter({ api, max = 260 }: { api: React.RefObject<GlitterApi | null>; max?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: max }, () => ({
        alive: false,
        life: 0,
        size: 1,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        rotation: new THREE.Euler(),
        spin: new THREE.Vector3(),
      })),
    [max],
  );
  const next = useRef(0);
  const carry = useRef(0);

  useEffect(() => {
    const spawn = (origin: THREE.Vector3, speed: number, lift: number, spread: number) => {
      const i = next.current++ % max;
      const p = pieces[i];
      const theta = Math.random() * Math.PI * 2;
      const up = Math.random() * 2 - 1;
      const flat = Math.sqrt(1 - up * up);
      p.alive = true;
      p.life = 1.6 + Math.random() * 1.2;
      p.size = 0.6 + Math.random() * 0.9;
      p.position.copy(origin);
      p.velocity
        .set(Math.cos(theta) * flat * spread, up, Math.sin(theta) * flat * spread)
        .multiplyScalar(speed * (0.35 + Math.random() * 0.9));
      p.velocity.y += lift;
      p.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      p.spin.set(Math.random() * 14 - 7, Math.random() * 14 - 7, Math.random() * 14 - 7);
      mesh.current.setColorAt(i, COLORS[i % COLORS.length]);
      if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    };
    api.current = {
      burst: (origin, count, speed) => {
        for (let n = 0; n < count; n++) spawn(origin, speed, 0.8, 1);
      },
      fountainRate: 0,
      fountainOrigin: new THREE.Vector3(),
    };
    // Every instance starts hidden.
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    for (let i = 0; i < max; i++) mesh.current.setMatrixAt(i, dummy.matrix);
    mesh.current.instanceMatrix.needsUpdate = true;
    // Expose spawn for the fountain via a closure on the api object.
    (api.current as GlitterApi & { spawn?: typeof spawn }).spawn = spawn;
  }, [api, dummy, max, pieces]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const a = api.current as (GlitterApi & { spawn?: (o: THREE.Vector3, s: number, l: number, sp: number) => void }) | null;
    if (a?.spawn && a.fountainRate > 0) {
      carry.current += a.fountainRate * delta;
      while (carry.current >= 1) {
        a.spawn(a.fountainOrigin, 1.4, 2.6, 0.7);
        carry.current -= 1;
      }
    }
    let any = false;
    pieces.forEach((p, i) => {
      if (!p.alive) return;
      any = true;
      p.life -= delta;
      if (p.life <= 0) {
        p.alive = false;
        dummy.scale.setScalar(0);
      } else {
        p.velocity.y -= 3.2 * delta;
        p.velocity.multiplyScalar(1 - 0.8 * delta);
        p.position.addScaledVector(p.velocity, delta);
        p.rotation.x += p.spin.x * delta;
        p.rotation.y += p.spin.y * delta;
        p.rotation.z += p.spin.z * delta;
        dummy.position.copy(p.position);
        dummy.rotation.copy(p.rotation);
        dummy.scale.setScalar(p.size * Math.min(1, p.life * 1.5));
      }
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    if (any) mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, max]} frustumCulled={false}>
      <planeGeometry args={[0.06, 0.06]} />
      <meshStandardMaterial
        metalness={1}
        roughness={0.18}
        emissive="#c9a24d"
        emissiveIntensity={0.45}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
