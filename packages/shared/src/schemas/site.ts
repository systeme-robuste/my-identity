import { z } from "zod";
import { localeSchema } from "./user.ts";

const slugRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const slugSchema = z
  .string()
  .min(1)
  .max(63)
  .regex(slugRegex, "Slug must be lowercase alphanumeric with optional dashes");

const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export const domainSchema = z
  .string()
  .min(4)
  .max(253)
  .regex(domainRegex, "Invalid domain")
  .toLowerCase();

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color");

export const createSiteSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  defaultLocale: localeSchema,
  supportedLocales: z.array(localeSchema).min(1).max(8),
});

export const updateSiteSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  defaultLocale: localeSchema.optional(),
  supportedLocales: z.array(localeSchema).min(1).max(8).optional(),
  customDomain: domainSchema.nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  settings: z
    .object({
      theme: z.enum(["light", "dark", "auto"]).optional(),
      brandColor: hexColorSchema.optional(),
      customCss: z.string().max(50_000).nullable().optional(),
      customHeadHtml: z.string().max(10_000).nullable().optional(),
      customFooterHtml: z.string().max(10_000).nullable().optional(),
      faviconUrl: z.string().url().nullable().optional(),
      ogImageUrl: z.string().url().nullable().optional(),
      analyticsEnabled: z.boolean().optional(),
      seoIndexable: z.boolean().optional(),
    })
    .partial()
    .optional(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
