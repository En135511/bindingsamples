import { isAdmin } from "@/lib/auth";
import { photoResponse } from "@/lib/photos";

export async function GET(_request: Request, { params }: RouteContext<"/admin/events/[id]/photo">) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response("Not found", { status: 404 });
  return photoResponse(id);
}
