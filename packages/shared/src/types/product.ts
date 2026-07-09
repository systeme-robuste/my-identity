/**
 * Product types for the e-commerce surface (Phase 2). Prices are always in
 * the smallest currency unit (cents for USD). Currency is fixed to USD
 * across the platform at MVP.
 */

export type ProductStatus = "draft" | "active" | "archived";
export type ProductType = "physical" | "digital" | "service";

export interface Product {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  description: string | null;
  type: ProductType;
  status: ProductStatus;
  /** Price in cents, USD. */
  priceCents: number;
  /** Optional sale price in cents, USD. */
  compareAtPriceCents: number | null;
  /** Stripe Price ID, if a Stripe Checkout link has been created. */
  stripePriceId: string | null;
  imageUrls: ReadonlyArray<string>;
  /** Number of units in stock; null for unlimited. */
  inventory: number | null;
  /** True for digital goods (no shipping, instant delivery). */
  requiresShipping: boolean;
  /** Weight in grams, for shipping calculations. */
  weightGrams: number | null;
  createdAt: string;
  updatedAt: string;
}
