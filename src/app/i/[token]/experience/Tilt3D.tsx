"use client";

import { useEffect, useRef } from "react";

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

/**
 * Makes its child tilt in 3D with the mouse (desktop) or the phone's motion, with a soft
 * light glare that slides across the surface like on real card stock.
 */
export function Tilt3D({ children, className }: { children: React.ReactNode; className?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let base: { beta: number; gamma: number } | null = null;
    let frame = 0;

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target = {
        x: clamp(((e.clientY / window.innerHeight) - 0.5) * -8, 5),
        y: clamp(((e.clientX / window.innerWidth) - 0.5) * 10, 6),
      };
    };
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      base ??= { beta: e.beta, gamma: e.gamma };
      target = { x: clamp((e.beta - base.beta) * -0.3, 5), y: clamp((e.gamma - base.gamma) * 0.35, 6) };
    };
    const tick = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      if (inner.current) {
        inner.current.style.transform = `rotateX(${current.x.toFixed(2)}deg) rotateY(${current.y.toFixed(2)}deg)`;
      }
      if (glare.current) {
        glare.current.style.backgroundPosition = `${50 + current.y * 6}% ${50 - current.x * 6}%`;
      }
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onPointer);
    window.addEventListener("deviceorientation", onOrientation);
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onOrientation);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={className} style={{ perspective: "1400px" }}>
      <div ref={inner} className="relative" style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
        {children}
        <div
          ref={glare}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-sm mix-blend-soft-light"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 45%)",
            backgroundSize: "220% 220%",
          }}
        />
      </div>
    </div>
  );
}
