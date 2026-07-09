import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sites } from "./sites";

/**
 * CMS collections. Each site can have many collections (blog, projects, etc.)
 */
export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    schema: jsonb("schema").$type<Record<string, unknown>>().default({}).notNull(), // field definitions
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    siteIdx: index("collections_site_idx").on(t.siteId),
  })
);

/**
 * CMS entries. Each collection has many entries.
 */
export const entries = pgTable(
  "entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    data: jsonb("data").$type<Record<string, unknown>>().default({}).notNull(),
    status: text("status").notNull().default("draft"), // draft | published
    locale: text("locale").notNull().default("fr"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    collectionIdx: index("entries_collection_idx").on(t.collectionId),
    siteIdx: index("entries_site_idx").on(t.siteId),
  })
);

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
