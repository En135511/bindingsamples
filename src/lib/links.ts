import { headers } from "next/headers";
import type { Event, Guest } from "@/db/schema";
import { addressee } from "./invites";
import { toInstant } from "./datetime";

export async function getBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function invitationPath(guest: Pick<Guest, "token">) {
  return `/i/${guest.token}`;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function whatsappShareUrl(guest: Pick<Guest, "name" | "phone" | "inviteType">, event: Event, link: string) {
  const text =
    `Hi ${addressee(guest)}! 🎓 I'd love for you to celebrate my graduation with me. ` +
    `Here is your personal invitation:\n${link}`;
  const phone = guest.phone?.replace(/\D/g, "");
  return `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(text)}`;
}

export function mapsUrl(event: Event) {
  if (event.mapUrl) return event.mapUrl;
  const query = [event.venueName, event.venueAddress].filter(Boolean).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function eventInstants(event: Event) {
  const start = toInstant(event.startsAt, event.timezone);
  const end = new Date(start.getTime() + event.durationMinutes * 60_000);
  return { start, end };
}

/** 20261212T140000Z */
export function icsStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function eventSummary(event: Event) {
  return `${event.honoreeName}'s ${event.title}`;
}

export function eventLocation(event: Event) {
  return [event.venueName, event.venueAddress].filter(Boolean).join(", ");
}

export function googleCalendarUrl(event: Event) {
  const { start, end } = eventInstants(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventSummary(event),
    dates: `${icsStamp(start)}/${icsStamp(end)}`,
    location: eventLocation(event),
    details: event.message ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
