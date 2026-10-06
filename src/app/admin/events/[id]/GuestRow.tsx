"use client";

import { useState, useTransition } from "react";
import type { Guest } from "@/db/schema";
import { deleteGuest, updateGuestSeats } from "../../actions";

const STATUS_STYLE = {
  pending: "bg-stone-100 text-stone-600",
  attending: "bg-green-100 text-green-800",
  declined: "bg-red-50 text-red-700",
} as const;

const STATUS_LABEL = { pending: "No reply yet", attending: "Attending", declined: "Declined" };

function relative(date: Date | null) {
  if (!date) return "—";
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function GuestRow({
  eventId,
  guest,
  link,
  whatsappUrl,
}: {
  eventId: number;
  guest: Guest;
  link: string;
  whatsappUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function remove() {
    if (!confirm(`Remove ${guest.name}? Their link will stop working.`)) return;
    startTransition(() => deleteGuest(eventId, guest.id));
  }

  return (
    <tr className={`border-b border-stone-100 align-top ${pending ? "opacity-50" : ""}`}>
      <td className="py-3 pr-3">
        <p className="font-medium">{guest.name}</p>
        {guest.phone && <p className="text-xs text-stone-400">{guest.phone}</p>}
        {guest.note && (
          <p className="mt-1 max-w-xs text-xs whitespace-pre-line text-stone-600 italic">
            “{guest.note}”
          </p>
        )}
      </td>
      <td className="py-3 pr-3">
        <form action={(fd) => startTransition(() => updateGuestSeats(eventId, guest.id, fd))}>
          <select
            name="maxPartySize"
            defaultValue={guest.maxPartySize}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="rounded border border-stone-200 bg-white px-1 py-0.5"
            aria-label="Seats"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </form>
      </td>
      <td className="py-3 pr-3 text-stone-600" suppressHydrationWarning>
        {guest.openCount > 0 ? (
          <>
            {relative(guest.lastOpenedAt)}
            {guest.openCount > 1 && (
              <span className="text-xs text-stone-400"> · {guest.openCount}×</span>
            )}
          </>
        ) : (
          "Not yet"
        )}
      </td>
      <td className="py-3 pr-3">
        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[guest.status]}`}>
          {STATUS_LABEL[guest.status]}
          {guest.status === "attending" && guest.partySize ? ` · ${guest.partySize}` : ""}
        </span>
      </td>
      <td className="py-3">
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary border-green-600 text-green-700"
          >
            WhatsApp
          </a>
          <button onClick={copy} className="btn-secondary">
            {copied ? "Copied!" : "Copy link"}
          </button>
          <a href={`${link}?preview=1`} target="_blank" rel="noreferrer" className="btn-secondary">
            Preview
          </a>
          <button onClick={remove} className="btn-secondary text-red-600" aria-label="Remove guest">
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}
