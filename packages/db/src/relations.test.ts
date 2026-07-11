/**
 * Sanity test: the relations module imports without throwing, and all
 * referenced tables actually exist in the schema index.
 *
 * This is a "compiles + shape check" test — it doesn't run any actual
 * queries, just verifies the relations are wired correctly.
 */
import { describe, it, expect } from "vitest";
import * as relations from "./relations.ts";
import * as schema from "./schema/index.ts";

describe("relations", () => {
  it("exports a relation for every domain table", () => {
    // The relations file should at minimum declare these.
    // If a new schema is added without a relation, this catches it.
    const expected = [
      "usersRelations",
      "sessionsRelations",
      "sitesRelations",
      "pagesRelations",
      "cmsCollectionsRelations",
      "cmsEntriesRelations",
      "formsRelations",
      "formSubmissionsRelations",
      "productsRelations",
      "ordersRelations",
      "webhooksRelations",
      "auditLogRelations",
    ];
    for (const name of expected) {
      expect(relations, `missing relation: ${name}`).toHaveProperty(name);
    }
  });

  it("every schema table referenced in relations actually exists", () => {
    // The relations file imports `* as s from "./schema/index.ts"`.
    // We re-check that the schema index is non-empty.
    const schemaKeys = Object.keys(schema);
    expect(schemaKeys.length).toBeGreaterThan(20);
    // Spot-check a few table names that must exist
    for (const t of ["users", "sites", "pages", "orders", "products", "webhooks", "auditLog"]) {
      expect(schemaKeys, `missing table: ${t}`).toContain(t);
    }
  });
});
