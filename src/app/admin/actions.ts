"use server";

import { and, eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eventPhotos, events, guests } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { isValidTimeZone } from "@/lib/datetime";
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

const PHONE = /^\+?[\d\s().-]{6,}$/;
const SEATS = /^\d{1,2}$/;

/**
 * One guest per line: "Name", optionally followed by a WhatsApp number and/or
 * number of seats, separated by commas — e.g. "Aunt Mary, +254 712 345678, 2".
 */
function parseGuestLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...rest] = line.split(",").map((p) => p.trim());
      let phone: string | null = null;
      let maxPartySize = 1;
      for (const part of rest) {
        if (SEATS.test(part)) maxPartySize = Math.max(1, Number(part));
        else if (PHONE.test(part)) phone = part;
      }
      return { name, phone, maxPartySize };
    })
    .filter((g) => g.name);
}

export async function addGuests(
  eventId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseGuestLines(String(formData.get("guests") ?? ""));
  if (parsed.length === 0) return { error: "Add at least one name." };
  await db.insert(guests).values(parsed.map((g) => ({ ...g, eventId, token: newToken() })));
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: `Added ${parsed.length} guest${parsed.length === 1 ? "" : "s"}.` };
}

export async function updateGuestSeats(eventId: number, guestId: number, formData: FormData) {
  await requireAdmin();
  const seats = Number(formData.get("maxPartySize"));
  if (!Number.isInteger(seats) || seats < 1 || seats > 99) return;
  await db
    .update(guests)
    .set({ maxPartySize: seats })
    .where(and(eq(guests.id, guestId), eq(guests.eventId, eventId)));
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
