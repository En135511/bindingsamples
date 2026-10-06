"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { guests } from "@/db/schema";
import { getInvitation } from "./data";

export type RsvpState = { error?: string; saved?: boolean } | null;

export async function submitRsvp(
  token: string,
  _prev: RsvpState,
  formData: FormData,
): Promise<RsvpState> {
  const invitation = await getInvitation(token);
  if (!invitation) return { error: "This invitation link is no longer valid." };
  const { guest } = invitation;

  const status = formData.get("status");
  if (status !== "attending" && status !== "declined") {
    return { error: "Please let us know whether you can make it." };
  }
  // The host decides how many people an invitation carries; accepting takes all its seats.
  const partySize = status === "attending" ? guest.maxPartySize : null;
  const note = String(formData.get("note") ?? "").trim().slice(0, 1000) || null;

  await db
    .update(guests)
    .set({ status, partySize, note, respondedAt: sql`now()` })
    .where(eq(guests.id, guest.id));
  revalidatePath(`/i/${token}`);
  return { saved: true };
}
