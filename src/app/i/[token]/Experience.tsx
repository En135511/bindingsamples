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
import { Countdown } from "./Countdown";
import { RsvpForm } from "./RsvpForm";

type Stage = "envelope" | "opening" | "reveal" | "explore" | "respond" | "complete";
type Answer = Exclude<RsvpStatus, "pending">;
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function Portrait({ src, name }: { src: string | null; name: string }) {
  return <div className="experience-portrait-card">
    <div className="experience-portrait-image">
      {src ? <>
        <Image src={src} alt="" aria-hidden="true" width={480} height={600} unoptimized priority className="experience-portrait-backdrop" />
        <Image src={src} alt={name} width={480} height={600} unoptimized priority className="experience-portrait-photo" />
      </> : <MortarboardIcon className="experience-portrait-placeholder" />}
    </div>
  </div>;
}

const Rule = () => <div className="experience-rule" aria-hidden="true"><span>✦</span></div>;

function DetailIcon({ kind }: { kind: "date" | "place" | "school" }) {
  if (kind === "date") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M7 3v4m10-4v4M3 10h18m-13 4h2m4 0h2m-8 4h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
  if (kind === "place") return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.7 7-12a7 7 0 1 0-14 0c0 5.3 7 12 7 12Z" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.5" /></svg>;
  return <MortarboardIcon aria-hidden="true" />;
}

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
      <><nav className="experience-quick-nav" aria-label="Invitation sections">
        <button type="button" aria-current={stage === "reveal" ? "step" : undefined} onClick={() => go("reveal")}>Invitation</button>
        <button type="button" aria-current={stage === "explore" ? "step" : undefined} onClick={() => go("explore")}>Details</button>
        <button type="button" aria-current={stage === "respond" || stage === "complete" ? "step" : undefined} onClick={() => go("respond")}>RSVP</button>
      </nav><svg className="experience-nav-mark" aria-hidden="true" viewBox="0 0 34 42" fill="none"><path d="M17 39V7m0 22C10 22 7 17 6 11m11 11c7-4 10-9 11-15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M17 8C11 6 12 2 17 1c5 1 6 5 0 7ZM8 17c-6-1-8-5-7-9 6 0 9 3 7 9Zm18-4c0-6 3-9 8-9 0 5-2 9-8 9ZM12 26c-6 0-8-4-9-8 5 0 8 3 9 8Zm10-8c0-5 3-8 8-8 0 5-2 8-8 8Z" fill="currentColor"/></svg></>}
    <AnimatePresence mode="wait">
      {(stage === "envelope" || stage === "opening") && <motion.section key="envelope" className="experience-scene" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.04 }}>
        <div className="experience-opening-intro"><p className="experience-kicker">An invitation for</p><h1 ref={focus} tabIndex={-1} className="experience-script">{keepHonorificsTogether(guest.addressee)}</h1></div>
        <Envelope opening={stage === "opening"} onOpen={open} />
      </motion.section>}
      {stage === "reveal" && <motion.section key="reveal" className="experience-scene experience-reveal-scene" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
        <article className="experience-invitation-card">
          <div className="experience-portrait-cluster">
            <div className="experience-side-note experience-side-note-left" aria-hidden="true">A brighter<br />tomorrow<br />together</div>
            <Portrait src={event.photoUrl} name={event.honoreeName} />
            <div className="experience-side-note experience-side-note-right" aria-hidden="true">A new<br />chapter<br />begins</div>
            <div className="experience-seal" aria-label={event.classYear ? `Class of ${event.classYear}` : "Graduation celebration"}>
              <MortarboardIcon aria-hidden="true" />
              <span>{event.classYear ? "Class of" : "Celebrate"}</span>
              {event.classYear && <strong>{event.classYear}</strong>}
            </div>
          </div>
          <div className="experience-invitation-copy">
            <p className="experience-invite-eyebrow">You&apos;re invited to celebrate</p>
            <h1 ref={focus} tabIndex={-1} className="experience-invite-name">{event.honoreeName}</h1>
            <div className="experience-invite-title"><span />{event.title}<span /></div>
            {(event.degree || event.message) && <p className="experience-invite-quote">{event.message ? `“${event.message}”` : event.degree}</p>}
          </div>
          <div className="experience-detail-glass" aria-label="Event at a glance">
            <div className="experience-detail-item"><DetailIcon kind="date" /><span className="experience-detail-overline">{event.date.weekday}</span><strong>{event.date.month} {event.date.day}, {event.date.year}</strong><span>{event.time}</span></div>
            <div className="experience-detail-item"><DetailIcon kind="place" /><span className="experience-detail-overline">Venue</span><strong>{event.venueName ?? event.venueAddress ?? "Details to follow"}</strong></div>
            <div className="experience-detail-item"><DetailIcon kind="school" /><span className="experience-detail-overline">{event.classYear ? `Class of ${event.classYear}` : "Graduation"}</span><strong>{event.school ?? event.degree ?? event.title}</strong></div>
          </div>
          <div className="experience-invitation-footer"><p aria-hidden="true">A brighter tomorrow.</p><button type="button" className="experience-rsvp-call" aria-label={answer ? "Review your RSVP" : undefined} onClick={() => go("respond")}>RSVP<span aria-hidden="true">→</span></button></div>
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
            {(event.school || event.degree) && <p className="experience-soft">{[event.degree, event.school].filter(Boolean).join(" · ")}</p>}
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
