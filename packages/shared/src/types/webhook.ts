/**
 * Webhook types — both incoming (a third party POSTs to us) and outgoing
 * (we POST to a third party). Each webhook has a per-site secret used to
 * sign/verify the body with HMAC-SHA256.
 */

export type WebhookDirection = "incoming" | "outgoing";

export type WebhookEventType =
  | "site.published"
  | "site.unpublished"
  | "page.created"
  | "page.updated"
  | "page.deleted"
  | "form.submitted"
  | "order.paid"
  | "order.refunded"
  | "member.signed_up"
  | "member.cancelled"
  | "cms.entry.published"
  | "automation.run.succeeded"
  | "automation.run.failed";

export interface Webhook {
  id: string;
  siteId: string;
  direction: WebhookDirection;
  url: string;
  /** Event types this webhook subscribes to (outgoing) or is expected to send (incoming). */
  events: ReadonlyArray<WebhookEventType>;
  /** Per-webhook secret used to sign/verify payloads. */
  secret: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEventType;
  status: "pending" | "succeeded" | "failed" | "dead";
  attempt: number;
  responseStatus: number | null;
  responseBody: string | null;
  error: string | null;
  scheduledAt: string;
  deliveredAt: string | null;
  nextRetryAt: string | null;
}
