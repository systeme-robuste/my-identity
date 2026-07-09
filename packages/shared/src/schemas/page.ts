import { z } from "zod";
import { slugSchema } from "./site.ts";

/** A loose, recursive block schema. The dashboard uses a tighter, generated schema. */
export const blockSchema: z.ZodType<unknown> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      id: z.string().min(1).max(64),
      type: z.literal("heading"),
      level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
      text: z.string().max(500),
      anchor: z.string().max(64).nullable(),
    }),
    z.object({ id: z.string(), type: z.literal("paragraph"), text: z.string().max(20_000) }),
    z.object({
      id: z.string(),
      type: z.literal("image"),
      src: z.string().url(),
      alt: z.string().max(280),
      width: z.number().int().positive().nullable(),
      height: z.number().int().positive().nullable(),
      caption: z.string().max(280).nullable(),
    }),
    z.object({
      id: z.string(),
      type: z.literal("button"),
      label: z.string().min(1).max(80),
      href: z.string().max(2048),
      variant: z.enum(["primary", "secondary", "ghost"]),
      openInNewTab: z.boolean(),
    }),
    z.object({ id: z.string(), type: z.literal("form"), formId: z.string() }),
    z.object({
      id: z.string(),
      type: z.literal("collection"),
      collectionId: z.string(),
      layout: z.enum(["list", "grid"]),
      limit: z.number().int().positive().max(200).nullable(),
    }),
    z.object({
      id: z.string(),
      type: z.literal("video"),
      provider: z.enum(["youtube", "vimeo", "mp4"]),
      src: z.string().url(),
      poster: z.string().url().nullable(),
    }),
    z.object({ id: z.string(), type: z.literal("embed"), html: z.string().max(50_000), sandbox: z.boolean() }),
    z.object({ id: z.string(), type: z.literal("divider") }),
    z.object({ id: z.string(), type: z.literal("spacer"), height: z.number().int().min(0).max(1000) }),
    z.object({ id: z.string(), type: z.literal("code"), language: z.string().max(40), code: z.string().max(100_000) }),
    z.object({ id: z.string(), type: z.literal("quote"), text: z.string().max(2000), attribution: z.string().max(120).nullable() }),
    z.object({ id: z.string(), type: z.literal("gated"), blockIds: z.array(z.string()), requiredTier: z.enum(["free", "pro", "business", "any"]) }),
  ])
);

export const createPageSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  blocks: z.array(blockSchema).max(500),
  locale: z.string().min(2).max(8).nullable().optional(),
});

export const updatePageSchema = createPageSchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
  seo: z
    .object({
      title: z.string().max(120).nullable().optional(),
      description: z.string().max(500).nullable().optional(),
      ogImageUrl: z.string().url().nullable().optional(),
      noindex: z.boolean().optional(),
      canonicalUrl: z.string().url().nullable().optional(),
    })
    .partial()
    .optional(),
});

export const reorderPagesSchema = z.object({
  order: z.array(z.object({ id: z.string(), slug: slugSchema })).max(500),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
