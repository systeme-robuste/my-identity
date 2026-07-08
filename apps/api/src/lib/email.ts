/**
 * Resend client. Wraps the Resend SDK and exposes a typed `send` that
 * the rest of the app uses. Templates live in `apps/api/src/templates/`
 * (TODO) and are inlined here for simplicity at MVP.
 */

import { Resend } from "resend";
import type { Env } from "../types/env.d.ts";

let client: Resend | null = null;

function getClient(apiKey: string): Resend {
  if (!client) client = new Resend(apiKey);
  return client;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: ReadonlyArray<{ name: string; value: string }>;
}

export async function sendEmail(env: Env, args: SendEmailArgs): Promise<{ id: string }> {
  const r = getClient(env.RESEND_API_KEY);
  const result = await r.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text ?? stripHtml(args.html),
    replyTo: args.replyTo ?? env.RESEND_REPLY_TO,
    tags: args.tags ? [...args.tags] : undefined,
  });
  if (result.error) {
    throw new Error(`Resend error: ${result.error.name} — ${result.error.message}`);
  }
  if (!result.data) throw new Error("Resend returned no data");
  return { id: result.data.id };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
