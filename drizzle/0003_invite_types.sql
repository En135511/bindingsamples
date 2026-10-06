ALTER TABLE "guests" ADD COLUMN "invite_type" text DEFAULT 'single' NOT NULL;--> statement-breakpoint
-- The dashboard offers up to 20 seats per invitation; bring any larger legacy value into range.
UPDATE "guests" SET "max_party_size" = 20 WHERE "max_party_size" > 20;
--> statement-breakpoint
-- Existing guests: infer the type from the seats they were given.
UPDATE "guests" SET "invite_type" = CASE WHEN "max_party_size" >= 3 THEN 'family' WHEN "max_party_size" = 2 THEN 'couple' ELSE 'single' END;
--> statement-breakpoint
-- Keep earlier RSVPs as answered, only capped to the (possibly clamped) seats.
UPDATE "guests" SET "party_size" = LEAST("party_size", "max_party_size") WHERE "party_size" IS NOT NULL;
