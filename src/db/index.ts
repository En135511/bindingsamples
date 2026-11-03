import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: Database };

/** Where the built-in local database lives during local development. */
export const LOCAL_DB_DIR = ".data/pglite";

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (url) {
    return drizzleNeon({ client: neon(url), schema });
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL must be set in production.");
  }
  // No DATABASE_URL: use PGlite, an embedded Postgres stored in .data/ — zero setup locally.
  // Loaded lazily so production never pulls it in. Tables are created by `npm run dev`.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../scripts/local-db-lock.cjs").acquireLock();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/pglite") as typeof import("drizzle-orm/pglite");
  return drizzle(new PGlite(LOCAL_DB_DIR), { schema }) as unknown as Database;
}

function getDb() {
  return (globalForDb.db ??= createDb());
}

/** Connects on first use, so merely importing this module (e.g. during `next build`) is free. */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
