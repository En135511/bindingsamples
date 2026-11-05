import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { CreateHostForm, ResetHostButton } from "./HostForms";

export default async function UsersPage() {
  await requireOwner();
  const hosts = await db.select({ id: users.id, username: users.username, mustChangeCredentials: users.mustChangeCredentials, createdAt: users.createdAt })
    .from(users).where(eq(users.role, "host")).orderBy(asc(users.createdAt));
  return <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8">
    <div><h1 className="font-serif text-3xl text-white">Host accounts</h1><p className="mt-1 text-sm text-stone-300">Create an account for each person who will send their own invitations.</p></div>
    <section className="rounded-xl bg-white p-6 text-stone-900 shadow-sm"><h2 className="mb-4 font-serif text-xl">Add a host</h2><CreateHostForm /></section>
    <section className="rounded-xl bg-white p-6 text-stone-900 shadow-sm"><h2 className="mb-4 font-serif text-xl">Existing hosts</h2>
      {hosts.length === 0 ? <p className="text-sm text-stone-600">No host accounts yet.</p> : <ul className="divide-y divide-stone-200">{hosts.map((host) => <li key={host.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-medium">{host.username}</p><p className="text-xs text-stone-600">{host.mustChangeCredentials ? "First login setup required" : "Active"}</p></div><ResetHostButton id={host.id} /></li>)}</ul>}
    </section>
  </main>;
}
