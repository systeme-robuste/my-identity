import { z } from "zod";
import { slugSchema } from "./site.ts";

export const collectionFieldTypeSchema = z.enum([
  "text",
  "longtext",
  "richtext",
  "number",
  "boolean",
  "date",
  "datetime",
  "url",
  "email",
  "image",
  "file",
  "select",
  "multiselect",
  "json",
  "reference",
]);

export const collectionFieldSchema = z.object({
  name: z.string().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/, "Field name must be snake_case"),
  label: z.string().min(1).max(120),
  type: collectionFieldTypeSchema,
  required: z.boolean(),
  unique: z.boolean(),
  options: z.array(z.string().min(1).max(80)).max(100).nullable(),
  referenceCollectionId: z.string().nullable(),
  defaultValue: z.string().max(2000).nullable(),
  order: z.number().int().min(0).max(10_000),
});

export const createCollectionSchema = z.object({
  name: slugSchema,
  label: z.string().min(1).max(120),
  description: z.string().max(500).nullable().optional(),
  fields: z.array(collectionFieldSchema).min(1).max(100),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const createEntrySchema = z.object({
  slug: slugSchema,
  data: z.record(z.unknown()),
  locale: z.string().min(2).max(8).nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});

export const updateEntrySchema = createEntrySchema.partial();

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
