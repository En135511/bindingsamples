import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatLongDate } from "@/lib/datetime";
import { createEvent } from "./actions";
import { EventForm } from "./EventForm";

export default async function AdminHome() {
  await requireAdmin();
  const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8">
      {allEvents.length > 0 && (
        <section>
          <h1 className="mb-4 font-serif text-2xl">Your events</h1>
          <ul className="grid gap-3 sm:grid-cols-2">
            {allEvents.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/admin/events/${event.id}`}
                  className="block rounded-xl bg-white p-5 shadow-sm hover:shadow-md"
                >
                  <p className="font-serif text-lg">
                    {event.honoreeName} — {event.title}
                  </p>
                  <p className="text-sm text-stone-500">{formatLongDate(event.startsAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 font-serif text-xl">Create an event</h2>
        <p className="mb-6 text-sm text-stone-500">
          Fill in what you know now — you can change any of it later.
        </p>
        <EventForm action={createEvent} submitLabel="Create event" />
      </section>
    </main>
  );
}
