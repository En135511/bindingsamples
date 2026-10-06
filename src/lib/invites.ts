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
  if (guest.inviteType === "family" && !/\bfamily\b/i.test(name)) return `${name} and family`;
  return name;
}

/** Whether the invitation speaks to more than one person ("you all", "accept" vs "accepts"). */
export const isPlural = (type: InviteType) => type !== "single";

/** "a seat" / "2 seats" — for "we have reserved … for you". */
export function seatsPhrase(seats: number) {
  return seats === 1 ? "a seat" : `${seats} seats`;
}
