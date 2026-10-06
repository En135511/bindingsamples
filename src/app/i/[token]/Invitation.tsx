"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { MortarboardIcon } from "@/components/MortarboardIcon";
import type { RsvpStatus } from "@/db/schema";
import { Confetti } from "./Confetti";
import { Countdown } from "./Countdown";
import { Envelope } from "./Envelope";
import { CornerFlourish, Flourish, Laurel, Ribbon } from "./Ornaments";
import { RsvpForm } from "./RsvpForm";
import { requestMotionPermission, useExperienceMode } from "./experience/capabilities";
import { Envelope3D } from "./experience/Envelope3D";
import { ErrorBoundary } from "./experience/ErrorBoundary";
import { sound } from "./experience/sound";
import { SoundToggle } from "./experience/SoundToggle";
import { Tilt3D } from "./experience/Tilt3D";

const CapsBackground = dynamic(() => import("./experience/three/CapsBackground"), { ssr: false });

export type InvitationGuest = {
  name: string;
  maxPartySize: number;
  status: RsvpStatus;
  partySize: number | null;
  note: string | null;
};

export type InvitationEvent = {
  title: string;
  honoreeName: string;
  degree: string | null;
  school: string | null;
  classYear: string | null;
  date: { weekday: string; month: string; day: string; year: string };
  time: string;
  startsAtIso: string;
  venueName: string | null;
  venueAddress: string | null;
  mapUrl: string | null;
  dressCode: string | null;
  message: string | null;
  rsvpBy: string | null;
  photoUrl: string | null;
  googleCalendarUrl: string;
  icsUrl: string;
};

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.45 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: "easeOut" } },
};

