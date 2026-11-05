"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { hashPassword, validUsername } from "@/lib/session";

export type HostState = { error?: string; username?: string; temporaryPassword?: string } | null;
const temporaryPassword = () => randomBytes(18).toString("base64url");

export async function createHost(_prev: HostState, formData: FormData): Promise<HostState> {
  await requireOwner();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!validUsername(username)) return { error: "Use 3–32 characters, starting with a letter. Letters, numbers, dots, dashes and underscores are allowed." };
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (existing) return { error: "That username is already in use." };
  const password = temporaryPassword();
  await db.insert(users).values({ username, passwordHash: hashPassword(password), role: "host", mustChangeCredentials: true });
  revalidatePath("/admin/users");
  return { username, temporaryPassword: password };
}

export async function resetHostPassword(userId: number, _prev: HostState): Promise<HostState> {
  void _prev;
  await requireOwner();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user || user.role !== "host") return { error: "Host account not found." };
  const password = temporaryPassword();
  await db.update(users).set({ passwordHash: hashPassword(password), mustChangeCredentials: true }).where(eq(users.id, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  revalidatePath("/admin/users");
  return { username: user.username, temporaryPassword: password };
}
