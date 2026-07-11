/**
 * Unit tests for `lib/stripe.ts` — Stripe wrapper.
 *
 * Mocks the Stripe SDK to avoid network calls.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createCheckoutSession, createCustomerPortalSession, verifyWebhookSignature } from "./stripe.ts";
import type { Env } from "../types/env.d.ts";

const mockCheckoutCreate = vi.fn();
const mockPortalCreate = vi.fn();
const mockWebhookConstruct = vi.fn();

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: { sessions: { create: (...a: unknown[]) => mockCheckoutCreate(...a) } },
      billingPortal: { sessions: { create: (...a: unknown[]) => mockPortalCreate(...a) } },
      webhooks: { constructEvent: (...a: unknown[]) => mockWebhookConstruct(...a) },
    })),
  };
});

const env = {
  STRIPE_SECRET_KEY: "sk_test_xxx",
  STRIPE_WEBHOOK_SECRET: "whsec_xxx",
  ENVIRONMENT: "test",
} as unknown as Env;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createCheckoutSession", () => {
  it("passes through all fields to Stripe", async () => {
    mockCheckoutCreate.mockResolvedValueOnce({ id: "cs_abc", url: "https://stripe.com/..." });
    const r = await createCheckoutSession(env, {
      customerId: "cus_1",
      customerEmail: null,
      priceId: "price_1",
      successUrl: "https://app/success",
      cancelUrl: "https://app/cancel",
      metadata: { site_id: "s1" },
    });
    expect(r.id).toBe("cs_abc");
    expect(r.url).toBe("https://stripe.com/...");
    const call = mockCheckoutCreate.mock.calls[0][0];
    expect(call.customer).toBe("cus_1");
    expect(call.line_items[0].price).toBe("price_1");
    expect(call.metadata).toEqual({ site_id: "s1" });
  });

  it("uses customer_email when no customerId", async () => {
    mockCheckoutCreate.mockResolvedValueOnce({ id: "cs_def", url: null });
    await createCheckoutSession(env, {
      customerId: null,
      customerEmail: "alice@example.com",
      priceId: "price_1",
      successUrl: "x",
      cancelUrl: "y",
      metadata: {},
    });
    const call = mockCheckoutCreate.mock.calls[0][0];
    expect(call.customer_email).toBe("alice@example.com");
    expect(call.customer).toBeUndefined();
  });
});

describe("createCustomerPortalSession", () => {
  it("returns the URL", async () => {
    mockPortalCreate.mockResolvedValueOnce({ url: "https://billing.stripe.com/..." });
    const r = await createCustomerPortalSession(env, "cus_1", "https://app/account");
    expect(r.url).toBe("https://billing.stripe.com/...");
    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: "cus_1",
      return_url: "https://app/account",
    });
  });
});

describe("verifyWebhookSignature", () => {
  it("returns the event from Stripe", () => {
    const fakeEvent = { type: "charge.succeeded", id: "evt_1", data: { object: {} } };
    mockWebhookConstruct.mockReturnValueOnce(fakeEvent);
    const r = verifyWebhookSignature(env, "raw body", "t=1,v1=abc");
    expect(r).toBe(fakeEvent);
    expect(mockWebhookConstruct).toHaveBeenCalledWith("raw body", "t=1,v1=abc", "whsec_xxx");
  });
});
