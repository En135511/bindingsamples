"use server";

import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eventPhotos, events, guests } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/datetime";
import { parseGuestLines } from "@/lib/guest-lines";
import { addressee, DEFAULT_FAMILY_SEATS, isInviteType, seatsFor } from "@/lib/invites";
import { MAX_PHOTO_BYTES, PHOTO_TYPES } from "@/lib/photos";

// Unambiguous characters only, so links survive being read aloud or retyped.
const newToken = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 12);

export type FormState = { error?: string; ok?: string } | null;

function optional(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

function parseEvent(formData: FormData) {
  const honoreeName = optional(formData, "honoreeName");
  const startsAt = optional(formData, "startsAt");
  const timezone = optional(formData, "timezone") ?? "UTC";
  if (!honoreeName) return { error: "Please enter the graduate's name." } as const;
  if (!startsAt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(startsAt))
    return { error: "Please choose the date and time." } as const;
  if (!isValidTimeZone(timezone)) return { error: `Unknown time zone "${timezone}".` } as const;

  const hours = Number(formData.get("durationHours") ?? 3);
  return {
    values: {
      honoreeName,
      startsAt: startsAt.slice(0, 16),
      timezone,
      title: optional(formData, "title") ?? "Graduation Celebration",
      durationMinutes: Number.isFinite(hours) && hours > 0 ? Math.round(hours * 60) : 180,
      degree: optional(formData, "degree"),
      school: optional(formData, "school"),
      classYear: optional(formData, "classYear"),
      venueName: optional(formData, "venueName"),
      venueAddress: optional(formData, "venueAddress"),
      mapUrl: optional(formData, "mapUrl"),
      dressCode: optional(formData, "dressCode"),
      message: optional(formData, "message"),
      rsvpBy: optional(formData, "rsvpBy"),
    },
  } as const;
}

export async function createEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseEvent(formData);
  if ("error" in parsed) return { error: parsed.error };
  const [event] = await db.insert(events).values(parsed.values).returning({ id: events.id });
  redirect(`/admin/events/${event.id}`);
}

export async function updateEvent(
  eventId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseEvent(formData);
  if ("error" in parsed) return { error: parsed.error };
  await db.update(events).set(parsed.values).where(eq(events.id, eventId));
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: "Saved." };
}

export async function addGuests(
  eventId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseGuestLines(String(formData.get("guests") ?? ""));
  if (parsed.length === 0) return { error: "Add at least one name." };

  // Add nothing if any line has something we couldn't read, so no seat count is silently wrong.
  const unclear = parsed.filter((g) => g.unrecognized.length > 0);
  if (unclear.length > 0) {
    const examples = unclear
      .slice(0, 3)
      .map((g) => `line ${g.line}: “${g.unrecognized.join(", ")}”`)
      .join("; ");
    return {
      error:
        `Nothing was added — couldn't understand ${examples}${unclear.length > 3 ? " and more" : ""}. ` +
        "After the name use a WhatsApp number with country code, a number of seats, or couple / family 5.",
    };
  }

  await db.insert(guests).values(
    parsed.map(({ name, phone, inviteType, maxPartySize }) => ({
      name: name.slice(0, 120),
      phone,
      inviteType,
      maxPartySize,
      eventId,
      token: newToken(),
    })),
  );
  revalidatePath(`/admin/events/${eventId}`);

  const count = (type: string) => parsed.filter((g) => g.inviteType === type).length;
  const parts = [
    [count("single"), "one person", "one person"],
    [count("couple"), "couple", "couples"],
    [count("family"), "family", "families"],
  ]
    .filter(([n]) => n)
    .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  const seats = parsed.reduce((sum, g) => sum + g.maxPartySize, 0);
  return {
    ok: `Added ${parsed.length} invitation${parsed.length === 1 ? "" : "s"}: ${parts.join(", ")} · ${seats} seat${seats === 1 ? "" : "s"}.`,
  };
}

/** Add one invitation from the form: name, invite type, family size, WhatsApp number. */
export async function addGuest(
  eventId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Please enter who the invitation is for." };
  const inviteType = formData.get("inviteType");
  if (!isInviteType(inviteType)) return { error: "Please choose who the invitation is for." };
  const phone = String(formData.get("phone") ?? "").trim() || null;
  await db.insert(guests).values({
    eventId,
    name: name.slice(0, 120),
    phone,
    inviteType,
    maxPartySize: seatsFor(inviteType, Number(formData.get("seats"))),
    token: newToken(),
  });
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: `Added ${addressee({ name, inviteType })}.` };
}

/** Change a guest's name, invite type and/or seats. Accepted invitations keep counting all seats. */
export async function updateGuest(eventId: number, guestId: number, formData: FormData) {
  await requireAdmin();
  const [guest] = await db
    .select()
    .from(guests)
    .where(and(eq(guests.id, guestId), eq(guests.eventId, eventId)));
  if (!guest) return;

  const nameField = formData.get("name");
  const name = typeof nameField === "string" && nameField.trim() ? nameField.trim().slice(0, 120) : guest.name;
  const typeField = formData.get("inviteType");
  const inviteType = isInviteType(typeField) ? typeField : guest.inviteType;
  const seatsField = formData.get("seats");
  // Switching to "family" without choosing a size starts from the default family size.
  const currentSeats = guest.inviteType === "family" ? guest.maxPartySize : DEFAULT_FAMILY_SEATS;
  const maxPartySize = seatsFor(inviteType, seatsField === null ? currentSeats : Number(seatsField));

  // If the seats change after the guest accepted, their invitation now carries the new count.
  // Otherwise keep their answer (older RSVPs could be for fewer people), capped to the seats.
  const seatsChanged = maxPartySize !== guest.maxPartySize;
  const partySize =
    guest.status !== "attending"
      ? guest.partySize
      : seatsChanged || guest.partySize == null
        ? maxPartySize
        : Math.min(guest.partySize, maxPartySize);

  await db
    .update(guests)
    .set({ name, inviteType, maxPartySize, partySize })
    .where(eq(guests.id, guestId));
  revalidatePath(`/admin/events/${eventId}`);
}

export async function deleteGuest(eventId: number, guestId: number) {
  await requireAdmin();
  await db.delete(guests).where(and(eq(guests.id, guestId), eq(guests.eventId, eventId)));
  revalidatePath(`/admin/events/${eventId}`);
}

export async function uploadPhoto(
  eventId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a photo." };
  if (!PHOTO_TYPES.includes(file.type)) return { error: "Please choose a JPG, PNG or WebP photo." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "That photo is too large." };

  const photo = { contentType: file.type, data: new Uint8Array(await file.arrayBuffer()) };
  await db
    .insert(eventPhotos)
    .values({ eventId, ...photo })
    .onConflictDoUpdate({ target: eventPhotos.eventId, set: photo });
  await db.update(events).set({ photoUpdatedAt: new Date() }).where(eq(events.id, eventId));
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: "Photo saved." };
}

export async function removePhoto(eventId: number) {
  await requireAdmin();
  await db.delete(eventPhotos).where(eq(eventPhotos.eventId, eventId));
  await db.update(events).set({ photoUpdatedAt: null }).where(eq(events.id, eventId));
  revalidatePath(`/admin/events/${eventId}`);
}
