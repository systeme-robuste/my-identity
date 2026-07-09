import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sites } from "./sites";

export const media = pgTable(
  "media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    siteId: uuid("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: text("size_bytes").notNull(),
    r2Key: text("r2_key").notNull(),
    url: text("url").notNull(),
    width: jsonb("width").$type<number | null>(),
    height: jsonb("height").$type<number | null>(),
    alt: text("alt"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ siteIdx: index("media_site_idx").on(t.siteId) })
);

export type Media = typeof media.$inferSelect;
