import { pgTable, uuid, text, timestamp, jsonb, boolean, index, integer } from "drizzle-orm/pg-core";
import { sites } from "./sites";

/**
 * Pages. Each site has many pages (slugged).
 */
export const pages = pgTable(
  "pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    blocks: jsonb("blocks").$type<unknown[]>().default([]).notNull(),
    seo: jsonb("seo").$type<{ title?: string; description?: string; ogImage?: string }>().default({}).notNull(),
    status: text("status").notNull().default("draft"), // draft | published
    order: integer("order").notNull().default(0),
    isHomepage: boolean("is_homepage").notNull().default(false),
    variants: jsonb("variants").$type<unknown[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    siteIdx: index("pages_site_idx").on(t.siteId),
    slugIdx: index("pages_site_slug_idx").on(t.siteId, t.slug),
  })
);

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
