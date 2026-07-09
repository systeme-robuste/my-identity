/**
 * Schema barrel. Re-exports every table.
 *
 * NOTE: schemas in this folder are placeholders for Drizzle Kit to discover.
 * The source of truth is `migrations/0001_initial.sql`. After running
 * `pnpm --filter @my-identity/db generate`, Drizzle Kit will produce
 * `migrations/0001_initial.sql` (overwriting this comment) and these
 * files will be filled with typed table definitions.
 */

export * from "./users";
export * from "./sessions";
export * from "./sites";
export * from "./pages";
export * from "./cms";
export * from "./forms";
export * from "./email";
export * from "./products";
export * from "./orders";
export * from "./members";
export * from "./gated";
export * from "./automations";
export * from "./analytics";
export * from "./usage";
export * from "./webhooks";
export * from "./audit";
export * from "./abuse";
export * from "./data-rights";
export * from "./api-keys";
export * from "./oauth";
export * from "./media";
