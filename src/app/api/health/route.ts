// Pinged by Render's health check and by an uptime monitor to keep the free instance awake.
// Deliberately doesn't touch the database, so pings don't use database hours.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true });
}
