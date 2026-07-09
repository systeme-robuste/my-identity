/**
 * Analytics event names. Keep this list in sync with the dashboard's
 * `apps/dashboard/src/lib/analytics.ts` and the renderer's
 * `apps/renderer/src/lib/analytics.ts`.
 */

export const ANALYTICS_EVENTS = {
  PAGE_VIEW: "page_view",
  CTA_CLICK: "cta_click",
  FORM_SUBMIT: "form_submit",
  FORM_SUBMIT_SUCCESS: "form_submit_success",
  FORM_SUBMIT_ERROR: "form_submit_error",
  PRODUCT_VIEW: "product_view",
  ADD_TO_CART: "add_to_cart",
  CHECKOUT_START: "checkout_start",
  CHECKOUT_COMPLETE: "checkout_complete",
  MEMBER_SIGNUP: "member_signup",
  MEMBER_LOGIN: "member_login",
  AI_WORKFLOW_RUN: "ai_workflow_run",
  WEBHOOK_DELIVERED: "webhook_delivered",
  WEBHOOK_FAILED: "webhook_failed",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
