import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sites } from "./sites";

/**
 * Usage counters. Rolled up periodically for billing/quota enforcement.
 */
export const usageCounters = pgTable(
  "usage_counters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    period: text("period").notNull(), // YYYY-MM
    metric: text("metric").notNull(), // pageviews | bandwidth | api_calls | form_submissions | members
    value: jsonb("value").$type<number>().default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sitePeriodMetricIdx: index("usage_site_period_metric_idx").on(t.siteId, t.period, t.metric),
  })
);

export type UsageCounter = typeof usageCounters.$inferSelect;