export function Invitation({
  token,
  guest,
  event,
}: {
  token: string;
  guest: InvitationGuest;
  event: InvitationEvent;
}) {
  const detected = useExperienceMode();
  const [force2d, setForce2d] = useState(false);
  const mode = detected === "3d" && force2d ? "2d" : detected;
  const [stage, setStage] = useState<"sealed" | "opening" | "open">("sealed");
  const [soundStarted, setSoundStarted] = useState(false);
  const [flash, setFlash] = useState(false);
  const fallBackTo2d = useCallback(() => setForce2d(true), []);
  const startFlash = useCallback(() => setFlash(true), []);
  const finishOpening = useCallback(() => {
    setStage("open");
    setTimeout(() => setFlash(false), 120);
    // The music box starts once the fanfare has rung out.
    sound.startMusic(2.2);
  }, []);

  function open() {
    if (stage !== "sealed") return;
    // A tap is the only moment browsers allow sound and motion sensors to start.
    sound.unlock();
    setSoundStarted(true);
    requestMotionPermission();

    if (mode === "static") {
      sound.fanfare();
      setStage("open");
      sound.startMusic(2.2);
      return;
    }
    setStage("opening");
    // The 3D scene runs its own timeline and sounds; the 2D version follows a shorter one.
    if (mode !== "3d") {
      sound.riser(0.4);
      setTimeout(() => sound.impact(), 400);
      setTimeout(() => sound.swoosh(0.8), 650);
      setTimeout(() => sound.shimmer(), 900);
      setTimeout(() => sound.fanfare(), 1300);
      setTimeout(startFlash, 1600);
      setTimeout(finishOpening, 1900);
    }
  }

  return (
    <main className="cream-sky relative flex-1 overflow-x-hidden">
      {soundStarted && <SoundToggle />}
      {stage === "open" && mode === "3d" && (
        <ErrorBoundary fallback={null}>
          <CapsBackground />
        </ErrorBoundary>
      )}

      {/* The bright flash between the reveal and the invitation */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[70] bg-[#fffaf0]"
        initial={false}
        animate={{ opacity: flash ? 1 : 0 }}
        transition={{ duration: flash ? 0.3 : 1.1, ease: "easeOut" }}
      />

      <AnimatePresence mode="wait">
        {stage !== "open" ? (
          mode === null ? (
            <div key="loading" className="h-dvh" />
          ) : mode === "3d" ? (
            <ErrorBoundary key="envelope-3d" fallback={null} onError={fallBackTo2d}>
              <Envelope3D
                guestName={guest.name}
                classYear={event.classYear}
                honoreeName={event.honoreeName}
                photoUrl={event.photoUrl}
                opening={stage === "opening"}
                onOpen={open}
                onFlash={startFlash}
                onOpened={finishOpening}
                onFail={fallBackTo2d}
              />
            </ErrorBoundary>
          ) : (
            <Envelope key="envelope" guestName={guest.name} opening={stage === "opening"} onOpen={open} />
          )
        ) : (
          <div
            key="card"
            className={`relative z-10 px-3 pb-10 sm:pb-16 ${mode === "3d" ? "pt-[34vh]" : "pt-8 sm:pt-16"}`}
          >
            {mode !== "static" && <Confetti />}
            <Tilt3D className="mx-auto max-w-xl">
              <InvitationCard token={token} guest={guest} event={event} animate={mode !== "static"} />
            </Tilt3D>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

function InvitationCard({
  token,
  guest,
  event,
  animate,
}: {
  token: string;
  guest: InvitationGuest;
  event: InvitationEvent;
  animate: boolean;
}) {
  const honoree = firstName(event.honoreeName);

  return (
    <motion.article
      initial={animate ? { opacity: 0, scale: 0.82, rotateX: 22, y: 80 } : false}
      animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 110, damping: 13, mass: 0.9 }}
      className="gold-foil relative overflow-hidden rounded-[14px] p-[3px] text-ink shadow-[0_2px_0_#e2d3b0,0_4px_0_#d8c69c,0_6px_0_#cdb98a,0_40px_80px_-20px_rgba(120,85,25,0.45),0_20px_40px_-20px_rgba(0,0,0,0.25)]"
    >
      <div className={`paper relative rounded-[11px] px-5 pt-14 pb-12 text-center sm:px-12 sm:pt-16 ${animate ? "shine-once" : ""}`}>
        {/* Frame: a hairline inside the foil edge, with flourishes in each corner */}
        <div className="pointer-events-none absolute inset-3 rounded-[6px] border border-gold-500/45" />
        <CornerFlourish className="pointer-events-none absolute top-2 left-2 h-16 w-16 sm:h-20 sm:w-20" />
        <CornerFlourish className="pointer-events-none absolute top-2 right-2 h-16 w-16 -scale-x-100 sm:h-20 sm:w-20" />
        <CornerFlourish className="pointer-events-none absolute bottom-2 left-2 h-16 w-16 -scale-y-100 sm:h-20 sm:w-20" />
        <CornerFlourish className="pointer-events-none absolute right-2 bottom-2 h-16 w-16 rotate-180 sm:h-20 sm:w-20" />

        <motion.div
          variants={container}
          initial={animate ? "hidden" : false}
          animate="show"
          className="relative space-y-8"
        >
          <motion.header variants={item} className="space-y-5">
            <div className="relative mx-auto h-56 w-56 sm:h-64 sm:w-64">
              <Laurel className="absolute inset-0 h-full w-full" />
              <div className="gold-foil absolute inset-[15%] rounded-full p-[5px] shadow-[0_10px_30px_-8px_rgba(120,85,25,0.55)]">
                {event.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- served from our own route
                  <img
                    src={event.photoUrl}
                    alt={event.honoreeName}
                    className="h-full w-full rounded-full object-cover object-[50%_25%]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center rounded-full bg-cream-50">
                    <MortarboardIcon className="h-16 w-16 text-navy-800" />
                  </div>
                )}
              </div>
            </div>
            <Ribbon>{event.classYear ? `The Class of ${event.classYear}` : "Graduation"}</Ribbon>
          </motion.header>

          <motion.div variants={item} className="space-y-3">
            <p className="font-script text-[2.6rem] leading-tight text-navy-800">Dear {guest.name},</p>
            <p className="mx-auto max-w-sm font-serif text-[15px] tracking-wide text-stone-600 italic">
              together with family and friends, you are warmly invited to celebrate the graduation of
            </p>
          </motion.div>

          <motion.div variants={item} className="space-y-3">
            <h1 className="gold-text-deep font-serif text-[2.7rem] leading-[1.1] font-semibold tracking-wide drop-shadow-[0_1px_0_rgba(255,255,255,0.9)] sm:text-6xl">
              {event.honoreeName}
            </h1>
            {event.degree && <p className="font-serif text-lg text-navy-800 italic">{event.degree}</p>}
            {event.school && (
              <p className="text-xs font-medium tracking-[0.3em] text-stone-500 uppercase">{event.school}</p>
            )}
          </motion.div>

          <motion.div variants={item}>
            <Flourish className="mx-auto h-6 w-60" />
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-3 items-center text-navy-900">
            <p className="border-y border-gold-500/60 py-2.5 text-[11px] font-medium tracking-[0.25em] uppercase sm:text-xs">
              {event.date.weekday}
            </p>
            <div className="font-serif">
              <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">{event.date.month}</p>
              <p className="text-6xl leading-none font-semibold">{event.date.day}</p>
              <p className="text-sm tracking-[0.3em] text-gold-600">{event.date.year}</p>
            </div>
            <p className="border-y border-gold-500/60 py-2.5 text-[11px] font-medium tracking-[0.25em] uppercase sm:text-xs">
              {event.time}
            </p>
          </motion.div>

          {(event.venueName || event.venueAddress) && (
            <motion.div variants={item} className="space-y-1.5">
              {event.venueName && <p className="font-serif text-2xl text-navy-900">{event.venueName}</p>}
              {event.venueAddress && <p className="text-sm text-stone-600">{event.venueAddress}</p>}
              {event.mapUrl && (
                <a
                  href={event.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold-500/60 bg-white/60 px-4 py-1.5 text-sm font-medium text-gold-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  📍 View on map
                </a>
              )}
            </motion.div>
          )}

          {event.dressCode && (
            <motion.p variants={item} className="text-sm text-stone-600">
              <span className="font-medium tracking-[0.25em] text-gold-600 uppercase">Attire</span> ·{" "}
              {event.dressCode}
            </motion.p>
          )}

          {event.message && (
            <motion.figure variants={item} className="relative mx-auto max-w-md px-6">
              <span aria-hidden="true" className="gold-text absolute -top-6 left-0 font-serif text-6xl">
                “
              </span>
              <p className="font-serif text-lg leading-relaxed whitespace-pre-line text-stone-700 italic">
                {event.message}
              </p>
              <span aria-hidden="true" className="gold-text absolute right-0 -bottom-10 font-serif text-6xl">
                ”
              </span>
            </motion.figure>
          )}

          <motion.div variants={item}>
            <Countdown startsAtIso={event.startsAtIso} />
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap justify-center gap-2 text-sm">
            {[
              { href: event.googleCalendarUrl, label: "Google Calendar", external: true },
              { href: event.icsUrl, label: "Apple / Outlook", external: false },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="rounded-full border border-gold-500/50 bg-white/60 px-4 py-2 text-navy-900 shadow-sm transition hover:-translate-y-0.5 hover:border-gold-500 hover:shadow-md"
              >
                <span className="text-gold-600">＋</span> {l.label}
              </a>
            ))}
          </motion.div>

          <motion.div variants={item}>
            <Flourish className="mx-auto h-6 w-60" />
          </motion.div>

          <motion.section variants={item} className="space-y-5" aria-labelledby="rsvp-heading">
            <div>
              <h2 id="rsvp-heading" className="font-serif text-3xl text-navy-900">
                Kindly respond
              </h2>
              {event.rsvpBy && <p className="mt-1 text-sm text-stone-500">by {event.rsvpBy}</p>}
            </div>
            <RsvpForm token={token} guest={guest} honoreeFirstName={honoree} />
          </motion.section>

          <motion.p variants={item} className="gold-text font-script text-4xl">
            With love, {honoree}
          </motion.p>
        </motion.div>
      </div>
    </motion.article>
  );
}
