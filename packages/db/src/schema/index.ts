/**
 * Schema barrel. Re-exports every table.
 *
 * Aligned with `migrations/0001_initial.sql`. After running
 * `pnpm --filter @my-identity/db generate`, Drizzle Kit will produce
 * migrations matching this schema.
 */
export * from "./users";
export * from "./sessions";
export * from "./sites";          // sites + siteMembers
export * from "./pages";
export * from "./cms";            // cmsCollections + cmsEntries
export * from "./forms";          // forms + formSubmissions
export * from "./email";          // subscribers + emailTemplates + emailBroadcasts
export * from "./products";
export * from "./orders";
export * from "./members";        // membershipTiers + members
export * from "./gated";          // gatedContent
export * from "./automations";    // automations + automationLogs
export * from "./analytics";      // analyticsEvents
export * from "./usage";          // usageEvents
export * from "./webhooks";       // webhooks + webhookDeliveries
export * from "./audit";          // auditLog
export * from "./abuse";          // abuseReports
export * from "./data-rights";    // dataExportRequests
export * from "./api-keys";
export * from "./oauth";          // oauthAccounts
