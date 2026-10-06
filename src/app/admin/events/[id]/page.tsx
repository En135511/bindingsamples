import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { events, guests } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatLongDate, formatTime } from "@/lib/datetime";
import { getBaseUrl, invitationPath, whatsappShareUrl } from "@/lib/links";
import { addGuests, removePhoto, updateEvent, uploadPhoto } from "../../actions";
import { EventForm } from "../../EventForm";
import { AddGuestsForm } from "./AddGuestsForm";
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
  const stats = [
    { label: "Invited", value: guestList.length },
    { label: "Opened", value: guestList.filter((g) => g.openCount > 0).length },
    {
      label: "Attending (people)",
      value: attending.reduce((sum, g) => sum + (g.partySize ?? 1), 0),
    },
    { label: "Declined", value: guestList.filter((g) => g.status === "declined").length },
    { label: "Awaiting reply", value: guestList.filter((g) => g.status === "pending").length },
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

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-stone-500">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 font-serif text-xl">Guests</h2>
        <p className="mb-4 text-sm text-stone-500">
          Each guest gets their own link. Tap <strong>WhatsApp</strong> to send it, or copy it and
          paste it anywhere.
        </p>
        <AddGuestsForm action={addGuests.bind(null, event.id)} />

        {guestList.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-stone-200 text-xs text-stone-500 uppercase">
                <tr>
                  <th className="py-2 pr-3 font-medium">Guest</th>
                  <th className="py-2 pr-3 font-medium">Seats</th>
                  <th className="py-2 pr-3 font-medium">Opened</th>
                  <th className="py-2 pr-3 font-medium">Reply</th>
                  <th className="py-2 font-medium">Send</th>
                </tr>
              </thead>
              <tbody>
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
