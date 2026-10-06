import { eventInstants, eventLocation, eventSummary, icsStamp } from "@/lib/links";
import { getInvitation } from "../data";

function escape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export async function GET(_request: Request, { params }: RouteContext<"/i/[token]/calendar">) {
  const { token } = await params;
  const invitation = await getInvitation(token);
  if (!invitation) return new Response("Not found", { status: 404 });
  const { event } = invitation;
  const { start, end } = eventInstants(event);

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Graduation Invitation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${event.id}-${token}@invitation`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${escape(eventSummary(event))}`,
    `LOCATION:${escape(eventLocation(event))}`,
    `DESCRIPTION:${escape(event.message ?? "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="graduation.ics"',
    },
  });
}
