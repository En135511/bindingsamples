"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RsvpStatus } from "@/db/schema";
import { submitRsvp, type RsvpState } from "./actions";
import { Confetti } from "./Confetti";
import { sound } from "./experience/sound";
import type { InvitationGuest } from "./Invitation";

type Answer = { status: Exclude<RsvpStatus, "pending">; partySize: number | null };

const field =
  "w-full rounded-xl border border-gold-500/40 bg-white/80 px-3.5 py-2.5 text-ink shadow-inner outline-none transition focus:border-gold-500 focus:ring-4 focus:ring-gold-400/25";

export function RsvpForm({
  token,
  guest,
  honoreeFirstName,
}: {
  token: string;
  guest: InvitationGuest;
  honoreeFirstName: string;
}) {
  const [answer, setAnswer] = useState<Answer | null>(
    guest.status === "pending" ? null : { status: guest.status, partySize: guest.partySize },
  );
  const [editing, setEditing] = useState(answer === null);
  const [choice, setChoice] = useState<Answer["status"] | null>(answer?.status ?? null);
  const [celebrations, setCelebrations] = useState(0);

  const [state, formAction, pending] = useActionState(
    async (prev: RsvpState, formData: FormData) => {
      const result = await submitRsvp(token, prev, formData);
      if (result?.saved) {
        const status = formData.get("status") as Answer["status"];
        setAnswer({
          status,
          partySize: status === "attending" ? Number(formData.get("partySize") ?? 1) : null,
        });
        setEditing(false);
        if (status === "attending") {
          sound.celebrate();
          setCelebrations((n) => n + 1);
        }
      }
      return result;
    },
    null,
  );

  if (!editing && answer) {
    return (
      <>
        {celebrations > 0 && <Confetti key={celebrations} count={60} />}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 14 }}
          className="gold-foil mx-auto max-w-sm rounded-2xl p-[2px] shadow-[0_12px_30px_-10px_rgba(120,85,25,0.5)]"
        >
          <div className="space-y-2 rounded-[14px] bg-gradient-to-b from-white to-cream-100 px-6 py-7">
            {answer.status === "attending" ? (
              <>
                <p className="text-3xl" aria-hidden="true">🎉</p>
                <p className="gold-text font-script text-5xl">Wonderful!</p>
                <p className="text-stone-700">
                  Can&apos;t wait to celebrate with you
                  {answer.partySize && answer.partySize > 1 ? ` — ${answer.partySize} seats reserved` : ""}.
                </p>
              </>
            ) : (
              <>
                <p className="gold-text font-script text-5xl">You&apos;ll be missed</p>
                <p className="text-stone-700">Thank you for letting {honoreeFirstName} know.</p>
              </>
            )}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="pt-1 text-sm text-gold-600 underline underline-offset-4 hover:text-navy-800"
            >
              Change my response
            </button>
          </div>
        </motion.div>
      </>
    );
  }

  const option = (value: Answer["status"], label: string, icon: string) => {
    const selected = choice === value;
    return (
      <motion.label
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.96 }}
        animate={selected ? { scale: 1.03 } : { scale: 1 }}
        className={`relative flex flex-1 cursor-pointer rounded-2xl p-[2px] text-sm transition ${
          selected ? "gold-foil shadow-[0_0_0_4px_rgba(220,188,110,0.3),0_10px_24px_-8px_rgba(120,85,25,0.6)]" : "bg-gold-500/30"
        }`}
      >
        <span
          className={`flex w-full flex-col items-center justify-center gap-1 rounded-[14px] px-3 py-3.5 ${
            selected ? "bg-navy-900 text-gold-200" : "bg-white/85 text-navy-900"
          }`}
        >
          <span className="text-xl" aria-hidden="true">
            {icon}
          </span>
          <span className="font-medium">{label}</span>
        </span>
        <input
          type="radio"
          name="status"
          value={value}
          checked={selected}
          onChange={() => setChoice(value)}
          className="sr-only"
          required
        />
        <AnimatePresence>
          {selected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="gold-foil absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-navy-900 shadow"
              aria-hidden="true"
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </motion.label>
    );
  };

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-4 text-left">
      <div className="flex gap-3 text-center">
        {option("attending", "Joyfully accepts", "🥂")}
        {option("declined", "Regretfully declines", "💌")}
      </div>

      <AnimatePresence initial={false}>
        {choice === "attending" && guest.maxPartySize > 1 && (
          <motion.label
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="block overflow-hidden"
          >
            <span className="mb-1 block text-sm text-stone-600">
              How many will attend? We&apos;ve reserved {guest.maxPartySize} seats for you.
            </span>
            <select name="partySize" defaultValue={answer?.partySize ?? guest.maxPartySize} className={field}>
              {Array.from({ length: guest.maxPartySize }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "person" : "people"}
                </option>
              ))}
            </select>
          </motion.label>
        )}
      </AnimatePresence>

      <label className="block">
        <span className="mb-1 block text-sm text-stone-600">A note for {honoreeFirstName} (optional)</span>
        <textarea name="note" rows={3} maxLength={1000} defaultValue={guest.note ?? ""} className={field} />
      </label>

      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={pending || !choice}
        className="gold-foil shine-loop w-full rounded-2xl px-4 py-3.5 font-semibold tracking-wide text-[#3d2b0c] shadow-[0_10px_24px_-8px_rgba(120,85,25,0.7)] disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send my RSVP"}
      </motion.button>
    </form>
  );
}
