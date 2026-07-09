import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Data rights requests. RGPD Article 15 (access) and Article 17 (erasure).
 */
export const dataRightsRequests = pgTable("data_rights_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // export | delete
  status: text("status").notNull().default("pending"), // pending | processing | completed | failed
  exportUrl: text("export_url"), // signed R2 URL for export
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
});

export type DataRightsRequest = typeof dataRightsRequests.$inferSelect;
