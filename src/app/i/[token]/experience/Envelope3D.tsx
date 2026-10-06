"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Loaded only in the browser, and only when 3D is used.
const EnvelopeScene = dynamic(() => import("./three/EnvelopeScene"), { ssr: false });

export function Envelope3D({
  guestName,
  classYear,
  opening,
  onOpen,
  onOpened,
  onFail,
}: {
  guestName: string;
  classYear: string | null;
  opening: boolean;
  onOpen: () => void;
  onOpened: () => void;
  onFail: () => void;
}) {
  const [ready, setReady] = useState(false);

  // If the 3D scene hasn't started after a while (very slow phone), fall back.
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(onFail, 12_000);
    return () => clearTimeout(timer);
  }, [ready, onFail]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="relative h-dvh w-full cursor-pointer select-none"
      onClick={() => ready && onOpen()}
      role="button"
      aria-label="Open your invitation"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && ready && onOpen()}
    >
      <div className="absolute inset-0">
        <EnvelopeScene
          guestName={guestName}
          classYear={classYear}
          opening={opening}
          onOpened={onOpened}
          onReady={() => setReady(true)}
        />
      </div>

      <motion.div
        animate={{ opacity: opening ? 0 : 1, y: opening ? -20 : 0 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-none absolute inset-x-0 top-[9vh] px-6 text-center"
      >
        <p className="text-xs tracking-[0.35em] text-gold-300/80 uppercase">
          A special invitation has arrived
        </p>
        <p className="mt-3 font-serif text-lg text-gold-200/70 italic">for {guestName}</p>
      </motion.div>

      <motion.p
        animate={{ opacity: opening ? 0 : ready ? [0.45, 1, 0.45] : 0.6 }}
        transition={opening || !ready ? { duration: 0.3 } : { duration: 2.4, repeat: Infinity }}
        className="pointer-events-none absolute inset-x-0 bottom-[10vh] text-center text-sm tracking-wide text-gold-200/90"
      >
        {ready ? "Tap the envelope to open · sound on 🔊" : "Preparing your invitation…"}
      </motion.p>
    </motion.div>
  );
}
