"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { MortarboardIcon } from "@/components/MortarboardIcon";
import type { RsvpStatus } from "@/db/schema";
import { Confetti } from "./Confetti";
import { Countdown } from "./Countdown";
import { Envelope } from "./Envelope";
import { RsvpForm } from "./RsvpForm";

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
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3 text-gold-500" aria-hidden="true">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold-500" />
      <span className="text-xs">◆</span>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold-500" />
    </div>
  );
}

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
    <main className="night-sky flex-1 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {stage !== "open" ? (
          <Envelope
            key="envelope"
            guestName={guest.name}
            opening={stage === "opening"}
            onOpen={open}
          />
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="px-3 py-8 sm:py-16"
          >
            {!reduceMotion && <Confetti />}
            <InvitationCard token={token} guest={guest} event={event} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
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
  const location = [event.venueName, event.venueAddress].filter(Boolean);

  return (
    <article className="relative mx-auto max-w-xl rounded-sm bg-paper p-2 text-ink shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
      <div className="border border-gold-500/60 p-1.5">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8 border-2 border-gold-500/80 px-5 py-10 text-center sm:px-12 sm:py-14"
        >
          <motion.header variants={item} className="space-y-4">
            {event.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- served from our own route
              <img
                src={event.photoUrl}
                alt={event.honoreeName}
                className="mx-auto h-40 w-40 rounded-full object-cover object-[50%_25%] ring-4 ring-gold-400 ring-offset-4 ring-offset-paper"
              />
            ) : (
              <MortarboardIcon className="mx-auto h-12 w-12 text-gold-500" />
            )}
            {event.classYear && (
              <p className="text-xs font-medium tracking-[0.35em] text-gold-600 uppercase">
                The Class of {event.classYear}
              </p>
            )}
          </motion.header>

          <motion.div variants={item} className="space-y-3">
            <p className="font-script text-4xl text-navy-800">Dear {guest.name},</p>
            <p className="font-serif text-sm tracking-wide text-stone-600 italic">
              together with family and friends, you are warmly invited
              <br className="hidden sm:block" /> to celebrate the graduation of
            </p>
          </motion.div>

          <motion.div variants={item} className="space-y-2">
            <h1 className="font-serif text-4xl leading-tight tracking-wide text-navy-900 sm:text-5xl">
              {event.honoreeName}
            </h1>
            {event.degree && <p className="font-serif text-lg text-stone-700 italic">{event.degree}</p>}
            {event.school && (
              <p className="text-sm tracking-[0.2em] text-stone-500 uppercase">{event.school}</p>
            )}
          </motion.div>

          <motion.div variants={item}>
            <Ornament />
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-3 items-center text-navy-900">
            <p className="border-y border-gold-500/60 py-2 text-xs tracking-[0.2em] uppercase sm:text-sm">
              {event.date.weekday}
            </p>
            <div className="font-serif">
              <p className="text-xs tracking-[0.25em] text-gold-600 uppercase">{event.date.month}</p>
              <p className="text-5xl leading-none">{event.date.day}</p>
              <p className="text-sm tracking-[0.25em] text-gold-600">{event.date.year}</p>
            </div>
            <p className="border-y border-gold-500/60 py-2 text-xs tracking-[0.2em] uppercase sm:text-sm">
              {event.time}
            </p>
          </motion.div>

          {location.length > 0 && (
            <motion.div variants={item} className="space-y-1">
              {event.venueName && <p className="font-serif text-xl text-navy-900">{event.venueName}</p>}
              {event.venueAddress && <p className="text-sm text-stone-600">{event.venueAddress}</p>}
              {event.mapUrl && (
                <a
                  href={event.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block pt-1 text-sm font-medium text-gold-600 underline-offset-4 hover:underline"
                >
                  View on map →
                </a>
              )}
            </motion.div>
          )}

          {event.dressCode && (
            <motion.p variants={item} className="text-sm text-stone-600">
              <span className="tracking-[0.2em] text-gold-600 uppercase">Attire</span> ·{" "}
              {event.dressCode}
            </motion.p>
          )}

          {event.message && (
            <motion.p
              variants={item}
              className="mx-auto max-w-md font-serif text-lg leading-relaxed whitespace-pre-line text-stone-700 italic"
            >
              {event.message}
            </motion.p>
          )}

          <motion.div variants={item}>
            <Countdown startsAtIso={event.startsAtIso} />
          </motion.div>

          <motion.div variants={item} className="flex flex-wrap justify-center gap-2 text-sm">
            <a
              href={event.googleCalendarUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-navy-900/20 px-4 py-2 hover:border-gold-500 hover:bg-gold-200/30"
            >
              + Google Calendar
            </a>
            <a
              href={event.icsUrl}
              className="rounded-full border border-navy-900/20 px-4 py-2 hover:border-gold-500 hover:bg-gold-200/30"
            >
              + Apple / Outlook
            </a>
          </motion.div>

          <motion.div variants={item}>
            <Ornament />
          </motion.div>

          <motion.section variants={item} className="space-y-5" aria-labelledby="rsvp-heading">
            <div>
              <h2 id="rsvp-heading" className="font-serif text-2xl text-navy-900">
                Kindly respond
              </h2>
              {event.rsvpBy && <p className="text-sm text-stone-500">by {event.rsvpBy}</p>}
            </div>
            <RsvpForm token={token} guest={guest} honoreeFirstName={firstName(event.honoreeName)} />
          </motion.section>

          <motion.p variants={item} className="font-script text-3xl text-gold-600">
            With love, {firstName(event.honoreeName)}
          </motion.p>
        </motion.div>
      </div>
    </article>
  );
}
