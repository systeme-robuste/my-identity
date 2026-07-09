/**
 * Member types. A member is a paying or free subscriber to a gated site.
 * Auth uses a magic link or a session token scoped to the site.
 */

export type MemberTier = "free" | "pro" | "business";
export type MemberStatus = "active" | "paused" | "cancelled" | "expired";

export interface Member {
  id: string;
  siteId: string;
  email: string;
  displayName: string | null;
  tier: MemberTier;
  status: MemberStatus;
  /** Stripe subscription ID, if any. */
  stripeSubscriptionId: string | null;
  /** Stripe customer ID, if any. */
  stripeCustomerId: string | null;
  /** Period start/end of the current subscription period. */
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

/** A request from a public visitor to access a gated block. */
export interface GatedAccessCheck {
  blockId: string;
  visitorToken: string | null;
  hasAccess: boolean;
  /** If `hasAccess` is false, the reason for denial (e.g. "expired", "wrong_tier"). */
  reason: string | null;
}
