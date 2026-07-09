import { pgTable, uuid, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Sites. One user can have many sites.
 */
export const sites = pgTable(
  "sites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    locale: text("locale").notNull().default("fr"),
    design: jsonb("design").$type<Record<string, unknown>>().default({}).notNull(),
    customHead: text("custom_head"),
    customFooter: text("custom_footer"),
    favicon: text("favicon"),
    ogImage: text("og_image"),
    url: text("url"),
    plan: text("plan").notNull().default("free"),
    isPublished: boolean("is_published").notNull().default(false),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    ownerIdx: index("sites_owner_idx").on(t.ownerId),
    slugIdx: index("sites_slug_idx").on(t.slug),
  })
);

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
