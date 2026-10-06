// Runs before `npm run dev`. Without DATABASE_URL, the app uses a built-in database in .data/;
// this creates or updates its tables. With DATABASE_URL, run `npm run db:migrate` instead.
import { existsSync, mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import lock from "./local-db-lock.cjs";

if (existsSync(".env")) process.loadEnvFile(".env");

if (process.env.DATABASE_URL) {
  console.log("DATABASE_URL is set — skipping the built-in local database.");
} else {
  mkdirSync(".data", { recursive: true });
  const holder = lock.lockHolder();
  if (holder) {
    console.error(`\n✗ ${lock.alreadyRunningMessage(holder)}\n`);
    process.exit(1);
  }
  try {
    const client = new PGlite(".data/pglite");
    await migrate(drizzle(client), { migrationsFolder: "drizzle" });
    await client.close();
    console.log("✓ Local database ready (.data/pglite)");
  } catch (error) {
    console.error(
      "\n✗ Couldn't open the local database in .data/pglite.\n" +
        "  Make sure no other `npm run dev` is running for this folder.\n" +
        "  If it still fails, delete the .data folder to start with an empty database.\n",
    );
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
