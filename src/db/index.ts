import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

// Reuse one connection across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: Database };

/** Where the built-in local database lives when DATABASE_URL isn't set. */
export const LOCAL_DB_DIR = ".data/pglite";

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (url) {
    // `prepare: false` keeps us compatible with pooled (PgBouncer) connections such as Neon's.
    return drizzlePostgres(postgres(url, { prepare: false, max: 5 }), { schema });
  }
  if (process.env.NODE_ENV === "production" && process.env.RENDER) {
    throw new Error("DATABASE_URL must be set in production.");
  }
  // No DATABASE_URL: use PGlite, an embedded Postgres stored in .data/ — zero setup locally.
  // Loaded lazily so production never pulls it in. Tables are created by `npm run dev`.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PGlite } = require("@electric-sql/pglite") as typeof import("@electric-sql/pglite");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/pglite") as typeof import("drizzle-orm/pglite");
  return drizzle(new PGlite(LOCAL_DB_DIR), { schema }) as unknown as Database;
}

export const db = globalForDb.db ?? createDb();
globalForDb.db = db;
