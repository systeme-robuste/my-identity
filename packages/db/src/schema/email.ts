import { pgTable, uuid, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { sites } from "./sites";

export const emailSubscribers = pgTable(
  "email_subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    isConfirmed: boolean("is_confirmed").notNull().default(false),
    confirmToken: text("confirm_token"),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ siteIdx: index("email_subscribers_site_idx").on(t.siteId) })
);

export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emailBroadcasts = pgTable("email_broadcasts", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => emailTemplates.id, { onDelete: "set null" }),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("draft"), // draft | sending | sent | failed
  sentCount: jsonb("sent_count").$type<number>().default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type EmailBroadcast = typeof emailBroadcasts.$inferSelect;
