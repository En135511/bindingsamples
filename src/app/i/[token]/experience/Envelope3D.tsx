"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Loaded only in the browser, and only when 3D is used.
const EnvelopeScene = dynamic(() => import("./three/EnvelopeScene"), { ssr: false });

export function Envelope3D({
  guestName,
  classYear,
  honoreeName,
  photoUrl,
  opening,
  onOpen,
  onFlash,
  onOpened,
  onFail,
}: {
  guestName: string;
  classYear: string | null;
  honoreeName: string;
  photoUrl: string | null;
  opening: boolean;
  onOpen: () => void;
  onFlash: () => void;
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
      exit={{ opacity: 0, transition: { duration: 0 } }}
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
          honoreeName={honoreeName}
          photoUrl={photoUrl}
          opening={opening}
          onFlash={onFlash}
          onOpened={onOpened}
          onReady={() => setReady(true)}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: opening ? 0 : 1, y: opening ? -24 : 0 }}
        transition={{ duration: 0.6 }}
        className="pointer-events-none absolute inset-x-0 top-[8vh] px-6 text-center"
      >
        <p className="text-[11px] font-medium tracking-[0.4em] text-gold-600 uppercase">
          A special invitation has arrived
        </p>
        <p className="mt-3 font-serif text-lg text-stone-600 italic">for {guestName}</p>
      </motion.div>

      <motion.div
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-none absolute inset-x-0 bottom-[9vh] flex flex-col items-center gap-2"
      >
        {ready ? (
          <motion.p
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="rounded-full bg-white/70 px-5 py-2 text-sm font-medium tracking-wide text-navy-900 shadow-sm ring-1 ring-gold-400/60 backdrop-blur"
          >
            Tap the seal to open
          </motion.p>
        ) : (
          <p className="text-sm text-stone-500">Preparing your invitation…</p>
        )}
        <p className="text-xs text-stone-500">🔊 Turn your sound on</p>
      </motion.div>
    </motion.div>
  );
}
