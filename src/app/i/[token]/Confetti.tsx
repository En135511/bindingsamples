"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const COLORS = ["#c9a24d", "#e6c36a", "#f3e0a6", "#1b2a52", "#b8892e", "#ffffff"];

/** Two confetti cannons fire from the bottom corners, then the pieces flutter down. */
export function Confetti({ count = 90 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      return {
        id: i,
        side,
        // How far across the screen (vw) and how high (vh) each piece is thrown.
        dx: side * -(18 + Math.random() * 55),
        peak: 55 + Math.random() * 35,
        delay: Math.random() * 0.25,
        duration: 2.6 + Math.random() * 1.6,
        rotate: (Math.random() - 0.5) * 1080,
        size: 7 + Math.random() * 7,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.65,
      };
    }),
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute block"
          style={{
            bottom: -20,
            [p.side < 0 ? "left" : "right"]: -10,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? "9999px" : "1px",
            boxShadow: p.color === "#ffffff" ? "0 0 0 1px rgba(201,162,77,0.4)" : undefined,
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [`0vw`, `${p.dx * 0.7}vw`, `${p.dx}vw`],
            y: [`0vh`, `${-p.peak}vh`, `${-p.peak * 0.1}vh`],
            rotate: p.rotate,
            opacity: [1, 1, 0],
          }}
          transition={{
            delay: p.delay,
            duration: p.duration,
            times: [0, 0.35, 1],
            ease: ["easeOut", "easeIn"],
          }}
        />
      ))}
    </div>
  );
}
