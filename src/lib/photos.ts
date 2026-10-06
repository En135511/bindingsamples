import { eq } from "drizzle-orm";
import { db } from "@/db";
import { eventPhotos } from "@/db/schema";

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
// The dashboard shrinks photos before upload, so real uploads are far below this.
export const MAX_PHOTO_BYTES = 900 * 1024;

export async function getEventPhoto(eventId: number) {
  const [photo] = await db.select().from(eventPhotos).where(eq(eventPhotos.eventId, eventId));
  return photo ?? null;
}

export async function photoResponse(eventId: number) {
  const photo = await getEventPhoto(eventId);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      // URLs carry a ?v= version that changes on every upload, so they can be cached for long.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/** A data: URL, for embedding the photo in the link-preview image. */
export async function photoDataUrl(eventId: number) {
  const photo = await getEventPhoto(eventId);
  if (!photo || photo.contentType === "image/webp") return null;
  return `data:${photo.contentType};base64,${Buffer.from(photo.data).toString("base64")}`;
}
