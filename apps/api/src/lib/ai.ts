/**
 * Mistral AI client. Used by the automations engine to power AI steps
 * (e.g. "summarize this form submission", "translate this CMS entry").
 * At MVP this is a thin wrapper; Phase 2 will add JSON-mode, tools, and
 * caching.
 */

import type { Env } from "../types/env.d.ts";

export interface MistralMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface MistralChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface MistralChatResult {
  content: string;
  finishReason: "stop" | "length" | "tool_calls" | "error";
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export async function mistralChat(env: Env, messages: ReadonlyArray<MistralMessage>, opts: MistralChatOptions = {}): Promise<MistralChatResult> {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? env.MISTRAL_MODEL,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 1024,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mistral API error: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices: Array<{ finish_reason: string; message: { content: string } }>;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };
  const choice = data.choices[0];
  if (!choice) throw new Error("Mistral returned no choices");
  return {
    content: choice.message.content,
    finishReason: (choice.finish_reason as MistralChatResult["finishReason"]) ?? "stop",
    usage: {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    },
  };
}
