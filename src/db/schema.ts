import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
