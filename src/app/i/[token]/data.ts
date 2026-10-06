import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events, guests } from "@/db/schema";

/** Look up an invitation by its secret token. Deduplicated per request. */
export const getInvitation = cache(async (token: string) => {
  if (!/^[a-z0-9]{6,32}$/.test(token)) return null;
  const [row] = await db
    .select({ guest: guests, event: events })
    .from(guests)
    .innerJoin(events, eq(guests.eventId, events.id))
    .where(eq(guests.token, token))
    .limit(1);
  return row ?? null;
});
