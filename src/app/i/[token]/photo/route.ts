import { photoResponse } from "@/lib/photos";
import { getInvitation } from "../data";

export async function GET(_request: Request, { params }: RouteContext<"/i/[token]/photo">) {
  const invitation = await getInvitation((await params).token);
  if (!invitation) return new Response("Not found", { status: 404 });
  return photoResponse(invitation.event.id);
}
