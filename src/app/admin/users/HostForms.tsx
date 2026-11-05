"use client";

import { useActionState } from "react";
import { createHost, resetHostPassword, type HostState } from "./actions";

function Credentials({ state }: { state: HostState }) {
  if (!state?.temporaryPassword) return null;
  return <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-stone-900">
    <p className="font-semibold">Copy these credentials now. The password will not be shown again.</p>
    <p className="mt-2">Username: <code className="select-all font-mono">{state.username}</code></p>
    <p>Temporary password: <code className="select-all font-mono break-all">{state.temporaryPassword}</code></p>
    <p className="mt-2 text-stone-600">The host must change both on first login.</p>
  </div>;
}

export function CreateHostForm() {
  const [state, action, pending] = useActionState(createHost, null);
  return <form action={action} className="space-y-4">
    <label className="block"><span className="label">Temporary username</span><input name="username" required minLength={3} maxLength={32} className="input" placeholder="e.g. jane.host" /></label>
    <button disabled={pending} className="btn-primary">{pending ? "Creating…" : "Create host account"}</button>
    {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    <Credentials state={state} />
  </form>;
}

export function ResetHostButton({ id }: { id: number }) {
  const [state, action, pending] = useActionState(resetHostPassword.bind(null, id), null);
  return <form action={action} className="space-y-2">
    <button disabled={pending} className="btn-secondary">{pending ? "Resetting…" : "Issue new temporary password"}</button>
    {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
    <Credentials state={state} />
  </form>;
}
