/**
 * Unit tests for `lib/email.ts` — Resend email client wrapper.
 *
 * Mocks the Resend SDK constructor to avoid network calls.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { sendEmail } from "./email.ts";
import type { Env } from "../types/env.d.ts";

let sendMock: ReturnType<typeof vi.fn>;

vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: { send: (...args: unknown[]) => sendMock(...args) },
    })),
  };
});

const env = {
  RESEND_API_KEY: "re_test_xxx",
  RESEND_FROM_EMAIL: "hello@myidentity.app",
  RESEND_REPLY_TO: "support@myidentity.app",
  ENVIRONMENT: "test",
} as unknown as Env;

beforeEach(() => {
  sendMock = vi.fn();
});

describe("sendEmail", () => {
  it("calls the Resend SDK with the right payload", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "msg_abc" }, error: null });
    const result = await sendEmail(env, {
      to: "alice@example.com",
      subject: "Hi",
      html: "<p>Hello</p>",
    });
    expect(result).toEqual({ id: "msg_abc" });
    expect(sendMock).toHaveBeenCalledOnce();
    const call = sendMock.mock.calls[0][0];
    expect(call.from).toBe("hello@myidentity.app");
    expect(call.to).toBe("alice@example.com");
    expect(call.subject).toBe("Hi");
    expect(call.html).toBe("<p>Hello</p>");
  });

  it("strips HTML for text fallback", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "msg_abc" }, error: null });
    await sendEmail(env, { to: "a@b.co", subject: "S", html: "<p>Hello <b>world</b></p>" });
    const call = sendMock.mock.calls[0][0];
    expect(call.text).toBe("Hello world");
  });

  it("uses provided text override", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "msg_abc" }, error: null });
    await sendEmail(env, { to: "a@b.co", subject: "S", html: "<p>x</p>", text: "explicit" });
    const call = sendMock.mock.calls[0][0];
    expect(call.text).toBe("explicit");
  });

  it("throws on Resend error", async () => {
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { name: "validation_error", message: "Bad email" },
    });
    await expect(sendEmail(env, { to: "bad", subject: "S", html: "<p>x</p>" })).rejects.toThrow();
  });

  it("throws on missing data", async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(sendEmail(env, { to: "a@b.co", subject: "S", html: "<p>x</p>" })).rejects.toThrow();
  });

  it("forwards tags", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "msg_abc" }, error: null });
    await sendEmail(env, {
      to: "a@b.co",
      subject: "S",
      html: "<p>x</p>",
      tags: [{ name: "campaign", value: "spring" }],
    });
    const call = sendMock.mock.calls[0][0];
    expect(call.tags).toEqual([{ name: "campaign", value: "spring" }]);
  });
});
