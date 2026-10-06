"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Rotating shafts of light with a bright core, fading out toward the edge.
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float rays = pow(abs(sin(a * 6.0 + uTime * 0.35)), 8.0)
               + 0.7 * pow(abs(sin(a * 9.0 - uTime * 0.22 + 1.3)), 14.0);
    float fade = smoothstep(1.0, 0.05, r);
    float core = smoothstep(0.45, 0.0, r);
    vec3 color = mix(uColor, vec3(1.0, 0.985, 0.94), core);
    float alpha = (rays * fade * 0.6 + core * 0.85) * uIntensity;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

export type RaysUniforms = { uTime: { value: number }; uIntensity: { value: number }; uColor: { value: THREE.Color } };

/** God rays: the light that pours out when the envelope opens. Drive `uniforms.uIntensity`. */
export function Rays({ uniforms, size = 9 }: { uniforms: RaysUniforms; size?: number }) {
  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
  });
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
      }),
    [uniforms],
  );
  return (
    <mesh material={material} renderOrder={-1}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}

export function useRaysUniforms(): RaysUniforms {
  return useMemo(
    () => ({ uTime: { value: 0 }, uIntensity: { value: 0 }, uColor: { value: new THREE.Color("#f0cd7a") } }),
    [],
  );
}
