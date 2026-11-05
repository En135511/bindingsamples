import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { events, sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "invite_session";
export const DEV_PASSWORD = "admin";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function initialOwnerPassword() {
  return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL ? DEV_PASSWORD : null);
}

export function validUsername(value: string) {
  return /^[a-z][a-z0-9._-]{2,31}$/.test(value);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!password || password.length > 1024) return false;
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !hash || !/^[a-f0-9]{128}$/.test(hash)) return false;
  const attempt = scryptSync(password, salt, 64);
  return timingSafeEqual(attempt, Buffer.from(hash, "hex"));
}

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function ensureOwner() {
  let [owner] = await db.select({ id: users.id }).from(users).where(eq(users.role, "owner"));
  if (!owner) {
    const [existing] = await db.select({ id: users.id }).from(users).limit(1);
    const password = initialOwnerPassword();
    if (existing || !password) return;
    await db.insert(users).values({ username: "owner", passwordHash: hashPassword(password), role: "owner" }).onConflictDoNothing();
    [owner] = await db.select({ id: users.id }).from(users).where(eq(users.role, "owner"));
  }
  if (owner) await db.update(events).set({ ownerId: owner.id }).where(isNull(events.ownerId));
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    tokenHash: tokenHash(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
  });
  return token;
}

export async function userForSession(token: string | undefined) {
  if (!token || token.length > 256) return null;
  const [row] = await db.select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions).innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, tokenHash(token)));
  return row && row.expiresAt > new Date() ? row.user : null;
}

export async function revokeSession(token: string | undefined) {
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash(token)));
}
