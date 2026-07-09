import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sites } from "./sites";

/**
 * Analytics events. Append-only. Stored in Postgres for Phase 1;
 * will be offloaded to ClickHouse or Cloudflare Analytics Engine in Phase 2.
 */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    eventName: text("event_name").notNull(),
    visitorId: text("visitor_id").notNull(),
    sessionId: text("session_id"),
    pageSlug: text("page_slug"),
    locale: text("locale"),
    properties: jsonb("properties").$type<Record<string, unknown>>().default({}).notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    country: text("country"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    siteEventIdx: index("analytics_events_site_event_idx").on(t.siteId, t.eventName, t.createdAt),
    visitorIdx: index("analytics_events_visitor_idx").on(t.visitorId),
  })
);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
