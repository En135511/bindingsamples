import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { photoResponse } from "@/lib/photos";

export async function GET(_request: Request, { params }: RouteContext<"/admin/events/[id]/photo">) {
  const user = await currentUser();
  if (!user || user.mustChangeCredentials) return new Response("Unauthorized", { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Not found", { status: 404 });
  const [event] = await db.select({ ownerId: events.ownerId }).from(events).where(eq(events.id, id));
  if (!event || (user.role !== "owner" && event.ownerId !== user.id)) return new Response("Not found", { status: 404 });
  return photoResponse(id);
}
