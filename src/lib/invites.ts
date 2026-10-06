// How an invitation is addressed and how many seats it carries. The host decides both;
// guests only say yes or no.

export const INVITE_TYPES = ["single", "couple", "family"] as const;
export type InviteType = (typeof INVITE_TYPES)[number];

export const INVITE_TYPE_LABELS: Record<InviteType, string> = {
  single: "One person",
  couple: "Couple",
  family: "Family",
};

export const DEFAULT_FAMILY_SEATS = 4;
export const MAX_SEATS = 20;

export function isInviteType(value: unknown): value is InviteType {
  return typeof value === "string" && (INVITE_TYPES as readonly string[]).includes(value);
}

/** Seats for an invite: fixed for one person and couples, chosen by the host for families. */
export function seatsFor(type: InviteType, familySeats?: number) {
  if (type === "single") return 1;
  if (type === "couple") return 2;
  const n = Math.round(Number(familySeats));
  return Number.isFinite(n) ? Math.min(Math.max(n, 2), MAX_SEATS) : DEFAULT_FAMILY_SEATS;
}

/** The name as written on the invitation: "Aunt Mary", "Mr. and Mrs. Otieno", "John Otieno and family". */
export function addressee(guest: { name: string; inviteType: InviteType }) {
  const name = guest.name.trim();
  if (guest.inviteType === "family") {
    // "The Wanjiru Family" reads better as "Wanjiru Family" after "Dear" or "Hi".
    if (/\bfamily\b/i.test(name)) return name.replace(/^the\s+/i, "");
    return `${name} and family`;
  }
  return name;
}

/** How to say "you" to this invitation: "you", "you both" or "you all". */
export function youFor(type: InviteType) {
  return type === "couple" ? "you both" : type === "family" ? "you all" : "you";
}

const HONORIFIC = "(?:Mr|Mrs|Ms|Miss|Mx|Dr|Prof|Rev|Hon|Sir|Lady)\\.?";

/**
 * Non-breaking spaces so a wrapped greeting never splits "Mr. and Mrs." or "Mrs. Otieno".
 * For display only — the stored name is unchanged.
 */
export function keepHonorificsTogether(text: string) {
  return text
    .replace(new RegExp(`\\b(${HONORIFIC})\\s+`, "g"), "$1\u00a0")
    .replace(new RegExp(`\\s(and|&)\\s(?=${HONORIFIC})`, "g"), "\u00a0$1\u00a0");
}

/** Whether the invitation speaks to more than one person ("you all", "accept" vs "accepts"). */
export const isPlural = (type: InviteType) => type !== "single";

/** "a seat" / "2 seats" — for "we have reserved … for you". */
export function seatsPhrase(seats: number) {
  return seats === 1 ? "a seat" : `${seats} seats`;
}
