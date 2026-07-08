/**
 * @my-identity/api
 *
 * Cloudflare Workers entry. Mounts every route under `/v1/*` and a small
 * set of root-level endpoints (`/`, `/health`). CORS, rate-limiting,
 * authentication, and audit logging are mounted as middleware in this
 * order: CORS → requestId → rateLimit → auth (where required) → handler.
 *
 * The Hono app is exported in two forms:
 *   1. The default `app` for `wrangler` (Workers runtime).
 *   2. The `routeTree` for typed RPC clients (used by the dashboard).
 */

import { Hono } from "hono";
import { cors } from "./middleware/cors.ts";
import { audit } from "./middleware/audit.ts";
import { auth } from "./middleware/auth.ts";
import { rateLimit } from "./middleware/rate-limit.ts";

import { healthRoutes } from "./routes/health.ts";
import { authRoutes } from "./routes/auth.ts";
import { siteRoutes } from "./routes/sites.ts";
import { pageRoutes } from "./routes/pages.ts";
import { cmsRoutes } from "./routes/cms.ts";
import { formRoutes } from "./routes/forms.ts";
import { mediaRoutes } from "./routes/media.ts";
import { webhookRoutes } from "./routes/webhooks.ts";
import { apiRoutes } from "./routes/api.ts";

import type { Env } from "./types/env.d.ts";
import { logger } from "./lib/logger.ts";
import { errorHandler, notFoundHandler } from "./lib/errors.ts";

const app = new Hono<Env>();

// --- Global middleware ---
app.use("*", logger({ pretty: false }));
app.use("/v1/*", cors({ origin: (origin) => origin, credentials: true }));
app.use("/v1/*", rateLimit({ window: 60, max: 600, by: "ip" }));

// --- Health & root ---
app.route("/", healthRoutes);

// --- Public, versioned API ---
const v1 = new Hono<Env>();
v1.route("/auth", authRoutes);
v1.route("/sites", siteRoutes);
v1.route("/sites", pageRoutes);
v1.route("/sites", cmsRoutes);
v1.route("/sites", formRoutes);
v1.route("/sites", mediaRoutes);
v1.route("/sites", webhookRoutes);
v1.route("/", apiRoutes); // public, per-site, end-user API
v1.use("/sites/*", auth({ required: true }));
v1.use("/me/*", auth({ required: true }));
v1.use("/me/*", audit());
app.route("/v1", v1);

// --- Error handling ---
app.onError(errorHandler);
app.notFound(notFoundHandler);

export default app;
export type AppType = typeof app;
