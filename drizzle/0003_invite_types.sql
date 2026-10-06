ALTER TABLE "guests" ADD COLUMN "invite_type" text DEFAULT 'single' NOT NULL;--> statement-breakpoint
-- Existing guests: infer the type from the seats they were given.
UPDATE "guests" SET "invite_type" = CASE WHEN "max_party_size" >= 3 THEN 'family' WHEN "max_party_size" = 2 THEN 'couple' ELSE 'single' END;
--> statement-breakpoint
-- Seats are now set by the host, so an accepted invitation counts all of its seats.
UPDATE "guests" SET "party_size" = "max_party_size" WHERE "status" = 'attending';
