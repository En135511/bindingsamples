"use client";

import { useActionState } from "react";
import { changeCredentials } from "./actions";

export function SetupForm({ username }: { username: string }) {
  const [error, action, pending] = useActionState(changeCredentials, null);
  return <form action={action} className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 text-stone-900 shadow-sm">
    <h1 className="font-serif text-2xl">Set up your account</h1>
    <p className="text-sm text-stone-600">Your temporary username is <strong>{username}</strong>. Choose a new username and password before managing invitations.</p>
    <label className="block"><span className="label">Temporary password</span><input type="password" name="currentPassword" autoComplete="current-password" required className="input" /></label>
    <label className="block"><span className="label">New username</span><input name="username" autoComplete="username" required minLength={3} maxLength={32} className="input" /></label>
    <label className="block"><span className="label">New password</span><input type="password" name="password" autoComplete="new-password" required minLength={12} className="input" /></label>
    <label className="block"><span className="label">Confirm new password</span><input type="password" name="confirm" autoComplete="new-password" required minLength={12} className="input" /></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={pending} className="btn-primary w-full">{pending ? "Saving…" : "Save account"}</button>
  </form>;
}
