"use client";

import { Environment, Lightformer } from "@react-three/drei";

/** Warm studio lighting with a generated reflection map (no files downloaded). */
export function Lights() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.8} color="#fff4dd" />
      <pointLight position={[-3, -1, 3]} intensity={10} color="#c9a24d" />
      {/* Cool rim light from behind so dark shapes stand out from the night sky */}
      <directionalLight position={[-4, 3, -4]} intensity={2.2} color="#9fb7ff" />
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={2.5} position={[0, 4, 4]} scale={[8, 2, 1]} />
        <Lightformer form="circle" intensity={3} color="#ead39a" position={[-5, 0, 3]} scale={3} />
        <Lightformer form="rect" intensity={1.2} position={[5, -2, 3]} scale={[4, 4, 1]} />
      </Environment>
    </>
  );
}
