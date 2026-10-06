"use client";

import { startTransition, useActionState, useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RsvpStatus } from "@/db/schema";
import { seatsPhrase } from "@/lib/invites";
import { submitRsvp, type RsvpState } from "./actions";
import type { InvitationGuest } from "./Invitation";

type Answer = Exclude<RsvpStatus, "pending">;

export function RsvpForm({
  token,
  guest,
  honoreeFirstName,
}: {
  token: string;
  guest: InvitationGuest;
  honoreeFirstName: string;
}) {
  const [answer, setAnswer] = useState<Answer | null>(guest.status === "pending" ? null : guest.status);
  // Seats an acceptance holds: what they answered before, or all of the invitation's seats.
  const [acceptedSeats, setAcceptedSeats] = useState(guest.acceptedSeats ?? guest.seats);
  const [editing, setEditing] = useState(answer === null);
  const [choice, setChoice] = useState<Answer | null>(answer);
  const [announcement, setAnnouncement] = useState("");
  // Only move focus after the guest did something, never when the page first loads. The panels
  // swap one after the other, so focus from a ref callback when the new one actually appears.
  const moveFocus = useRef(false);
  const focusOnAppear = useCallback((el: HTMLElement | null) => {
    if (!el || !moveFocus.current) return;
    moveFocus.current = false;
    el.focus({ preventScroll: true });
  }, []);

  const [state, formAction, pending] = useActionState(
    async (prev: RsvpState, formData: FormData) => {
      const result = await submitRsvp(token, prev, formData);
      if (result?.saved) {
        const status = formData.get("status") as Answer;
        setAnswer(status);
        setAcceptedSeats(guest.seats);
        setEditing(false);
        setAnnouncement(status === "attending" ? "Your RSVP has been sent: attending." : "Your RSVP has been sent.");
        moveFocus.current = true;
      }
      return result;
    },
    null,
  );

  // "Joyfully accepts" for one person, "Joyfully accept" for a couple or family.
  const verb = (word: string) => (guest.plural ? word : `${word}s`);

  return (
    <>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        {!editing && answer ? (
          <motion.div
            key="answered"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mx-auto max-w-md space-y-3 rounded-md bg-navy-900 px-6 py-8 text-gold-200"
          >
            {answer === "attending" ? (
              <>
                <p
                  ref={focusOnAppear}
                  tabIndex={-1}
                  className="font-script text-5xl leading-tight text-gold-300 focus:outline-none"
                >
                  Wonderful!
                </p>
                <p className="font-body text-xl text-pretty">
                  Can&apos;t wait to celebrate with {guest.you}.{" "}
                  {acceptedSeats > 1 && <>{seatsPhrase(acceptedSeats)} are reserved in your name.</>}
                </p>
              </>
            ) : (
              <>
                <p
                  ref={focusOnAppear}
                  tabIndex={-1}
                  className="font-script text-5xl leading-tight text-gold-300 focus:outline-none"
                >
                  You&apos;ll be missed
                </p>
                <p className="font-body text-xl text-pretty">Thank you for letting {honoreeFirstName} know.</p>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setAnnouncement("");
                setEditing(true);
                moveFocus.current = true;
              }}
              className="rounded-sm text-sm text-gold-300/80 underline underline-offset-4 hover:text-gold-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-300"
            >
              Change my response
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Submitted by hand (not <form action>) so a failed send doesn't wipe the guest's note.
            onSubmit={(e) => {
              e.preventDefault();
              if (pending) return;
              const data = new FormData(e.currentTarget);
              startTransition(() => formAction(data));
            }}
            aria-labelledby="rsvp-heading"
            className="mx-auto max-w-md space-y-5 text-left"
          >
            <p className="text-center font-body text-xl text-pretty text-stone-700">
              We have reserved <strong className="font-semibold text-navy-900">{seatsPhrase(guest.seats)}</strong>{" "}
              {guest.seats === 1 ? "for you" : "in your name"}.
            </p>

            <fieldset className="grid grid-cols-2 gap-3 text-center">
              <legend className="sr-only">Will you attend?</legend>
              {(
                [
                  ["attending", "Joyfully", verb("accept")],
                  ["declined", "Regretfully", verb("decline")],
                ] as const
              ).map(([value, adverb, word], i) => (
                <label
                  key={value}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-md border px-3 py-3 leading-tight transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navy-700 ${
                    choice === value
                      ? "border-navy-900 bg-navy-900 text-gold-200 shadow-md"
                      : "border-navy-900/25 text-navy-900 hover:border-gold-500"
                  }`}
                >
                  <input
                    ref={i === 0 ? focusOnAppear : undefined}
                    type="radio"
                    name="status"
                    value={value}
                    checked={choice === value}
                    onChange={() => setChoice(value)}
                    className="sr-only"
                    required
                  />
                  {/* Two deliberate lines, so both choices look the same at every width */}
                  <span className="font-body text-lg italic">{adverb}</span>
                  <span className="text-sm font-medium tracking-wide">{word}</span>
                </label>
              ))}
            </fieldset>

            <label className="block">
              <span className="mb-1.5 block text-sm text-stone-600">A note for {honoreeFirstName} (optional)</span>
              <textarea
                name="note"
                rows={3}
                maxLength={1000}
                defaultValue={guest.note ?? ""}
                className="w-full rounded-md border border-navy-900/25 bg-white/80 px-3 py-2 font-body text-lg focus:border-gold-700 focus:outline-2 focus:outline-offset-1 focus:outline-gold-700"
              />
            </label>

            {state?.error && (
              <p role="alert" className="text-sm text-red-700">
                {state.error}
              </p>
            )}

            <button
              disabled={!choice}
              aria-disabled={pending || !choice}
              className="w-full rounded-md bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 px-4 py-3.5 font-medium tracking-wide text-navy-950 shadow transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700 disabled:opacity-50 aria-disabled:opacity-50"
            >
              {pending ? "Sending…" : "Send my RSVP"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </>
  );
}
