"use client";

import { motion } from "framer-motion";
import { MortarboardIcon } from "@/components/MortarboardIcon";

export function Envelope({
  guestName,
  photoUrl,
  opening,
  onOpen,
}: {
  guestName: string;
  photoUrl: string | null;
  opening: boolean;
  onOpen: () => void;
}) {
  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 0.5 }}
      className="relative flex min-h-dvh flex-col items-center justify-center gap-12 overflow-hidden px-6 py-10"
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
        className="text-center"
      >
        {photoUrl && (
          <div className="relative mx-auto mb-5 grid h-32 w-32 place-items-center sm:h-36 sm:w-36">
            <svg aria-hidden="true" viewBox="0 0 160 160" className="absolute inset-0 h-full w-full" fill="none">
              <circle cx="80" cy="80" r="64" stroke="#d8bc78" strokeWidth="2" />
              <circle cx="80" cy="80" r="69" stroke="#ead7a2" strokeOpacity=".7" />
              {Array.from({ length: 12 }, (_, index) => {
                const angle = (index * 30 * Math.PI) / 180;
                const x = 80 + Math.cos(angle) * 66;
                const y = 80 + Math.sin(angle) * 66;
                return (
                  <g key={index} transform={`translate(${x} ${y}) rotate(${index * 30 + 45})`}>
                    <path d="M0 0C-6-6-6-14 0-18 6-14 6-6 0 0Z" fill="#536f51" stroke="#d8bc78" />
                  </g>
                );
              })}
            </svg>
            <img src={photoUrl} alt="" className="h-[78%] w-[78%] rounded-full border-2 border-gold-200 object-cover object-[50%_22%] shadow-lg" />
          </div>
        )}
        <p className="mb-5 text-[10px] tracking-[0.42em] text-gold-300/75 uppercase">
          A special invitation for
        </p>
        <h1 className="gold-text mt-2 px-2 py-1 font-script text-5xl leading-[1.3] text-balance sm:text-6xl">{guestName}</h1>
      </motion.div>

      <motion.button
        type="button"
        onClick={onOpen}
        // aria-disabled (not disabled) keeps keyboard focus on the button while it opens.
        aria-disabled={opening}
        aria-label="Open your invitation"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={opening ? undefined : { scale: 1.02, rotate: -0.5 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative aspect-[3/2] w-[min(88vw,460px)] cursor-pointer [perspective:1200px] drop-shadow-[0_28px_44px_rgba(0,0,0,.38)]"
      >
        {/* Inside of the envelope */}
        <div className="absolute inset-0 rounded-md bg-navy-950 shadow-[0_25px_60px_rgba(0,0,0,0.6)] ring-1 ring-gold-300/50" />

        {/* The card inside, which slides up once the flap opens */}
        <motion.div
          className="absolute inset-x-[6%] top-[6%] z-[1] flex h-[88%] flex-col items-center justify-center gap-1 rounded-sm bg-paper shadow-md"
          animate={opening ? { y: "-58%" } : { y: 0 }}
          transition={{ delay: 0.55, duration: 0.9, ease: "easeInOut" }}
        >
          <MortarboardIcon className="h-8 w-8 text-gold-500" />
          <p className="font-script text-3xl text-navy-900">You&apos;re invited</p>
        </motion.div>

        {/* Front pocket: covers everything but the top triangle */}
        <div
          className="absolute inset-0 z-[2] rounded-md"
          style={{
            background: "linear-gradient(165deg, #22396e 0%, #142652 55%, #0e1b3a 100%)",
            clipPath: "polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)",
          }}
        />
        <svg
          className="absolute inset-0 z-[2] h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points="0,100 50,56 100,100"
            fill="none"
            stroke="#c9a24d"
            strokeOpacity="0.45"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Top flap */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[58%] origin-top rounded-t-md"
          style={{
            background: "linear-gradient(180deg, #2a4380 0%, #172a55 100%)",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            zIndex: opening ? 0 : 3,
          }}
          animate={opening ? { rotateX: 180 } : { rotateX: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />

        {/* Wax seal */}
        <motion.div
          className="absolute top-[58%] left-1/2 z-[4] -mt-8 -ml-8 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 shadow-[0_4px_12px_rgba(0,0,0,0.5)] ring-2 ring-gold-200/40"
          animate={opening ? { scale: 0, opacity: 0 } : { scale: [1, 1.07, 1] }}
          transition={
            opening ? { duration: 0.3 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <MortarboardIcon className="h-8 w-8 text-navy-900" />
        </motion.div>
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: opening ? 0 : [0.4, 1, 0.4] }}
        transition={opening ? { duration: 0.3 } : { duration: 2.4, repeat: Infinity }}
        className="text-sm tracking-wide text-gold-200/80"
      >
        Tap the envelope to open
      </motion.p>
    </motion.div>
  );
}
