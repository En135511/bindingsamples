"use client";

import { useRef, useState, useTransition } from "react";
import type { Guest } from "@/db/schema";
import {
  addressee,
  DEFAULT_FAMILY_SEATS,
  INVITE_TYPE_LABELS,
  INVITE_TYPES,
  type InviteType,
  MAX_SEATS,
} from "@/lib/invites";
import { deleteGuest, updateGuest } from "../../actions";

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
  const [type, setType] = useState<InviteType>(guest.inviteType);
  const form = useRef<HTMLFormElement>(null);
  // Submit by hand rather than via <form action>: React resets a form after its action,
  // which would put the type dropdown back to its old value on screen.
  const save = () => {
    if (!form.current) return;
    const data = new FormData(form.current);
    startTransition(() => updateGuest(eventId, guest.id, data));
  };
  const who = addressee(guest);
  // What the seats dropdown starts on: the stored count for a family (within the offered range),
  // or the default family size right after switching to "Family" — matching what the server saves.
  const familySeats =
    guest.inviteType === "family" ? Math.min(Math.max(guest.maxPartySize, 2), MAX_SEATS) : DEFAULT_FAMILY_SEATS;

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function remove() {
    if (!confirm(`Remove ${who}? Their link will stop working.`)) return;
    startTransition(() => deleteGuest(eventId, guest.id));
  }

  return (
    <tr className={`block border-b border-stone-100 py-3 align-top sm:table-row sm:py-0 ${pending ? "opacity-50" : ""}`}>
      <td className="block sm:table-cell sm:py-3 sm:pr-3">
        <form
          ref={form}
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="space-y-1.5"
        >
          <input
            name="name"
            defaultValue={guest.name}
            maxLength={120}
            required
            aria-label="Name on the invitation (click to edit)"
            title="Click to edit the name"
            onBlur={(e) => {
              const value = e.currentTarget.value.trim();
              // An empty name isn't saved, so show the saved one again instead of a blank field.
              if (!value) {
                e.currentTarget.value = guest.name;
                return;
              }
              e.currentTarget.value = value;
              if (value !== guest.name) save();
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), e.currentTarget.blur())}
            className="w-full rounded border border-stone-200 bg-white px-2 py-1 font-medium focus:border-navy-700 focus:ring-2 focus:ring-navy-700/20 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              name="inviteType"
              value={type}
              onChange={(e) => {
                setType(e.target.value as InviteType);
                save();
              }}
              aria-label="Invitation type"
              className="rounded border border-stone-200 bg-white px-1 py-0.5 text-xs"
            >
              {INVITE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {INVITE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {type === "family" ? (
              <select
                key={familySeats}
                name="seats"
                defaultValue={familySeats}
                onChange={save}
                aria-label="Seats"
                className="rounded border border-stone-200 bg-white px-1 py-0.5 text-xs"
              >
                {Array.from({ length: MAX_SEATS - 1 }, (_, i) => i + 2).map((n) => (
                  <option key={n} value={n}>
                    {n} seats
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-stone-400">
                {guest.maxPartySize} seat{guest.maxPartySize === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500">
            Reads “<span className="font-serif italic">Dear {who},</span>”
          </p>
        </form>
        {guest.phone && <p className="text-xs text-stone-400">{guest.phone}</p>}
        {guest.note && (
          <p className="mt-1 max-w-xs text-xs whitespace-pre-line text-stone-600 italic">
            “{guest.note}”
          </p>
        )}
      </td>
      <td className="inline-block py-1 pr-3 text-stone-600 sm:table-cell sm:py-3" suppressHydrationWarning>
        <span className="text-xs text-stone-400 sm:hidden">Opened: </span>
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
      <td className="inline-block py-1 pr-3 sm:table-cell sm:py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[guest.status]}`}>
          {STATUS_LABEL[guest.status]}
          {guest.status === "attending" && guest.partySize ? ` · ${guest.partySize}` : ""}
        </span>
      </td>
      <td className="block pt-2 sm:table-cell sm:py-3">
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary flex-1 border-green-600 text-green-700 sm:flex-none"
          >
            WhatsApp
          </a>
          <button onClick={copy} className="btn-secondary">
            {copied ? (
              "Copied!"
            ) : (
              <>
                Copy<span className="hidden sm:inline">&nbsp;link</span>
              </>
            )}
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
