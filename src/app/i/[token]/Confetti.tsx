"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const COLORS = ["#c9a24d", "#ead39a", "#f3e6c0", "#ffffff", "#dcbc6e"];

/** A one-time shower of gold confetti and tiny caps when the invitation opens. */
export function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      drift: (Math.random() - 0.5) * 30,
      delay: Math.random() * 0.8,
      duration: 2.8 + Math.random() * 2,
      rotate: (Math.random() - 0.5) * 720,
      size: 6 + Math.random() * 6,
      color: COLORS[i % COLORS.length],
      round: Math.random() > 0.6,
    })),
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            background: p.color,
            borderRadius: p.round ? "9999px" : "1px",
          }}
          initial={{ y: "-10vh", x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "110vh", x: `${p.drift}vw`, rotate: p.rotate, opacity: [1, 1, 0] }}
          transition={{ delay: p.delay, duration: p.duration, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
