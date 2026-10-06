"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import {
  addressee,
  DEFAULT_FAMILY_SEATS,
  INVITE_TYPE_LABELS,
  INVITE_TYPES,
  type InviteType,
  MAX_SEATS,
  seatsFor,
} from "@/lib/invites";
import type { FormState } from "../../actions";

const PLACEHOLDER: Record<InviteType, string> = {
  single: "e.g. Aunt Mary",
  couple: "e.g. Mr. and Mrs. Otieno",
  family: "e.g. John Otieno",
};

const HINT: Record<InviteType, string> = {
  single: "One seat.",
  couple: "Two seats. Write the names the way you'd address them.",
  family: "We add “and family” for you. Choose how many seats they get.",
};

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Add one invitation, choosing who it's for. */
export function AddGuestForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, null);
  const [type, setType] = useState<InviteType>("single");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(DEFAULT_FAMILY_SEATS);

  useEffect(() => {
    if (!state?.ok) return;
    // Ready for the next invitation; the chosen type stays selected.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the fields after a successful add
    setName("");
    setPhone("");
  }, [state]);

  const preview = name.trim() ? addressee({ name, inviteType: type }) : null;
  const seatCount = seatsFor(type, seats);

  return (
    <form
      // Submitted by hand (not <form action>) so React doesn't reset the type buttons afterwards.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-4 rounded-xl border border-stone-200 p-4"
    >
      <fieldset>
        <legend className="label">Who is this invitation for?</legend>
        <div className="grid grid-cols-3 gap-2">
          {INVITE_TYPES.map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy-700 has-[:focus-visible]:ring-offset-2 ${
                type === t ? "border-navy-900 bg-navy-900 text-white" : "border-stone-300 hover:border-stone-400"
              }`}
            >
              <input
                type="radio"
                name="inviteType"
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
                className="sr-only"
              />
              {INVITE_TYPE_LABELS[t]}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-stone-500">{HINT[type]}</p>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <label>
          <span className="label">Name on the invitation</span>
          <input
            name="name"
            required
            maxLength={120}
            placeholder={PLACEHOLDER[type]}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {type === "family" && (
          <label>
            <span className="label">Seats</span>
            <input
              name="seats"
              type="number"
              min={2}
              max={MAX_SEATS}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              className="input w-24"
            />
          </label>
        )}
        <label className={type === "family" ? "" : "sm:col-span-2"}>
          <span className="label">WhatsApp number with country code (optional)</span>
          <input
            name="phone"
            type="tel"
            placeholder="+254 712 345678"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="btn-primary">
          {pending ? "Adding…" : "Add invitation"}
        </button>
        {preview && (
          <p className="text-sm text-stone-600">
            Will read: <span className="font-serif text-navy-900 italic">Dear {preview},</span>{" "}
            <span className="text-stone-400">
              · {seatCount} seat{seatCount === 1 ? "" : "s"}
            </span>
          </p>
        )}
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && !preview && <p className="text-sm text-green-700">{state.ok}</p>}
      </div>
    </form>
  );
}

/** Paste a whole list at once. */
export function BulkAddGuests({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the list only once it has been added; if something couldn't be read, keep it to fix.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <details className="group rounded-xl border border-stone-200 p-4">
      <summary className="cursor-pointer text-sm font-medium text-stone-700 select-none">
        Add many at once
      </summary>
      <form
        ref={formRef}
        // Submitted by hand (not <form action>), which would empty the box even when nothing was added.
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => formAction(data));
        }}
        className="mt-3 space-y-2"
      >
        <textarea
          name="guests"
          rows={5}
          className="input font-mono"
          placeholder={"Aunt Mary, +254 712 345678\nMr. and Mrs. Otieno\nJohn Kamau and family, 5\nWanjiru Family, 3"}
        />
        <p className="text-xs leading-relaxed text-stone-500">
          One invitation per line. After the name you can add, separated by commas, a WhatsApp number
          with country code and/or a number of seats — e.g. <code>John Kamau, +254 712 345678, 5</code>.
          Names with “and family” or “Family” become a family and names with “and” or “&amp;” a couple;
          otherwise the number decides (1 = one person, 2 = couple, 3 or more = family). You can also
          write <code>couple</code> or <code>family of 5</code>. If a line can&apos;t be read, nothing
          is added and you&apos;ll be told which line. Names, types and seats can be changed in the list
          below.
        </p>
        <div className="flex items-center gap-4">
          <button disabled={pending} className="btn-secondary">
            {pending ? "Adding…" : "Add all"}
          </button>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state?.ok && <p className="text-sm text-green-700">{state.ok}</p>}
        </div>
      </form>
    </details>
  );
}
