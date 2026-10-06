import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { events, guests } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatLongDate, formatTime } from "@/lib/datetime";
import { getBaseUrl, invitationPath, whatsappShareUrl } from "@/lib/links";
import { addGuest, addGuests, removePhoto, updateEvent, uploadPhoto } from "../../actions";
import { EventForm } from "../../EventForm";
import { AddGuestForm, BulkAddGuests } from "./AddGuestForm";
import { GuestRow } from "./GuestRow";
import { PhotoUpload } from "./PhotoUpload";

export default async function EventAdminPage({ params }: PageProps<"/admin/events/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const event = await db.query.events.findFirst({ where: eq(events.id, id) });
  if (!event) notFound();
  const guestList = await db
    .select()
    .from(guests)
    .where(eq(guests.eventId, id))
    .orderBy(asc(guests.createdAt), asc(guests.id));
  const baseUrl = await getBaseUrl();

  const attending = guestList.filter((g) => g.status === "attending");
  const declined = guestList.filter((g) => g.status === "declined");
  const awaiting = guestList.filter((g) => g.status === "pending");
  const seats = (list: typeof guestList) => list.reduce((sum, g) => sum + g.maxPartySize, 0);
  const seatLabel = (n: number) => `${n} seat${n === 1 ? "" : "s"}`;
  // Invitations and people side by side, so seats invited = attending + declined + awaiting.
  const stats: { label: string; value: number; sub?: string }[] = [
    { label: "Invitations", value: guestList.length },
    { label: "Seats invited", value: seats(guestList) },
    { label: "Invitations opened", value: guestList.filter((g) => g.openCount > 0).length },
    {
      label: "People attending",
      value: attending.reduce((sum, g) => sum + (g.partySize ?? g.maxPartySize), 0),
      sub: `${attending.length} invitation${attending.length === 1 ? "" : "s"}`,
    },
    { label: "Declined", value: declined.length, sub: seatLabel(seats(declined)) },
    { label: "Awaiting reply", value: awaiting.length, sub: seatLabel(seats(awaiting)) },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8">
      <div>
        <Link href="/admin" className="text-sm text-stone-500 hover:text-stone-900">
          ← All events
        </Link>
        <h1 className="mt-2 font-serif text-3xl">
          {event.honoreeName} — {event.title}
        </h1>
        <p className="text-stone-500">
          {formatLongDate(event.startsAt)} at {formatTime(event.startsAt)}
          {event.venueName && ` · ${event.venueName}`}
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
            {s.sub && <p className="text-xs text-stone-400">{s.sub}</p>}
          </div>
        ))}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 font-serif text-xl">Guests</h2>
        <p className="mb-4 text-sm text-stone-500">
          Each guest gets their own link. Tap <strong>WhatsApp</strong> to send it, or copy it and
          paste it anywhere.
        </p>
        <div className="space-y-3">
          <AddGuestForm action={addGuest.bind(null, event.id)} />
          <BulkAddGuests action={addGuests.bind(null, event.id)} />
        </div>

        {guestList.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="block w-full text-left text-sm sm:table sm:min-w-[760px]">
              <thead className="hidden border-b border-stone-200 text-xs text-stone-500 uppercase sm:table-header-group">
                <tr>
                  <th className="py-2 pr-3 font-medium">Invitation</th>
                  <th className="py-2 pr-3 font-medium">Opened</th>
                  <th className="py-2 pr-3 font-medium">Reply</th>
                  <th className="py-2 font-medium">Send</th>
                </tr>
              </thead>
              <tbody className="block sm:table-row-group">
                {guestList.map((guest) => {
                  const link = baseUrl + invitationPath(guest);
                  return (
                    <GuestRow
                      key={guest.id}
                      eventId={event.id}
                      guest={guest}
                      link={link}
                      whatsappUrl={whatsappShareUrl(guest, event, link)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-serif text-xl">Your photo</h2>
        <PhotoUpload
          photoSrc={
            event.photoUpdatedAt
              ? `/admin/events/${event.id}/photo?v=${event.photoUpdatedAt.getTime()}`
              : null
          }
          upload={uploadPhoto.bind(null, event.id)}
          remove={removePhoto.bind(null, event.id)}
        />
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 font-serif text-xl">Event details</h2>
        <EventForm action={updateEvent.bind(null, event.id)} event={event} submitLabel="Save changes" />
      </section>
    </main>
  );
}
