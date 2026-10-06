// Runs before `npm run dev`. Without DATABASE_URL, the app uses a built-in database in .data/;
// this creates or updates its tables. With DATABASE_URL, run `npm run db:migrate` instead.
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { existsSync, mkdirSync } from "node:fs";
import { migrate } from "drizzle-orm/pglite/migrator";

if (existsSync(".env")) process.loadEnvFile(".env");

if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL is set — skipping the built-in local database.");
} else {
  mkdirSync(".data", { recursive: true });
  const client = new PGlite(".data/pglite");
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  await client.close();
  console.log("✓ Local database ready (.data/pglite)");
}
