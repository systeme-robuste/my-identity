import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sites } from "./sites";

/**
 * Abuse reports. Submissions flagged by users (DSA compliance).
 */
export const abuseReports = pgTable("abuse_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  reporterEmail: text("reporter_email").notNull(),
  reason: text("reason").notNull(), // illegal_content | copyright | harassment | other
  description: text("description"),
  status: text("status").notNull().default("open"), // open | investigating | resolved | rejected
  resolution: text("resolution"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
});

export type AbuseReport = typeof abuseReports.$inferSelect;
