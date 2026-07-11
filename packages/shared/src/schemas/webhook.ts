import { z } from "zod";

export const webhookEventTypeSchema = z.enum([
  "site.published",
  "site.unpublished",
  "page.created",
  "page.updated",
  "page.deleted",
  "form.submitted",
  "order.paid",
  "order.refunded",
  "member.signed_up",
  "member.cancelled",
  "cms.entry.published",
  "automation.run.succeeded",
  "automation.run.failed",
]);

export const createWebhookSchema = z.object({
  /**
   * @deprecated Will be ignored — My Identity only supports outgoing webhooks.
   *             Kept for backward compatibility with the v0.1.0 API contract.
   *             Clients should always pass 'outgoing' or omit this field.
   */
  direction: z.enum(["incoming", "outgoing"]).optional(),
  url: z.string().url().max(2048),
  events: z.array(webhookEventTypeSchema).min(1).max(32),
  /**
   * @deprecated Will be ignored — use `state` in the future API. Kept for
   *             backward compatibility.
   */
  enabled: z.boolean().default(true),
});

export const updateWebhookSchema = createWebhookSchema.partial();

export const incomingWebhookSchema = z.object({
  /** Free-form payload; we only require it to be a JSON object. */
  payload: z.record(z.unknown()),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
export type IncomingWebhookInput = z.infer<typeof incomingWebhookSchema>;
