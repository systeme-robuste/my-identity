/**
 * Automation types (Phase 2). An automation is a trigger + filter + action
 * pipeline. Triggers are platform events; actions can be platform calls
 * (send email, create order) or AI steps (Mistral call).
 */

import type { CmsEntry } from "./cms.ts";

export type AutomationTrigger =
  | { type: "form_submitted"; formId: string }
  | { type: "order_paid"; productIds: ReadonlyArray<string> | null }
  | { type: "member_signed_up"; tier: "free" | "pro" | "business" }
  | { type: "cms_entry_published"; collectionId: string }
  | { type: "webhook_received"; webhookId: string };

export type AutomationAction =
  | { type: "send_email"; templateId: string; to: "submitter" | "owner" | "member" }
  | { type: "add_to_email_list"; listId: string }
  | { type: "create_cms_entry"; collectionId: string; data: Readonly<Record<string, unknown>> }
  | { type: "call_webhook"; webhookId: string; bodyTemplate: string /* JSON template */ }
  | { type: "ai_complete"; prompt: string; model: "mistral-large" | "mistral-small"; saveToCmsField: { collectionId: string; entryId: string; field: string } | null };

export interface Automation {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  trigger: AutomationTrigger;
  actions: ReadonlyArray<AutomationAction>;
  /** JSONLogic-style predicate; automation runs only if `true`. */
  filter: Readonly<Record<string, unknown>> | null;
  enabled: boolean;
  /** Last run timestamp + result for the dashboard status pill. */
  lastRunAt: string | null;
  lastRunStatus: "succeeded" | "failed" | "skipped" | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRun {
  id: string;
  automationId: string;
  status: "running" | "succeeded" | "failed" | "skipped";
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  /** Snapshot of the trigger payload (for replay). */
  triggerPayload: Readonly<Record<string, unknown>>;
  /** Result of each action, in order. */
  actionResults: ReadonlyArray<{ type: AutomationAction["type"]; status: "succeeded" | "failed"; error: string | null }>;
}

/** Re-export for callers that want the entry shape from a trigger. */
export type CmsEntryPayload = CmsEntry;
