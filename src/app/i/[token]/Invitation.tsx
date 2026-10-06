"use client";

import { useState } from "react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "framer-motion";
import { MortarboardIcon } from "@/components/MortarboardIcon";
import type { RsvpStatus } from "@/db/schema";
import { Confetti } from "./Confetti";
import { Countdown } from "./Countdown";
import { Envelope } from "./Envelope";
import { RsvpForm } from "./RsvpForm";
import { GoldDivider, ParallaxImage, Reveal } from "./ScrollEffects";

export type InvitationGuest = {
  /** The name as written on the invitation, e.g. "Mr. and Mrs. Otieno". */
  addressee: string;
  /** Speaks to more than one person (a couple or a family). */
  plural: boolean;
  /** Seats this invitation carries, set by the host. */
  seats: number;
  status: RsvpStatus;
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

export function Invitation({
  token,
  guest,
  event,
}: {
  token: string;
  guest: InvitationGuest;
  event: InvitationEvent;
}) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<"sealed" | "opening" | "open">("sealed");

  function open() {
    if (stage !== "sealed") return;
    if (reduceMotion) return setStage("open");
    setStage("opening");
    setTimeout(() => setStage("open"), 1800);
  }

  return (
    // "user": animations respect the guest's reduce-motion setting.
    <MotionConfig reducedMotion="user">
      {/* overflow-x-clip (not hidden) so the desktop photo panel can stay sticky */}
      <main className="night-sky flex-1 overflow-x-clip">
        <AnimatePresence mode="wait">
          {stage !== "open" ? (
            <Envelope key="envelope" guestName={guest.addressee} opening={stage === "opening"} onOpen={open} />
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="px-3 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-14"
            >
              {!reduceMotion && <Confetti />}
              <InvitationCard token={token} guest={guest} event={event} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}

function InvitationCard({
  token,
  guest,
  event,
}: {
  token: string;
  guest: InvitationGuest;
  event: InvitationEvent;
}) {
  const honoree = firstName(event.honoreeName);

  return (
    <article
      // Phones: one column. Tablets: a wider single column. Computers: photo panel + details side by side.
      className="mx-auto max-w-[36rem] overflow-clip rounded-md shadow-[0_30px_80px_rgba(0,0,0,0.5)] md:max-w-[46rem] lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:overflow-visible"
    >
      <PhotoPanel event={event} />

      <div className="paper-grain relative p-2 text-ink lg:rounded-r-md">
        <div className="pointer-events-none absolute inset-2 border border-gold-500/60" />
        <div className="pointer-events-none absolute inset-3.5 border-2 border-gold-500/80" />

        <div className="relative space-y-12 px-6 py-14 text-center sm:px-12 sm:py-16 md:px-16 lg:space-y-14 lg:px-16 lg:py-20">
          <Reveal as="header" className="space-y-4">
            <p className="font-script text-[clamp(2.4rem,7vw,3.4rem)] leading-tight text-balance text-navy-800">
              Dear {guest.addressee},
            </p>
            <p className="mx-auto max-w-[30ch] font-body text-[clamp(1.2rem,2.6vw,1.4rem)] leading-snug text-balance text-stone-700 italic">
              together with family and friends, {guest.plural ? "you are all" : "you are"} warmly invited to
              celebrate the graduation of
            </p>
          </Reveal>

          <Reveal className="space-y-3">
            <h1 className="font-serif text-[clamp(2.6rem,7.5vw,4.25rem)] leading-[1.05] font-medium tracking-tight text-balance text-navy-900">
              {event.honoreeName}
            </h1>
            {event.degree && (
              <p className="mx-auto max-w-[34ch] font-body text-[clamp(1.2rem,2.4vw,1.45rem)] leading-snug text-balance text-stone-700 italic">
                {event.degree}
              </p>
            )}
            {event.school && (
              <p className="text-[11px] font-medium tracking-[0.3em] text-balance text-stone-500 uppercase sm:text-xs">
                {event.school}
              </p>
            )}
          </Reveal>

          <GoldDivider />

          <Reveal className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-navy-900 sm:gap-6">
            <p className="border-y border-gold-500/60 py-3 text-[11px] font-medium tracking-[0.25em] uppercase sm:text-xs">
              {event.date.weekday}
            </p>
            <div className="px-1 font-serif">
              <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">{event.date.month}</p>
              <p className="text-[clamp(3.5rem,11vw,4.75rem)] leading-none font-medium">{event.date.day}</p>
              <p className="text-sm tracking-[0.3em] text-gold-600">{event.date.year}</p>
            </div>
            <p className="border-y border-gold-500/60 py-3 text-[11px] font-medium tracking-[0.25em] uppercase sm:text-xs">
              {event.time}
            </p>
          </Reveal>

          {(event.venueName || event.venueAddress) && (
            <Reveal className="space-y-2">
              <p className="text-[11px] font-medium tracking-[0.3em] text-gold-600 uppercase">Where</p>
              {event.venueName && (
                <p className="font-serif text-[clamp(1.6rem,4vw,2rem)] leading-tight text-balance text-navy-900">
                  {event.venueName}
                </p>
              )}
              {event.venueAddress && (
                <p className="font-body text-lg text-pretty text-stone-700">{event.venueAddress}</p>
              )}
              {event.mapUrl && (
                <a
                  href={event.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold-500/60 px-4 py-1.5 text-sm font-medium text-gold-600 transition hover:bg-gold-500/10"
                >
                  View on map <span aria-hidden="true">→</span>
                </a>
              )}
            </Reveal>
          )}

          {event.dressCode && (
            <Reveal className="space-y-1">
              <p className="text-[11px] font-medium tracking-[0.3em] text-gold-600 uppercase">Attire</p>
              <p className="font-body text-xl text-pretty text-stone-700">{event.dressCode}</p>
            </Reveal>
          )}

          {event.message && (
            <Reveal as="figure" className="relative mx-auto max-w-[36ch] px-4">
              <span aria-hidden="true" className="absolute -top-8 -left-1 font-serif text-7xl leading-none text-gold-500/70">
                “
              </span>
              <p className="font-body text-[clamp(1.3rem,2.8vw,1.55rem)] leading-relaxed text-pretty whitespace-pre-line text-stone-800 italic">
                {event.message}
              </p>
              <span aria-hidden="true" className="absolute -right-1 -bottom-12 font-serif text-7xl leading-none text-gold-500/70">
                ”
              </span>
            </Reveal>
          )}

          <Reveal className="space-y-5">
            <Countdown startsAtIso={event.startsAtIso} />
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <a
                href={event.googleCalendarUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-navy-900/20 px-4 py-2 transition hover:border-gold-500 hover:bg-gold-200/30"
              >
                + Google Calendar
              </a>
              <a
                href={event.icsUrl}
                className="rounded-full border border-navy-900/20 px-4 py-2 transition hover:border-gold-500 hover:bg-gold-200/30"
              >
                + Apple / Outlook
              </a>
            </div>
          </Reveal>

          <GoldDivider />

          <Reveal as="section" className="space-y-6">
            <div className="space-y-1.5">
              <h2 id="rsvp-heading" className="font-serif text-[clamp(1.9rem,4.5vw,2.4rem)] text-navy-900">
                Kindly respond
              </h2>
              {event.rsvpBy && <p className="font-body text-lg text-stone-600 italic">by {event.rsvpBy}</p>}
            </div>
            <RsvpForm token={token} guest={guest} honoreeFirstName={honoree} />
          </Reveal>

          <Reveal>
            <p className="font-script text-[clamp(2.2rem,6vw,2.8rem)] text-gold-600">With love, {honoree}</p>
          </Reveal>
        </div>
      </div>
    </article>
  );
}

/**
 * The graduate's photo in a tall gold arch. On phones and tablets it's the top of the card;
 * on computers it's the left half and stays in view while the details scroll past.
 */
function PhotoPanel({ event }: { event: InvitationEvent }) {
  return (
    <div className="relative bg-navy-900 lg:rounded-l-md">
      <div className="flex flex-col items-center gap-6 px-6 pt-10 pb-12 text-center sm:px-10 sm:pt-12 sm:pb-14 lg:sticky lg:top-0 lg:h-dvh lg:max-h-[60rem] lg:justify-center lg:py-12">
        {/* Soft gold light behind the portrait */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_45%,rgba(201,162,77,0.22),transparent_70%)]"
        />

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative text-[11px] font-medium tracking-[0.4em] text-gold-300 uppercase sm:text-xs"
        >
          {event.classYear ? `The Class of ${event.classYear}` : event.title}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-[min(78vw,22rem)] md:w-[24rem] lg:w-[min(100%,26rem,calc((100dvh-14rem)*0.8))]"
        >
          {/* Double gold frame */}
          <div className="arch border-2 border-gold-400 p-2">
            <div className="arch border border-gold-400/60 p-1.5">
              <div className="arch relative aspect-[4/5] overflow-hidden bg-navy-800">
                {event.photoUrl ? (
                  <ParallaxImage
                    src={event.photoUrl}
                    alt={event.honoreeName}
                    className="h-full w-full object-cover object-[50%_25%]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <MortarboardIcon className="h-1/3 w-1/3 text-gold-400" />
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-navy-950/50 to-transparent" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="gold-text relative font-script text-[clamp(2.4rem,7vw,3.25rem)] leading-none"
        >
          {firstName(event.honoreeName)}
        </motion.p>
      </div>
    </div>
  );
}
