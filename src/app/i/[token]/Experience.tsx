"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { preload } from "react-dom";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "framer-motion";
import { MortarboardIcon } from "@/components/MortarboardIcon";
import { keepHonorificsTogether } from "@/lib/invites";
import type { RsvpStatus } from "@/db/schema";
import type { InvitationGuest, InvitationEvent } from "./types";
import { Envelope } from "./Envelope";
import { Confetti } from "./Confetti";
import { Countdown } from "./Countdown";
import { RsvpForm } from "./RsvpForm";

type Stage = "envelope" | "opening" | "reveal" | "explore" | "respond" | "complete";
type Answer = Exclude<RsvpStatus, "pending">;
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function Portrait({ src, name }: { src: string | null; name: string }) {
  return <div className="experience-portrait experience-portrait-oval">
    <svg aria-hidden="true" viewBox="0 0 400 400" preserveAspectRatio="none" className="experience-frame" fill="none">
      <ellipse cx="200" cy="200" rx="145" ry="174" stroke="#9e7937" strokeWidth="7" />
      <ellipse cx="200" cy="200" rx="145" ry="174" stroke="#f4dfaa" strokeWidth="3" />
      <ellipse cx="200" cy="200" rx="155" ry="184" stroke="#b69556" strokeWidth="1.5" />
      <path d="M200 8l5 8-5 8-5-8zM200 376l5 8-5 8-5-8z" fill="#caa864" />
    </svg>
    <div className="experience-portrait-image">{src ? <Image src={src} alt={name} width={480} height={480} unoptimized priority className="h-full w-full object-cover object-[50%_22%]" /> : <MortarboardIcon className="h-16 w-16 text-gold-300" />}</div>
  </div>;
}

const Rule = () => <div className="experience-rule" aria-hidden="true"><span>✦</span></div>;

