"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { expectedSessionValue, isCorrectPassword, SESSION_COOKIE } from "@/lib/session";

export async function login(_prev: string | null, formData: FormData) {
  if (!expectedSessionValue()) return "ADMIN_PASSWORD is not set on the server.";
  const password = String(formData.get("password") ?? "");
  if (!isCorrectPassword(password)) return "That password isn't right.";

  const store = await cookies();
  store.set(SESSION_COOKIE, expectedSessionValue()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
