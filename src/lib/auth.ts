import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { SESSION_COOKIE, userForSession } from "./session";

export async function currentUser() {
  const store = await cookies();
  return userForSession(store.get(SESSION_COOKIE)?.value);
}

export async function requireSignedIn() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Every admin page and action calls this, including actions reached outside the UI. */
export async function requireAdmin() {
  const user = await requireSignedIn();
  if (user.mustChangeCredentials) redirect("/admin/setup");
  return user;
}

export async function requireOwner() {
  const user = await requireAdmin();
  if (user.role !== "owner") notFound();
  return user;
}

export async function requireEventAccess(eventId: number) {
  const user = await requireAdmin();
  if (!Number.isInteger(eventId)) notFound();
  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  if (!event || (user.role !== "owner" && event.ownerId !== user.id)) notFound();
  return { user, event };
}
