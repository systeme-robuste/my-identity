import { pgTable, uuid, text, timestamp, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { sites } from "./sites";

export const memberTiers = pgTable(
  "member_tiers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    priceCents: numeric("price_cents", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("USD"),
    interval: text("interval").notNull().default("month"), // month | year
    stripePriceId: text("stripe_price_id"),
    features: jsonb("features").$type<string[]>().default([]).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ siteIdx: index("member_tiers_site_idx").on(t.siteId) })
);

export const members = pgTable(
  "members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    tierId: uuid("tier_id").notNull().references(() => memberTiers.id, { onDelete: "restrict" }),
    email: text("email").notNull(),
    name: text("name"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    status: text("status").notNull().default("active"), // active | paused | cancelled | past_due
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ siteIdx: index("members_site_idx").on(t.siteId) })
);

export type MemberTier = typeof memberTiers.$inferSelect;
export type Member = typeof members.$inferSelect;
