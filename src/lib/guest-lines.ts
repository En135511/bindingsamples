import { DEFAULT_FAMILY_SEATS, type InviteType, seatsFor } from "./invites";

export type ParsedGuest = {
  name: string;
  phone: string | null;
  inviteType: InviteType;
  maxPartySize: number;
  /** 1-based line number in the pasted text, for messages. */
  line: number;
  /** Extras after the name that couldn't be understood. */
  unrecognized: string[];
};

const SEAT_WORDS = "(?:seats?|people|persons?|guests?|pax|ppl)";
const PHONE = /^\+?[\d\s().-]{6,}$/;
// "5", "5 seats", "5 people"
const NUMBER = new RegExp(`^(\\d{1,2})\\s*${SEAT_WORDS}?$`, "i");
// "couple", "single", "one", "family", "family 5", "family of 5", "family of 5 people"
const KEYWORD = new RegExp(`^(single|one|couple|family)(?:\\s+(?:of\\s+)?(\\d{1,2}))?(?:\\s*${SEAT_WORDS})?$`, "i");
const AND_FAMILY = /\s+(?:and|&)\s+family$/i;
// "Otieno family of 5" (no comma before the count)
const FAMILY_OF = new RegExp(`\\s+of\\s+(\\d{1,2})(?:\\s*${SEAT_WORDS})?$`, "i");
const COUPLE = /\s(?:and|&)\s/i;

/**
 * Parse one guest per line. After the name, comma- (or tab-) separated extras are optional:
 * a WhatsApp number, a type ("couple", "family", "family 5", "family of 5") and/or a number
 * of seats ("5", "5 people"). Without a type: "… and family" or "… Family" in the name means
 * a family; otherwise a seat count of 3+ means a family; otherwise "and"/"&" in the name means
 * a couple; otherwise 2 seats means a couple and anything else one person.
 */
export function parseGuestLines(text: string): ParsedGuest[] {
  return text
    .split("\n")
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter(({ line }) => line)
    .map(({ line, number }) => {
      const [rawName, ...rest] = line.split(/[,\t]/).map((p) => p.trim());
      let name = rawName ?? "";
      let phone: string | null = null;
      let type: InviteType | null = null;
      let seats: number | null = null;
      const unrecognized: string[] = [];

      for (const part of rest) {
        if (!part) continue;
        const keyword = KEYWORD.exec(part);
        const count = NUMBER.exec(part);
        if (keyword) {
          const word = keyword[1].toLowerCase();
          type = word === "one" ? "single" : (word as InviteType);
          if (keyword[2]) seats = Number(keyword[2]);
        } else if (count) {
          seats = Number(count[1]);
        } else if (PHONE.test(part)) {
          phone = part;
        } else {
          unrecognized.push(part);
        }
      }

      const familyOf = FAMILY_OF.exec(name);
      if (familyOf && /\bfamily\b/i.test(name.slice(0, familyOf.index))) {
        seats ??= Number(familyOf[1]);
        name = name.slice(0, familyOf.index).trim();
      }
      if (AND_FAMILY.test(name)) {
        name = name.replace(AND_FAMILY, "").trim();
        type ??= "family";
      }
      if (!type) {
        if (/\bfamily\b/i.test(name)) type = "family";
        else if (seats !== null && seats >= 3) type = "family";
        else if (COUPLE.test(name)) type = "couple";
        else if (seats !== null) type = seats === 2 ? "couple" : "single";
        else type = "single";
      }
      const maxPartySize = seatsFor(type, seats ?? DEFAULT_FAMILY_SEATS);
      return { name, phone, inviteType: type, maxPartySize, line: number, unrecognized };
    })
    .filter((g) => g.name);
}
