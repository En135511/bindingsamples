import { createHash, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "admin_session";

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

/** The cookie value that proves the host is logged in. Changes whenever ADMIN_PASSWORD changes. */
export function expectedSessionValue(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return sha256(`invite-admin-session:${password}`).toString("hex");
}

export function isValidSession(value: string | undefined): boolean {
  const expected = expectedSessionValue();
  if (!expected || !value) return false;
  return timingSafeEqual(sha256(value), sha256(expected));
}

export function isCorrectPassword(attempt: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return timingSafeEqual(sha256(attempt), sha256(password));
}
