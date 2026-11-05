"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { requireSignedIn } from "@/lib/auth";
import { createSession, hashPassword, SESSION_COOKIE, SESSION_MAX_AGE, validUsername, verifyPassword } from "@/lib/session";

export async function changeCredentials(_prev: string | null, formData: FormData) {
  const user = await requireSignedIn();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!verifyPassword(currentPassword, user.passwordHash)) return "Temporary password is incorrect.";
  if (!validUsername(username)) return "Username must be 3–32 characters, starting with a letter. Use letters, numbers, dots, dashes or underscores.";
  if (user.mustChangeCredentials && username === user.username) return "Choose a new username.";
  if (password.length < 12 || password.length > 1024) return "Choose a password of at least 12 characters.";
  if (password !== confirm) return "Passwords do not match.";
  if (password === currentPassword) return "Choose a new password.";
  const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (taken && taken.id !== user.id) return "That username is already in use.";

  await db.update(users).set({ username, passwordHash: hashPassword(password), mustChangeCredentials: false }).where(eq(users.id, user.id));
  const store = await cookies();
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  const token = await createSession(user.id);
  store.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: SESSION_MAX_AGE });
  redirect("/admin");
}
