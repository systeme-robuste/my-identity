/**
 * @my-identity/shared
 *
 * Single import surface for the rest of the monorepo. Every app and the
 * dashboard pulls shared types, Zod schemas, constants, i18n, and utilities
 * from here. The intent is that this package never has a runtime side effect
 * and is fully tree-shakable.
 */

// Types
export type * from "./types/index.ts";

// Zod schemas
export * from "./schemas/index.ts";

// Constants (plans, limits, event names, locales)
export * from "./constants/index.ts";

// Pure utilities (slug, sanitize, format, validate, crypto, id)
export * from "./utils/index.ts";

// i18n string tables (fr, en, es)
export * from "./i18n/index.ts";
