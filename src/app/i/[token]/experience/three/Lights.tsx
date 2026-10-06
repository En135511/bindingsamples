"use client";

import { Environment, Lightformer } from "@react-three/drei";

/** Bright, warm studio lighting with a generated reflection map (no files downloaded). */
export function Lights() {
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 5, 5]} intensity={2.4} color="#fff6e6" />
      <pointLight position={[-3, -1, 3]} intensity={12} color="#f0c873" />
      <directionalLight position={[-4, 3, -4]} intensity={1.4} color="#ffffff" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer form="circle" intensity={4} color="#ffe2a0" position={[-5, 0, 3]} scale={3} />
        <Lightformer form="rect" intensity={2} color="#fff8ec" position={[5, -2, 3]} scale={[4, 4, 1]} />
        <Lightformer form="ring" intensity={2} color="#f3d48a" position={[0, 0, -5]} scale={6} />
      </Environment>
    </>
  );
}
