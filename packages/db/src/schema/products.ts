import { pgTable, uuid, text, timestamp, jsonb, numeric, boolean, index } from "drizzle-orm/pg-core";
import { sites } from "./sites";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    priceCents: numeric("price_cents", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    images: jsonb("images").$type<string[]>().default([]).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    stock: jsonb("stock").$type<number | null>(), // null = unlimited
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ siteIdx: index("products_site_idx").on(t.siteId) })
);

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  priceCents: numeric("price_cents", { precision: 12, scale: 2 }).notNull(),
  stock: jsonb("stock").$type<number | null>(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
