import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { sites } from "./sites";
import { memberTiers } from "./members";

/**
 * Gated content. Links a resource (page, entry) to required member tiers.
 */
export const gatedContent = pgTable("gated_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  resourceType: text("resource_type").notNull(), // page | entry
  resourceId: uuid("resource_id").notNull(),
  requiredTierId: uuid("required_tier_id").notNull().references(() => memberTiers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GatedContent = typeof gatedContent.$inferSelect;