export function Experience({ token, guest, event }: { token: string; guest: InvitationGuest; event: InvitationEvent }) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>("envelope");
  const [answer, setAnswer] = useState<Answer | null>(guest.status === "pending" ? null : guest.status);
  const [exploreView, setExploreView] = useState<"place" | "countdown" | "message">("place");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focus = useRef<HTMLHeadingElement>(null);
  if (event.photoUrl) preload(event.photoUrl, { as: "image" });
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { focus.current?.focus({ preventScroll: true }); }, [stage]);

  const go = (next: Stage) => { window.scrollTo(0, 0); setStage(next); };
  const open = () => {
    if (stage !== "envelope") return;
    if (reduceMotion) return go("reveal");
    setStage("opening");
    timer.current = setTimeout(() => go("reveal"), 1800);
  };
  const number = { envelope: 1, opening: 1, reveal: 2, explore: 3, respond: 4, complete: 5 }[stage];
  const date = `${event.date.weekday}, ${event.date.month} ${event.date.day}, ${event.date.year}`;
  const links = { mapUrl: event.mapUrl, googleCalendarUrl: event.googleCalendarUrl, icsUrl: event.icsUrl };

  return <MotionConfig reducedMotion="user"><main className="night-sky experience-shell flex-1"><div className="experience-stage">
    {stage === "envelope" || stage === "opening" ?
      <div className="experience-chrome" aria-hidden="true"><span>{event.title}</span><span>{String(number).padStart(2, "0")} / 05</span></div> :
      <nav className="experience-quick-nav" aria-label="Invitation sections">
        <button type="button" aria-current={stage === "reveal" ? "step" : undefined} onClick={() => go("reveal")}>Invitation</button>
        <button type="button" aria-current={stage === "explore" ? "step" : undefined} onClick={() => go("explore")}>Details</button>
        <button type="button" aria-current={stage === "respond" || stage === "complete" ? "step" : undefined} onClick={() => go("respond")}>RSVP</button>
      </nav>}
    <AnimatePresence mode="wait">
      {(stage === "envelope" || stage === "opening") && <motion.section key="envelope" className="experience-scene" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.04 }}>
        <div className="experience-opening-intro"><p className="experience-kicker">An invitation for</p><h1 ref={focus} tabIndex={-1} className="experience-script">{keepHonorificsTogether(guest.addressee)}</h1></div>
        <Envelope opening={stage === "opening"} onOpen={open} />
      </motion.section>}
      {stage === "reveal" && <motion.section key="reveal" className="experience-scene" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
        {!reduceMotion && <Confetti />}
        <p className="experience-kicker">With joy, we invite you</p>
        <article className="experience-paper experience-paper-pose"><Portrait src={event.photoUrl} name={event.honoreeName} /><div className="experience-paper-copy">
          <p className="experience-paper-kicker">The graduation of</p><h1 ref={focus} tabIndex={-1} className="experience-name">{event.honoreeName}</h1>
          {(event.degree || event.classYear) && <p className="experience-credential">{[event.degree, event.classYear && `Class of ${event.classYear}`].filter(Boolean).join(" · ")}</p>}
          {event.school && <p className="experience-school">{event.school}</p>}<Rule />
          <p className="experience-date">{date}</p><p className="experience-time">at {event.time}</p>
          {event.venueName && <p className="experience-venue">{event.venueName}</p>}
          <button type="button" className="experience-rsvp-call" onClick={() => go("respond")}>{answer ? "Review your RSVP" : "Will you join us? RSVP"}</button></div>
        </article>
      </motion.section>}
      {stage === "explore" && <motion.section key="explore" className="experience-scene" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
        <p className="experience-kicker">Make the day yours</p><article className="experience-paper">
          <p className="experience-paper-kicker">Your celebration, at a glance</p><h1 ref={focus} tabIndex={-1} className="experience-name experience-name-small">A few lovely details</h1>
          <div className="experience-switch" role="tablist" aria-label="Explore event details">
            <button type="button" role="tab" aria-selected={exploreView === "place"} onClick={() => setExploreView("place")}>The place</button>
            <button type="button" role="tab" aria-selected={exploreView === "countdown"} onClick={() => setExploreView("countdown")}>The countdown</button>
            {event.message && <button type="button" role="tab" aria-selected={exploreView === "message"} onClick={() => setExploreView("message")}>A note</button>}
          </div>
          {exploreView === "place" ? <div role="tabpanel" className="experience-explore-panel"><Rule />
            <p className="experience-date">{date} · {event.time}</p>
            {(event.venueName || event.venueAddress) && <p className="experience-venue">{event.venueName ?? event.venueAddress}</p>}
            {event.venueAddress && <p className="experience-soft">{event.venueAddress}</p>}
            {event.venueAddress && <details className="experience-map"><summary>Preview venue &amp; directions</summary><iframe title={`Map of ${event.venueName ?? event.venueAddress}`} src={`https://maps.google.com/maps?q=${encodeURIComponent(event.venueAddress)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />{event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer">Open directions</a>}</details>}
            {event.dressCode && <p className="experience-soft"><strong>Attire</strong> · {event.dressCode}</p>}
          </div> : exploreView === "countdown" ? <div role="tabpanel" className="experience-explore-panel"><Rule />
            <p className="experience-paper-kicker">Counting down to the celebration</p><Countdown startsAtIso={event.startsAtIso} />
            <p className="experience-soft">Save the date so it is close at hand.</p>
            <details className="experience-calendar"><summary>Add to calendar</summary><div className="experience-links"><a href={event.googleCalendarUrl} target="_blank" rel="noreferrer">Google Calendar</a><a href={event.icsUrl}>Apple / Outlook</a></div></details>
          </div> : <div role="tabpanel" className="experience-explore-panel"><Rule /><p className="experience-message">“{event.message}”</p><p className="experience-soft">With love, {firstName(event.honoreeName)}</p></div>}
        </article>
      </motion.section>}
      {stage === "respond" && <motion.section key="respond" className="experience-scene" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
        <p className="experience-kicker">A reply makes it feel personal</p><article className="experience-paper">
          <p className="experience-paper-kicker">Kindly respond</p><h1 ref={focus} tabIndex={-1} id="rsvp-heading" className="experience-name experience-name-small">Will you join us?</h1>
          {event.rsvpBy && <p className="experience-soft">Please reply by {event.rsvpBy}.</p>}<Rule />
          <RsvpForm token={token} guest={{ ...guest, status: answer ?? "pending" }} honoreeFirstName={firstName(event.honoreeName)} eventLinks={links} forceEdit={Boolean(answer)} onSaved={(status) => { setAnswer(status); go("complete"); }} />
        </article>
      </motion.section>}
      {stage === "complete" && <motion.section key="complete" className="experience-scene" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
        <p className="experience-kicker">After your reply</p><div className="experience-star" aria-hidden="true">✦</div>
        <h1 ref={focus} tabIndex={-1} className="experience-finale">{answer === "declined" ? "You'll be missed." : "You're part of the story."}</h1>
        <p className="experience-subtitle">{answer === "declined" ? `Thank you for letting ${firstName(event.honoreeName)} know.` : `Your reply is saved. We can't wait to celebrate with ${guest.you}.`}</p>
        <div className="experience-final-links">{answer === "attending" && event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer">Open directions</a>}<button onClick={() => go("respond")}>Change my response</button></div>
      </motion.section>}
    </AnimatePresence>
  </div></main></MotionConfig>;
}
