"use client";

import { startTransition, useActionState, useState } from "react";
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
  const [editing, setEditing] = useState(answer === null);
  const [choice, setChoice] = useState<Answer | null>(answer);

  const [state, formAction, pending] = useActionState(
    async (prev: RsvpState, formData: FormData) => {
      const result = await submitRsvp(token, prev, formData);
      if (result?.saved) {
        setAnswer(formData.get("status") as Answer);
        setEditing(false);
      }
      return result;
    },
    null,
  );

  // "Joyfully accepts" for one person, "Joyfully accept" for a couple or family.
  const verb = (word: string) => (guest.plural ? word : `${word}s`);
  const you = guest.plural ? "you all" : "you";

  return (
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
              <p className="font-script text-5xl text-gold-300">Wonderful!</p>
              <p className="font-body text-xl text-pretty">
                Can&apos;t wait to celebrate with {you}.{" "}
                {guest.seats > 1 && <>{seatsPhrase(guest.seats)} are reserved in your name.</>}
              </p>
            </>
          ) : (
            <>
              <p className="font-script text-5xl text-gold-300">You&apos;ll be missed</p>
              <p className="font-body text-xl text-pretty">Thank you for letting {honoreeFirstName} know.</p>
            </>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-gold-300/80 underline underline-offset-4 hover:text-gold-200"
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
            const data = new FormData(e.currentTarget);
            startTransition(() => formAction(data));
          }}
          className="mx-auto max-w-md space-y-5 text-left"
        >
          <p className="text-center font-body text-xl text-pretty text-stone-700">
            We have reserved <strong className="font-semibold text-navy-900">{seatsPhrase(guest.seats)}</strong>{" "}
            {guest.seats === 1 ? "for you" : "in your name"}.
          </p>

          <div className="grid grid-cols-2 gap-3 text-center">
            {(
              [
                ["attending", `Joyfully ${verb("accept")}`],
                ["declined", `Regretfully ${verb("decline")}`],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-3.5 text-[15px] font-medium transition focus-within:ring-2 focus-within:ring-gold-400 ${
                  choice === value
                    ? "border-navy-900 bg-navy-900 text-gold-200 shadow-md"
                    : "border-navy-900/20 text-navy-900 hover:border-gold-500"
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={value}
                  checked={choice === value}
                  onChange={() => setChoice(value)}
                  className="sr-only"
                  required
                />
                {label}
              </label>
            ))}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm text-stone-600">A note for {honoreeFirstName} (optional)</span>
            <textarea
              name="note"
              rows={3}
              maxLength={1000}
              defaultValue={guest.note ?? ""}
              className="w-full rounded-md border border-navy-900/20 bg-white/80 px-3 py-2 font-body text-lg outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/30"
            />
          </label>

          {state?.error && <p className="text-sm text-red-700">{state.error}</p>}

          <button
            disabled={pending || !choice}
            className="w-full rounded-md bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 px-4 py-3.5 font-medium tracking-wide text-navy-950 shadow transition hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send my RSVP"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
