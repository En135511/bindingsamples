"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "framer-motion";
import { MortarboardIcon } from "@/components/MortarboardIcon";
import type { RsvpStatus } from "@/db/schema";
import { Confetti } from "./Confetti";
import { Countdown } from "./Countdown";
import { Envelope } from "./Envelope";
import { keepHonorificsTogether } from "@/lib/invites";
import { RsvpForm } from "./RsvpForm";
import { GoldDivider, ParallaxImage, Reveal } from "./ScrollEffects";

export type InvitationGuest = {
  /** The name as written on the invitation, e.g. "Mr. and Mrs. Otieno". */
  addressee: string;
  /** Speaks to more than one person (a couple or a family). */
  plural: boolean;
  /** "you", "you both" or "you all". */
  you: string;
  /** Seats an accepted RSVP holds (older answers could be fewer than `seats`). */
  acceptedSeats: number | null;
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
  // Start downloading the photo while the guest is still on the envelope (emits a <link rel=preload>).
  if (event.photoUrl) preload(event.photoUrl, { as: "image" });

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
            <Envelope key="envelope" guestName={guest.addressee} photoUrl={event.photoUrl} opening={stage === "opening"} onOpen={open} />
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
  // Move focus to the card when it appears, so keyboard and screen-reader users land on it.
  const cardRef = useRef<HTMLElement>(null);
  useEffect(() => {
    cardRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <article
      ref={cardRef}
      tabIndex={-1}
      aria-labelledby="honoree-name"
      // Keep the portrait and invitation together as one centered, editorial invitation.
      className="mx-auto max-w-[42rem] overflow-clip rounded-md focus:outline-none shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
    >
      <PhotoPanel event={event} />

      <div className="paper-grain relative p-2 text-ink xl:rounded-r-md">
        <div className="pointer-events-none absolute inset-2 border border-gold-500/60" />
        <div className="pointer-events-none absolute inset-3.5 border-2 border-gold-500/80" />

        <div className="relative space-y-12 px-6 py-14 text-center sm:px-12 sm:py-16 md:px-16 xl:space-y-14 xl:py-20">
          <Reveal as="header" className="space-y-4">
            {/* The name is one unit: it moves under "Dear" as a whole rather than splitting. */}
            <p className="font-script text-[clamp(1.9rem,8.5vw,3.4rem)] leading-tight text-balance text-navy-800 xl:text-[clamp(2.4rem,3.6vw,3.4rem)]">
              Dear <span className="inline-block">{keepHonorificsTogether(guest.addressee)},</span>
            </p>
            <p className="mx-auto max-w-[30ch] font-body text-[clamp(1.2rem,2.6vw,1.4rem)] leading-snug text-balance text-stone-700 italic">
              together with family and friends, {guest.you === "you" ? "you are" : `you are ${guest.you.replace("you ", "")}`} warmly invited to
              celebrate the graduation of
            </p>
          </Reveal>

          <Reveal className="space-y-3">
            <h1 id="honoree-name" className="font-serif text-[clamp(2.6rem,7.5vw,4.25rem)] leading-[1.05] font-medium tracking-tight text-balance text-navy-900">
              {event.honoreeName}
            </h1>
            {event.degree && (
              <p className="mx-auto max-w-[34ch] font-body text-[clamp(1.2rem,2.4vw,1.45rem)] leading-snug text-balance text-stone-700 italic">
                {event.degree}
              </p>
            )}
            {event.school && (
              <p className="text-[11px] font-medium tracking-[0.3em] text-balance text-stone-600 uppercase sm:text-xs">
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
              <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">{event.date.month}</p>
              <p className="text-[clamp(3.5rem,11vw,4.75rem)] leading-none font-medium">{event.date.day}</p>
              <p className="text-sm tracking-[0.3em] text-gold-700">{event.date.year}</p>
            </div>
            <p className="border-y border-gold-500/60 py-3 text-[11px] font-medium tracking-[0.25em] uppercase sm:text-xs">
              {event.time}
            </p>
          </Reveal>

          {(event.venueName || event.venueAddress) && (
            <Reveal className="space-y-2">
              <p className="text-[11px] font-medium tracking-[0.3em] text-gold-700 uppercase">Where</p>
              {event.venueName && (
                <p className="font-serif text-[clamp(1.6rem,4vw,2rem)] leading-tight text-balance text-navy-900">
                  {event.venueName}
                </p>
              )}
              {event.venueAddress && (
                <p className="font-body text-lg text-pretty text-stone-700">{event.venueAddress}</p>
              )}
              {event.venueAddress && (
                <details className="group mx-auto mt-4 max-w-md overflow-hidden rounded-md border border-gold-500/40 bg-white/40 text-left">
                  <summary className="cursor-pointer list-none px-4 py-3 text-center text-sm font-medium text-gold-700 marker:hidden hover:bg-gold-200/20 focus-visible:outline-2 focus-visible:outline-gold-700">
                    <span className="group-open:hidden">Preview the venue &amp; directions <span aria-hidden="true">＋</span></span>
                    <span className="hidden group-open:inline">Hide venue preview <span aria-hidden="true">−</span></span>
                  </summary>
                  <iframe
                    title={`Map preview for ${event.venueName ?? event.venueAddress}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(event.venueAddress)}&output=embed`}
                    className="h-56 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <p className="px-4 py-2 text-center text-xs text-stone-600">Explore nearby roads, then open directions when you’re ready.</p>
                </details>
              )}
              {event.mapUrl && (
                <a
                  href={event.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold-500/60 px-4 py-1.5 text-sm font-medium text-gold-700 transition hover:bg-gold-500/10"
                >
                  View on map <span aria-hidden="true">→</span>
                </a>
              )}
            </Reveal>
          )}

          {event.dressCode && (
            <Reveal className="space-y-1">
              <p className="text-[11px] font-medium tracking-[0.3em] text-gold-700 uppercase">Attire</p>
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
            <RsvpForm
              token={token}
              guest={guest}
              honoreeFirstName={honoree}
              eventLinks={{
                mapUrl: event.mapUrl,
                googleCalendarUrl: event.googleCalendarUrl,
                icsUrl: event.icsUrl,
              }}
            />
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
 * The graduate's portrait framed by a delicate gold botanical wreath. On phones and tablets
 * it leads the card; on computers it stays beside the invitation details as guests explore.
 */
function PhotoPanel({ event }: { event: InvitationEvent }) {
  return (
    <div className="relative bg-navy-900">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_#263c38_0%,_#14261f_55%,_#0e1b3a_100%)] sm:aspect-[16/10]"
        >
          {event.photoUrl ? (
            <div className="relative grid aspect-square w-[min(64%,20rem)] place-items-center" aria-label={`${event.honoreeName}'s portrait in a gold botanical frame`}>
              <svg
                aria-hidden="true"
                viewBox="0 0 400 400"
                className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible drop-shadow-[0_3px_5px_rgba(0,0,0,0.65)]"
                fill="none"
              >
                <circle cx="200" cy="200" r="145" stroke="#d8bc78" strokeWidth="2.5" />
                <circle cx="200" cy="200" r="152" stroke="#ead7a2" strokeOpacity=".65" strokeWidth="1" />
                {Array.from({ length: 16 }, (_, index) => {
                  const angle = (index * 22.5 * Math.PI) / 180;
                  const x = 200 + Math.cos(angle) * 149;
                  const y = 200 + Math.sin(angle) * 149;
                  const rotation = index * 22.5 + 45;
                  return (
                    <g key={index} transform={`translate(${x} ${y}) rotate(${rotation})`}>
                      <path d="M0 0 C-12 -10 -11 -23 0 -31 C11 -23 12 -10 0 0Z" fill="#536f51" stroke="#d8bc78" strokeWidth="1.5" />
                      <path d="M0 -2V-25" stroke="#e3d19d" strokeOpacity=".8" strokeWidth="1" />
                    </g>
                  );
                })}
                {Array.from({ length: 8 }, (_, index) => {
                  const angle = ((index * 45 + 22.5) * Math.PI) / 180;
                  const x = 200 + Math.cos(angle) * 150;
                  const y = 200 + Math.sin(angle) * 150;
                  return <circle key={`dot-${index}`} cx={x} cy={y} r="3" fill="#f0d994" />;
                })}
              </svg>
              <div className="absolute inset-[14%] overflow-hidden rounded-full border-2 border-gold-200/80 bg-navy-800 shadow-[0_0_0_5px_rgba(201,162,77,0.2),0_18px_45px_rgba(0,0,0,0.45)]">
                <ParallaxImage
                  src={event.photoUrl}
                  alt={event.honoreeName}
                  className="h-full w-full object-cover object-[50%_22%]"
                />
              </div>
            </div>
          ) : (
            <div className="grid h-full w-full place-items-center">
              <MortarboardIcon className="h-1/3 w-1/3 text-gold-400" />
            </div>
          )}
        </motion.div>

        <div className="flex flex-col items-center gap-2 px-6 pt-5 pb-7 text-center sm:pt-6 sm:pb-8">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-[11px] font-medium tracking-[0.4em] text-gold-300 uppercase sm:text-xs"
          >
            {event.classYear ? `The Class of ${event.classYear}` : event.title}
          </motion.p>
          {/* Generous line height + padding: the gold fill only paints inside the line box,
              and this script's flourishes reach well beyond it. */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.8 }}
            className="gold-text px-3 py-2 font-script text-[clamp(2.6rem,7vw,3.5rem)] leading-[1.35]"
          >
            {firstName(event.honoreeName)}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
