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

type Stage = "welcome" | "envelope" | "opening" | "reveal" | "explore" | "respond" | "complete";
type Answer = Exclude<RsvpStatus, "pending">;
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function Portrait({ src, name, small = false }: { src: string | null; name: string; small?: boolean }) {
  return <div className={`experience-portrait ${small ? "experience-portrait-small" : ""}`}>
    <svg aria-hidden="true" viewBox="0 0 400 400" className="experience-wreath" fill="none">
      <circle cx="200" cy="200" r="145" stroke="#d8bc78" strokeWidth="2.5" />
      <circle cx="200" cy="200" r="152" stroke="#ead7a2" strokeOpacity=".7" />
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i * 22.5 * Math.PI) / 180;
        return <g key={i} transform={`translate(${200 + Math.cos(angle) * 149} ${200 + Math.sin(angle) * 149}) rotate(${i * 22.5 + 45})`}>
          <path d="M0 0 C-12 -10 -11 -23 0 -31 C11 -23 12 -10 0 0Z" fill="#536f51" stroke="#d8bc78" strokeWidth="1.5" />
          <path d="M0 -2V-25" stroke="#e3d19d" strokeOpacity=".8" />
        </g>;
      })}
    </svg>
    <div className="experience-portrait-image">{src ? <Image src={src} alt={name} width={480} height={480} unoptimized priority className="h-full w-full object-cover object-[50%_22%]" /> : <MortarboardIcon className="h-16 w-16 text-gold-300" />}</div>
  </div>;
}

const Rule = () => <div className="experience-rule" aria-hidden="true"><span>✦</span></div>;

export function Experience({ token, guest, event }: { token: string; guest: InvitationGuest; event: InvitationEvent }) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>("welcome");
  const [answer, setAnswer] = useState<Answer | null>(guest.status === "pending" ? null : guest.status);
  const [editingResponse, setEditingResponse] = useState(false);
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
  const number = { welcome: 1, envelope: 2, opening: 2, reveal: 3, explore: 4, respond: 5, complete: 6 }[stage];
  const date = `${event.date.weekday}, ${event.date.month} ${event.date.day}, ${event.date.year}`;
  const links = { mapUrl: event.mapUrl, googleCalendarUrl: event.googleCalendarUrl, icsUrl: event.icsUrl };

  return <MotionConfig reducedMotion="user"><main className="night-sky experience-shell flex-1"><div className="experience-stage">
    {stage === "welcome" || stage === "envelope" || stage === "opening" ?
      <div className="experience-chrome" aria-hidden="true"><span>{event.title}</span><span>{String(number).padStart(2, "0")} / 06</span></div> :
      <nav className="experience-quick-nav" aria-label="Invitation sections">
        <button type="button" aria-current={stage === "reveal" ? "step" : undefined} onClick={() => go("reveal")}>Invitation</button>
        <button type="button" aria-current={stage === "explore" ? "step" : undefined} onClick={() => go("explore")}>Details</button>
        <button type="button" aria-current={stage === "respond" || stage === "complete" ? "step" : undefined} onClick={() => go(answer && !editingResponse ? "complete" : "respond")}>RSVP</button>
      </nav>}
    <AnimatePresence mode="wait">
      {stage === "welcome" && <motion.section key="welcome" className="experience-scene" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
        <p className="experience-kicker">A personal invitation for</p><Portrait src={event.photoUrl} name={event.honoreeName} />
        <h1 ref={focus} tabIndex={-1} className="experience-script">{keepHonorificsTogether(guest.addressee)}</h1>
        <p className="experience-subtitle">A little something special is waiting for {guest.you}.</p>
        <button className="experience-primary" onClick={() => go("envelope")}>See your invitation</button>
      </motion.section>}
      {(stage === "envelope" || stage === "opening") && <motion.section key="envelope" className="experience-scene" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.04 }}>
        <h1 ref={focus} tabIndex={-1} className="experience-kicker">Made for {guest.addressee}</h1>
        <Envelope opening={stage === "opening"} onOpen={open} />
      </motion.section>}
      {stage === "reveal" && <motion.section key="reveal" className="experience-scene" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
        {!reduceMotion && <Confetti />}
        <p className="experience-kicker">With joy, we invite you</p>
        <article className="experience-paper"><Portrait src={event.photoUrl} name={event.honoreeName} small />
          <p className="experience-paper-kicker">The graduation of</p><h1 ref={focus} tabIndex={-1} className="experience-name">{event.honoreeName}</h1>
          {(event.degree || event.classYear) && <p className="experience-credential">{[event.degree, event.classYear && `Class of ${event.classYear}`].filter(Boolean).join(" · ")}</p>}
          {event.school && <p className="experience-school">{event.school}</p>}<Rule />
          <p className="experience-date">{date}</p><p className="experience-time">at {event.time}</p>
          {event.venueName && <p className="experience-venue">{event.venueName}</p>}
        </article><button className="experience-primary" onClick={() => go("explore")}>Explore the celebration</button>
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
            <div className="experience-links"><a href={event.googleCalendarUrl} target="_blank" rel="noreferrer">Google Calendar</a><a href={event.icsUrl}>Apple / Outlook</a></div>
          </div> : <div role="tabpanel" className="experience-explore-panel"><Rule /><p className="experience-message">“{event.message}”</p><p className="experience-soft">With love, {firstName(event.honoreeName)}</p></div>}
        </article><div className="experience-nav"><button className="experience-back" onClick={() => go("reveal")}>Back</button><button className="experience-primary" onClick={() => go(answer ? "complete" : "respond")}>{answer ? "View your reply" : "Reply to your invitation"}</button></div>
      </motion.section>}
      {stage === "respond" && <motion.section key="respond" className="experience-scene" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
        <p className="experience-kicker">A reply makes it feel personal</p><article className="experience-paper">
          <p className="experience-paper-kicker">Kindly respond</p><h1 ref={focus} tabIndex={-1} id="rsvp-heading" className="experience-name experience-name-small">Will you join us?</h1>
          {event.rsvpBy && <p className="experience-soft">Please reply by {event.rsvpBy}.</p>}<Rule />
          <RsvpForm token={token} guest={{ ...guest, status: answer ?? "pending" }} honoreeFirstName={firstName(event.honoreeName)} eventLinks={links} forceEdit={Boolean(answer)} onSaved={(status) => { setAnswer(status); setEditingResponse(false); go("complete"); }} />
        </article><button className="experience-back" onClick={() => go("explore")}>Back to details</button>
      </motion.section>}
      {stage === "complete" && <motion.section key="complete" className="experience-scene" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
        <p className="experience-kicker">After your reply</p><div className="experience-star" aria-hidden="true">✦</div>
        <h1 ref={focus} tabIndex={-1} className="experience-finale">{answer === "declined" ? "You'll be missed." : "You're part of the story."}</h1>
        <p className="experience-subtitle">{answer === "declined" ? `Thank you for letting ${firstName(event.honoreeName)} know.` : `Your reply is saved. We can't wait to celebrate with ${guest.you}.`}</p>
        <div className="experience-final-links">{answer === "attending" && <><a href={event.googleCalendarUrl} target="_blank" rel="noreferrer">Save the date</a><a href={event.icsUrl}>Apple / Outlook</a>{event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer">Open directions</a>}</>}<button onClick={() => { setEditingResponse(true); go("respond"); }}>Change my response</button></div>
        <button className="experience-back" onClick={() => go("reveal")}>View the invitation again</button>
      </motion.section>}
    </AnimatePresence>
  </div></main></MotionConfig>;
}
