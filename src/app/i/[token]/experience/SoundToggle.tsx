"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { sound } from "./sound";

export function SoundToggle() {
  const muted = useSyncExternalStore(
    (l) => sound.subscribe(l),
    () => sound.muted,
    () => false,
  );

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => sound.setMuted(!muted)}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      className="fixed top-4 right-4 z-50 grid h-11 w-11 place-items-center rounded-full bg-navy-900/80 text-gold-300 ring-1 ring-gold-500/50 backdrop-blur hover:text-gold-200"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
        {muted ? (
          <path d="m16 9 5 6m0-6-5 6" />
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        )}
      </svg>
    </motion.button>
  );
}
