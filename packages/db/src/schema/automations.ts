import { pgTable, uuid, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { sites } from "./sites";

export const automations = pgTable("automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  trigger: text("trigger").notNull(), // form_submission | entry_created | etc.
  graph: jsonb("graph").$type<Record<string, unknown>>().default({}).notNull(), // node graph
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const automationLogs = pgTable("automation_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  automationId: uuid("automation_id").notNull().references(() => automations.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // success | failed | skipped
  input: jsonb("input").$type<Record<string, unknown>>().default({}).notNull(),
  output: jsonb("output").$type<Record<string, unknown>>().default({}).notNull(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Automation = typeof automations.$inferSelect;
export type AutomationLog = typeof automationLogs.$inferSelect;
