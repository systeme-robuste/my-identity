/**
 * Stripe client. Wraps the official SDK and exposes a typed surface for
 * the rest of the app: checkout session creation, customer portal,
 * subscription sync, webhook signature verification.
 *
 * TODO(Phase 1): wire up the customer portal and webhook handler.
 */

import Stripe from "stripe";
import type { Env } from "../types/env.d.ts";

let client: Stripe | null = null;

function getClient(env: Env): Stripe {
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      typescript: true,
      maxNetworkRetries: 2,
    });
  }
  return client;
}

export interface CreateCheckoutArgs {
  customerId: string | null;
  customerEmail: string | null;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Readonly<Record<string, string>>;
}

export async function createCheckoutSession(env: Env, args: CreateCheckoutArgs): Promise<{ id: string; url: string | null }> {
  const s = getClient(env);
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: args.customerId ?? undefined,
    customer_email: args.customerId ? undefined : args.customerEmail ?? undefined,
    line_items: [{ price: args.priceId, quantity: 1 }],
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    metadata: { ...args.metadata },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });
  return { id: session.id, url: session.url };
}

export async function createCustomerPortalSession(env: Env, customerId: string, returnUrl: string): Promise<{ url: string }> {
  const s = getClient(env);
  const portal = await s.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
  return { url: portal.url };
}

export function verifyWebhookSignature(env: Env, body: string, signature: string): Stripe.Event {
  const s = getClient(env);
  return s.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
}
