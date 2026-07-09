import { z } from "zod";
import { slugSchema } from "./site.ts";

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema,
  description: z.string().max(20_000).nullable().optional(),
  type: z.enum(["physical", "digital", "service"]),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  priceCents: z.number().int().min(0).max(100_000_00),
  compareAtPriceCents: z.number().int().min(0).max(100_000_00).nullable().optional(),
  imageUrls: z.array(z.string().url()).max(20).default([]),
  inventory: z.number().int().min(0).nullable().optional(),
  requiresShipping: z.boolean().default(true),
  weightGrams: z.number().int().min(0).max(1_000_000).nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
