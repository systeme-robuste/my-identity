/**
 * Order types. An order is created when a Stripe Checkout session completes.
 * The order row is the source of truth for the customer's purchase; the
 * Stripe session/payment intent refs are stored for reconciliation.
 */

export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "refunded"
  | "partially_refunded"
  | "cancelled"
  | "failed";

export interface OrderItem {
  productId: string;
  name: string;
  /** Cents at the time of purchase, frozen in case the product price later changes. */
  priceCents: number;
  quantity: number;
}

export interface Order {
  id: string;
  siteId: string;
  customerId: string | null;
  /** Customer email at the time of purchase. May differ from the linked customer record. */
  customerEmail: string;
  status: OrderStatus;
  items: ReadonlyArray<OrderItem>;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: "USD";
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  /** Shipping address, null for digital goods. */
  shippingAddress: {
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string;
    country: string;
  } | null;
  createdAt: string;
  paidAt: string | null;
  fulfilledAt: string | null;
  refundedAt: string | null;
}
