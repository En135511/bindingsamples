import { customType, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { InviteType } from "../lib/invites";

const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType: () => "bytea",
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("Graduation Celebration"),
  honoreeName: text("honoree_name").notNull(),
  degree: text("degree"),
  school: text("school"),
  classYear: text("class_year"),
  // Wall-clock time at the venue, "YYYY-MM-DDTHH:mm", interpreted in `timezone`.
  startsAt: text("starts_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(180),
  timezone: text("timezone").notNull().default("UTC"),
  venueName: text("venue_name"),
  venueAddress: text("venue_address"),
  mapUrl: text("map_url"),
  dressCode: text("dress_code"),
  message: text("message"),
  // "YYYY-MM-DD"
  rsvpBy: text("rsvp_by"),
  // Set when a photo is uploaded; also used to bust the browser cache when it changes.
  photoUpdatedAt: timestamp("photo_updated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Kept apart from `events` so ordinary event queries don't load the image bytes.
export const eventPhotos = pgTable("event_photos", {
  eventId: integer("event_id")
    .primaryKey()
    .references(() => events.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  data: bytea("data").notNull(),
});

export const RSVP_STATUSES = ["pending", "attending", "declined"] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export const guests = pgTable("guests", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone"),
  token: text("token").notNull().unique(),
  // "single" | "couple" | "family" — decides how the invitation is addressed.
  inviteType: text("invite_type").$type<InviteType>().notNull().default("single"),
  // Seats this invitation carries, set by the host (1 for one person, 2 for a couple).
  maxPartySize: integer("max_party_size").notNull().default(1),
  status: text("status").$type<RsvpStatus>().notNull().default("pending"),
  partySize: integer("party_size"),
  note: text("note"),
  openCount: integer("open_count").notNull().default(0),
  firstOpenedAt: timestamp("first_opened_at", { withTimezone: true }),
  lastOpenedAt: timestamp("last_opened_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type Guest = typeof guests.$inferSelect;
