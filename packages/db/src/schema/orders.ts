import { pgTable, uuid, text, timestamp, jsonb, numeric, index } from "drizzle-orm/pg-core";
import { sites } from "./sites";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name"),
    totalCents: numeric("total_cents", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    status: text("status").notNull().default("pending"), // pending | paid | fulfilled | refunded | cancelled
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ siteIdx: index("orders_site_idx").on(t.siteId) })
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id"),
  variantId: uuid("variant_id"),
  name: text("name").notNull(),
  quantity: numeric("quantity").notNull(),
  unitPriceCents: numeric("unit_price_cents", { precision: 12, scale: 2 }).notNull(),
  totalCents: numeric("total_cents", { precision: 12, scale: 2 }).notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
