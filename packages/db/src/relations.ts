/**
 * Drizzle relations. Defines one-to-many and many-to-one links between tables
 * for use with the `db.query` API.
 *
 * Aligned with `migrations/0001_initial.sql`.
 */
import { relations } from "drizzle-orm";
import * as s from "./schema/index.ts";

export const usersRelations = relations(s.users, ({ many }) => ({
  sessions: many(s.sessions),
  sites: many(s.sites),
  memberships: many(s.members),
  oauthAccounts: many(s.oauthAccounts),
  apiKeys: many(s.apiKeys),
  siteMembers: many(s.siteMembers),
  usageEvents: many(s.usageEvents),
  dataExportRequests: many(s.dataExportRequests),
  cmsEntries: many(s.cmsEntries),
  abuseReportsReviewed: many(s.abuseReports),
}));

export const sessionsRelations = relations(s.sessions, ({ one }) => ({
  user: one(s.users, { fields: [s.sessions.userId], references: [s.users.id] }),
}));

export const sitesRelations = relations(s.sites, ({ one, many }) => ({
  owner: one(s.users, { fields: [s.sites.userId], references: [s.users.id] }),
  pages: many(s.pages),
  forms: many(s.forms),
  cmsCollections: many(s.cmsCollections),
  members: many(s.members),
  orders: many(s.orders),
  products: many(s.products),
  webhooks: many(s.webhooks),
  automations: many(s.automations),
  subscribers: many(s.subscribers),
  emailTemplates: many(s.emailTemplates),
  membershipTiers: many(s.membershipTiers),
  siteMembers: many(s.siteMembers),
  gatedContent: many(s.gatedContent),
  apiKeys: many(s.apiKeys),
}));

export const siteMembersRelations = relations(s.siteMembers, ({ one }) => ({
  site: one(s.sites, { fields: [s.siteMembers.siteId], references: [s.sites.id] }),
  user: one(s.users, { fields: [s.siteMembers.userId], references: [s.users.id] }),
  inviter: one(s.users, { fields: [s.siteMembers.invitedBy], references: [s.users.id] }),
}));

export const pagesRelations = relations(s.pages, ({ one }) => ({
  site: one(s.sites, { fields: [s.pages.siteId], references: [s.sites.id] }),
}));

export const cmsCollectionsRelations = relations(s.cmsCollections, ({ one, many }) => ({
  site: one(s.sites, { fields: [s.cmsCollections.siteId], references: [s.sites.id] }),
  entries: many(s.cmsEntries),
}));

export const cmsEntriesRelations = relations(s.cmsEntries, ({ one }) => ({
  collection: one(s.cmsCollections, { fields: [s.cmsEntries.collectionId], references: [s.cmsCollections.id] }),
  author: one(s.users, { fields: [s.cmsEntries.authorId], references: [s.users.id] }),
}));

export const formsRelations = relations(s.forms, ({ one, many }) => ({
  site: one(s.sites, { fields: [s.forms.siteId], references: [s.sites.id] }),
  submissions: many(s.formSubmissions),
}));

export const formSubmissionsRelations = relations(s.formSubmissions, ({ one }) => ({
  form: one(s.forms, { fields: [s.formSubmissions.formId], references: [s.forms.id] }),
}));

export const subscribersRelations = relations(s.subscribers, ({ one }) => ({
  site: one(s.sites, { fields: [s.subscribers.siteId], references: [s.sites.id] }),
  sourceForm: one(s.forms, { fields: [s.subscribers.sourceFormId], references: [s.forms.id] }),
}));

export const emailTemplatesRelations = relations(s.emailTemplates, ({ one, many }) => ({
  site: one(s.sites, { fields: [s.emailTemplates.siteId], references: [s.sites.id] }),
  broadcasts: many(s.emailBroadcasts),
}));

export const emailBroadcastsRelations = relations(s.emailBroadcasts, ({ one }) => ({
  site: one(s.sites, { fields: [s.emailBroadcasts.siteId], references: [s.sites.id] }),
  template: one(s.emailTemplates, { fields: [s.emailBroadcasts.templateId], references: [s.emailTemplates.id] }),
}));

export const productsRelations = relations(s.products, ({ one, many }) => ({
  site: one(s.sites, { fields: [s.products.siteId], references: [s.sites.id] }),
  orders: many(s.orders),
}));

export const ordersRelations = relations(s.orders, ({ one }) => ({
  site: one(s.sites, { fields: [s.orders.siteId], references: [s.sites.id] }),
  product: one(s.products, { fields: [s.orders.productId], references: [s.products.id] }),
}));

export const membershipTiersRelations = relations(s.membershipTiers, ({ one, many }) => ({
  site: one(s.sites, { fields: [s.membershipTiers.siteId], references: [s.sites.id] }),
  members: many(s.members),
  gatedContent: many(s.gatedContent),
}));

export const membersRelations = relations(s.members, ({ one }) => ({
  site: one(s.sites, { fields: [s.members.siteId], references: [s.sites.id] }),
  tier: one(s.membershipTiers, { fields: [s.members.tierId], references: [s.membershipTiers.id] }),
  user: one(s.users, { fields: [s.members.userId], references: [s.users.id] }),
}));

export const gatedContentRelations = relations(s.gatedContent, ({ one }) => ({
  site: one(s.sites, { fields: [s.gatedContent.siteId], references: [s.sites.id] }),
  requiredTier: one(s.membershipTiers, { fields: [s.gatedContent.requiredTierId], references: [s.membershipTiers.id] }),
}));

export const automationsRelations = relations(s.automations, ({ one, many }) => ({
  site: one(s.sites, { fields: [s.automations.siteId], references: [s.sites.id] }),
  logs: many(s.automationLogs),
}));

export const automationLogsRelations = relations(s.automationLogs, ({ one }) => ({
  automation: one(s.automations, { fields: [s.automationLogs.automationId], references: [s.automations.id] }),
}));

export const webhooksRelations = relations(s.webhooks, ({ one, many }) => ({
  site: one(s.sites, { fields: [s.webhooks.siteId], references: [s.sites.id] }),
  deliveries: many(s.webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(s.webhookDeliveries, ({ one }) => ({
  webhook: one(s.webhooks, { fields: [s.webhookDeliveries.webhookId], references: [s.webhooks.id] }),
}));

export const apiKeysRelations = relations(s.apiKeys, ({ one }) => ({
  user: one(s.users, { fields: [s.apiKeys.userId], references: [s.users.id] }),
  site: one(s.sites, { fields: [s.apiKeys.siteId], references: [s.sites.id] }),
}));

export const oauthAccountsRelations = relations(s.oauthAccounts, ({ one }) => ({
  user: one(s.users, { fields: [s.oauthAccounts.userId], references: [s.users.id] }),
}));

export const usageEventsRelations = relations(s.usageEvents, ({ one }) => ({
  user: one(s.users, { fields: [s.usageEvents.userId], references: [s.users.id] }),
}));

export const dataExportRequestsRelations = relations(s.dataExportRequests, ({ one }) => ({
  user: one(s.users, { fields: [s.dataExportRequests.userId], references: [s.users.id] }),
}));

export const abuseReportsRelations = relations(s.abuseReports, ({ one }) => ({
  reviewer: one(s.users, { fields: [s.abuseReports.reviewedBy], references: [s.users.id] }),
}));
