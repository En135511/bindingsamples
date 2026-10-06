CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'Graduation Celebration' NOT NULL,
	"honoree_name" text NOT NULL,
	"degree" text,
	"school" text,
	"class_year" text,
	"starts_at" text NOT NULL,
	"duration_minutes" integer DEFAULT 180 NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"venue_name" text,
	"venue_address" text,
	"map_url" text,
	"dress_code" text,
	"message" text,
	"rsvp_by" text,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"token" text NOT NULL,
	"max_party_size" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"party_size" integer,
	"note" text,
	"open_count" integer DEFAULT 0 NOT NULL,
	"first_opened_at" timestamp with time zone,
	"last_opened_at" timestamp with time zone,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;