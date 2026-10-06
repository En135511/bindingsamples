"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl">Host login</h1>
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Password"
          className="input"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-stone-400">
            Running locally: the password is <code>admin</code> unless you set ADMIN_PASSWORD.
          </p>
        )}
        <button disabled={pending} className="btn-primary w-full">
          {pending ? "Checking…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
