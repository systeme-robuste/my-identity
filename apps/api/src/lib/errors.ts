/**
 * Typed application errors + Hono error/404 handlers.
 *
 * `ApiError` is the single error class used by route handlers. The
 * `errorHandler` middleware converts it to a JSON response, sets the
 * right HTTP status, and (in production) hides stack traces.
 */

import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { log } from "./logger.ts";
import type { Env } from "../types/env.d.ts";

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: ContentfulStatusCode;
  public readonly details: ReadonlyArray<{ field: string; message: string }> | null;

  constructor(
    code: string,
    message: string,
    status: ContentfulStatusCode = 400,
    details: ReadonlyArray<{ field: string; message: string }> | null = null
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function errorHandler(err: Error, c: Context<Env>): Promise<Response> {
  if (err instanceof ApiError) {
    return c.json(
      {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId: (c.get("requestId" as never) as string | undefined) ?? null,
        },
      },
      err.status
    );
  }
  log(c.env, "error", "unhandled_error", { error: err.message, stack: err.stack });
  return c.json(
    {
      error: {
        code: "internal_error",
        message: c.env.ENVIRONMENT === "production" ? "Internal server error" : err.message,
        details: null,
        requestId: (c.get("requestId" as never) as string | undefined) ?? null,
      },
    },
    500
  );
}

export function notFoundHandler(c: Context<Env>): Response {
  return c.json(
    {
      error: {
        code: "not_found",
        message: `No route matches ${c.req.method} ${c.req.path}`,
        details: null,
        requestId: (c.get("requestId" as never) as string | undefined) ?? null,
      },
    },
    404
  );
}
