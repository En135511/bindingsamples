import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { guests } from "@/db/schema";
import { dateParts, formatLongDate, formatTime } from "@/lib/datetime";
import { eventInstants, googleCalendarUrl, mapsUrl } from "@/lib/links";
import { getInvitation } from "./data";
import { Invitation } from "./Invitation";

// Link-preview fetchers (WhatsApp, etc.) shouldn't count as the guest opening the invite.
const PREVIEW_BOTS =
  /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|twitter|linkedin|skype|curl|wget/i;

export async function generateMetadata({ params }: PageProps<"/i/[token]">): Promise<Metadata> {
  const invitation = await getInvitation((await params).token);
  if (!invitation) return { title: "Invitation not found" };
  const { event, guest } = invitation;
  const title = `${guest.name}, you're invited! 🎓`;
  const description = `${event.honoreeName}'s ${event.title} · ${formatLongDate(event.startsAt)}`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    robots: { index: false, follow: false },
  };
}

export default async function InvitationPage({ params, searchParams }: PageProps<"/i/[token]">) {
  const { token } = await params;
  const invitation = await getInvitation(token);
  if (!invitation) notFound();
  const { event, guest } = invitation;

  const isPreview = (await searchParams).preview !== undefined;
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") ?? "";
  // Submitting the RSVP re-renders this page; that isn't a new visit.
  const isFormSubmit = requestHeaders.has("next-action");
  if (!isPreview && !isFormSubmit && !PREVIEW_BOTS.test(userAgent)) {
    after(() =>
      db
        .update(guests)
        .set({
          openCount: sql`${guests.openCount} + 1`,
          firstOpenedAt: sql`coalesce(${guests.firstOpenedAt}, now())`,
          lastOpenedAt: sql`now()`,
        })
        .where(eq(guests.id, guest.id)),
    );
  }

  return (
    <Invitation
      token={token}
      guest={{
        name: guest.name,
        maxPartySize: guest.maxPartySize,
        status: guest.status,
        partySize: guest.partySize,
        note: guest.note,
      }}
      event={{
        title: event.title,
        honoreeName: event.honoreeName,
        degree: event.degree,
        school: event.school,
        classYear: event.classYear,
        date: dateParts(event.startsAt),
        time: formatTime(event.startsAt),
        startsAtIso: eventInstants(event).start.toISOString(),
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        mapUrl: mapsUrl(event),
        dressCode: event.dressCode,
        message: event.message,
        rsvpBy: event.rsvpBy ? formatLongDate(event.rsvpBy) : null,
        photoUrl: event.photoUrl,
        googleCalendarUrl: googleCalendarUrl(event),
        icsUrl: `/i/${token}/calendar`,
      }}
    />
  );
}
