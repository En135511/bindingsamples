"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, ensureOwner, revokeSession, SESSION_COOKIE, SESSION_MAX_AGE, verifyPassword } from "@/lib/session";

export async function login(_prev: string | null, formData: FormData) {
  await ensureOwner();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const [user] = await db.select().from(users).where(eq(users.username, username));
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return "Username or password is incorrect.";
  }

  const token = await createSession(user.id);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(user.mustChangeCredentials ? "/admin/setup" : "/admin");
}

export async function logout() {
  const store = await cookies();
  await revokeSession(store.get(SESSION_COOKIE)?.value);
  store.set(SESSION_COOKIE, "", { path: "/admin", maxAge: 0 });
  redirect("/admin/login");
}
