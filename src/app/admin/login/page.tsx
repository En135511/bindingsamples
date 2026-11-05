"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 text-stone-900 shadow-sm">
        <h1 className="font-serif text-2xl">Host login</h1>
        <label className="block"><span className="label">Username</span><input name="username" required autoFocus autoComplete="username" className="input" /></label>
        <label className="block"><span className="label">Password</span><input type="password" name="password" required autoComplete="current-password" className="input" /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <p className="text-xs text-stone-600">First login? Use username <code>owner</code> and your site&apos;s initial owner password.</p>
        <button disabled={pending} className="btn-primary w-full">{pending ? "Checking…" : "Log in"}</button>
      </form>
    </main>
  );
}
