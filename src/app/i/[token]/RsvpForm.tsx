"use client";

import { useActionState, useState } from "react";
import type { RsvpStatus } from "@/db/schema";
import { submitRsvp, type RsvpState } from "./actions";
import type { InvitationGuest } from "./Invitation";

type Answer = { status: Exclude<RsvpStatus, "pending">; partySize: number | null };

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
      }
      return result;
    },
    null,
  );

  if (!editing && answer) {
    return (
      <div className="space-y-3 rounded-md bg-navy-900 px-6 py-6 text-gold-200">
        {answer.status === "attending" ? (
          <>
            <p className="font-script text-4xl text-gold-300">Wonderful!</p>
            <p>
              Can&apos;t wait to celebrate with you
              {answer.partySize && answer.partySize > 1 ? ` — ${answer.partySize} seats reserved` : ""}.
            </p>
          </>
        ) : (
          <>
            <p className="font-script text-4xl text-gold-300">You&apos;ll be missed</p>
            <p>Thank you for letting {honoreeFirstName} know.</p>
          </>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-gold-300/80 underline underline-offset-4 hover:text-gold-200"
        >
          Change my response
        </button>
      </div>
    );
  }

  const option = (value: Answer["status"], label: string) => (
    <label
      className={`flex-1 cursor-pointer rounded-md border px-4 py-3 text-sm transition ${
        choice === value
          ? "border-navy-900 bg-navy-900 text-gold-200"
          : "border-navy-900/20 hover:border-gold-500"
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
  );

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-4 text-left">
      <div className="flex gap-3 text-center">
        {option("attending", "Joyfully accepts")}
        {option("declined", "Regretfully declines")}
      </div>

      {choice === "attending" && guest.maxPartySize > 1 && (
        <label className="block">
          <span className="mb-1 block text-sm text-stone-600">
            How many will attend? We&apos;ve reserved {guest.maxPartySize} seats for you.
          </span>
          <select
            name="partySize"
            defaultValue={answer?.partySize ?? guest.maxPartySize}
            className="w-full rounded-md border border-navy-900/20 bg-white px-3 py-2"
          >
            {Array.from({ length: guest.maxPartySize }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "person" : "people"}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-1 block text-sm text-stone-600">
          A note for {honoreeFirstName} (optional)
        </span>
        <textarea
          name="note"
          rows={3}
          maxLength={1000}
          defaultValue={guest.note ?? ""}
          className="w-full rounded-md border border-navy-900/20 bg-white px-3 py-2"
        />
      </label>

      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}

      <button
        disabled={pending || !choice}
        className="w-full rounded-md bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 px-4 py-3 font-medium tracking-wide text-navy-950 shadow hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send my RSVP"}
      </button>
    </form>
  );
}
