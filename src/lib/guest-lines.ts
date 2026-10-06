import { DEFAULT_FAMILY_SEATS, type InviteType, seatsFor } from "./invites";

export type ParsedGuest = { name: string; phone: string | null; inviteType: InviteType; maxPartySize: number };

const PHONE = /^\+?[\d\s().-]{6,}$/;
const NUMBER = /^\d{1,2}$/;
const KEYWORD = /^(single|one|couple|family)(?:\s+(\d{1,2}))?$/i;
const AND_FAMILY = /\s+(?:and|&)\s+family$/i;
const COUPLE = /\s(?:and|&)\s/i;

/**
 * Parse one guest per line. After the name, comma-separated extras are optional:
 * a WhatsApp number, a type ("couple", "family", "family 5") and/or a number of seats.
 * Without a type, the name decides: "… and family" or "The … Family" → family,
 * "Mr. and Mrs. …" (any "and"/"&") → couple, otherwise one person. A bare number of
 * seats on its own means 1 → one person, 2 → couple, 3+ → family.
 */
export function parseGuestLines(text: string): ParsedGuest[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawName, ...rest] = line.split(",").map((p) => p.trim());
      let name = rawName ?? "";
      let phone: string | null = null;
      let type: InviteType | null = null;
      let seats: number | null = null;

      for (const part of rest) {
        const keyword = KEYWORD.exec(part);
        if (keyword) {
          const word = keyword[1].toLowerCase();
          type = word === "one" ? "single" : (word as InviteType);
          if (keyword[2]) seats = Number(keyword[2]);
        } else if (NUMBER.test(part)) {
          seats = Number(part);
        } else if (PHONE.test(part)) {
          phone = part;
        }
      }

      if (AND_FAMILY.test(name)) {
        name = name.replace(AND_FAMILY, "").trim();
        type ??= "family";
      }
      if (!type) {
        if (/\bfamily\b/i.test(name)) type = "family";
        else if (COUPLE.test(name)) type = "couple";
        else if (seats !== null) type = seats >= 3 ? "family" : seats === 2 ? "couple" : "single";
        else type = "single";
      }
      const maxPartySize = seatsFor(type, seats ?? DEFAULT_FAMILY_SEATS);
      return { name, phone, inviteType: type, maxPartySize };
    })
    .filter((g) => g.name);
}
