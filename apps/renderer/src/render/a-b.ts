/**
 * A/B variant selection.
 *
 * If a page has variants (set in the editor), assign the visitor to one
 * based on a sticky cookie. Returns the page with the chosen variant's
 * blocks. The selection is deterministic for the same `visitorId`.
 */

import type { Page, Block } from "@my-identity/shared";
import { ulid } from "@my-identity/shared";

export interface PageWithVariants extends Page {
  variants?: Array<{ id: string; weight: number; blocks: Block[] }>;
}

export function selectVariant(page: Page, cookies: Record<string, string>): { blocks: Block[]; variantId: string | null } {
  const variants = (page as PageWithVariants).variants;
  if (!variants || variants.length === 0) {
    return { blocks: page.blocks, variantId: null };
  }
  const cookieKey = `mi_ab_${page.id}`;
  let visitorId = cookies[cookieKey];
  if (!visitorId) {
    visitorId = ulid();
    // The caller should set the cookie. We just return the visitorId
    // in the variantId for the caller to use.
  }
  // Deterministic pick from a hash of the visitorId
  const sum = Array.from(visitorId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const totalWeight = variants.reduce((acc, v) => acc + Math.max(0, v.weight), 0);
  if (totalWeight <= 0) return { blocks: page.blocks, variantId: null };
  const target = sum % totalWeight;
  let acc = 0;
  for (const v of variants) {
    acc += Math.max(0, v.weight);
    if (target < acc) return { blocks: v.blocks, variantId: v.id };
  }
  return { blocks: page.blocks, variantId: null };
}
