/**
 * Subscription plans. All prices in USD cents. The plan determines the
 * quotas enforced by the API and the dashboard upsell triggers.
 *
 * - Free:   $0,    1 site,  1 page/site,  10 GB bandwidth
 * - Pro:    $11/mo or $9/yr,  1 site,  25 pages/site, 250 GB
 * - Business: $59/mo or $49/yr, 5 sites, unlimited pages, 2 TB
 */

export type PlanId = "free" | "pro" | "business";
export type BillingInterval = "monthly" | "yearly";

export interface PlanTier {
  id: PlanId;
  label: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  currency: "USD";
  /** Stripe price IDs are environment-dependent; the API resolves them at runtime. */
  stripePriceId: { monthly: string | null; yearly: string | null };
  quotas: {
    maxSites: number;
    maxPagesPerSite: number;
    maxCollectionsPerSite: number;
    maxEntriesPerCollection: number;
    bandwidthBytesPerMonth: number;
    storageBytes: number;
    apiRequestsPerMinute: number;
  };
  features: ReadonlyArray<string>;
  highlight: boolean;
}

export const PLANS: ReadonlyArray<PlanTier> = [
  {
    id: "free",
    label: "Free",
    description: "For trying My Identity out.",
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    currency: "USD",
    stripePriceId: { monthly: null, yearly: null },
    quotas: {
      maxSites: 1,
      maxPagesPerSite: 1,
      maxCollectionsPerSite: 1,
      maxEntriesPerCollection: 50,
      bandwidthBytesPerMonth: 10 * 1024 ** 3,
      storageBytes: 100 * 1024 ** 2,
      apiRequestsPerMinute: 60,
    },
    features: ["1 site", "1 page", "1 CMS collection", "myidentity.app subdomain", "Community support"],
    highlight: false,
  },
  {
    id: "pro",
    label: "Pro",
    description: "For freelancers and indie hackers who need a serious presence.",
    monthlyPriceCents: 11_00,
    yearlyPriceCents: 9_00,
    currency: "USD",
    stripePriceId: { monthly: "STRIPE_PRICE_PRO_MONTHLY", yearly: "STRIPE_PRICE_PRO_YEARLY" },
    quotas: {
      maxSites: 1,
      maxPagesPerSite: 25,
      maxCollectionsPerSite: 10,
      maxEntriesPerCollection: 5_000,
      bandwidthBytesPerMonth: 250 * 1024 ** 3,
      storageBytes: 5 * 1024 ** 3,
      apiRequestsPerMinute: 600,
    },
    features: [
      "1 site",
      "25 pages",
      "10 CMS collections",
      "Custom domain",
      "All blocks + A/B testing",
      "Email support",
    ],
    highlight: true,
  },
  {
    id: "business",
    label: "Business",
    description: "For small agencies, e-commerce, and teams.",
    monthlyPriceCents: 59_00,
    yearlyPriceCents: 49_00,
    currency: "USD",
    stripePriceId: { monthly: "STRIPE_PRICE_BUSINESS_MONTHLY", yearly: "STRIPE_PRICE_BUSINESS_YEARLY" },
    quotas: {
      maxSites: 5,
      maxPagesPerSite: Number.POSITIVE_INFINITY,
      maxCollectionsPerSite: Number.POSITIVE_INFINITY,
      maxEntriesPerCollection: Number.POSITIVE_INFINITY,
      bandwidthBytesPerMonth: 2 * 1024 ** 4,
      storageBytes: 50 * 1024 ** 3,
      apiRequestsPerMinute: 2_400,
    },
    features: [
      "5 sites",
      "Unlimited pages",
      "Unlimited CMS",
      "Wildcard custom domains",
      "E-commerce + memberships",
      "AI workflows (Mistral)",
      "Priority support",
    ],
    highlight: false,
  },
];

export function getPlan(id: PlanId): PlanTier {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

export function formatPriceCents(cents: number, currency: "USD" = "USD"): string {
  const dollars = cents / 100;
  if (currency === "USD") {
    return `$${dollars.toFixed(dollars % 1 === 0 ? 0 : 2)}`;
  }
  return `${dollars.toFixed(2)} ${currency}`;
}
