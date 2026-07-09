/**
 * CMS types — collections and entries. A collection is a schema for a kind
 * of content (e.g. "BlogPost", "Product", "Testimonial"). An entry is an
 * instance conforming to that schema. Schemas are user-defined in the
 * dashboard, so we use a permissive record for fields.
 */

export type CollectionFieldType =
  | "text"
  | "longtext"
  | "richtext"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "url"
  | "email"
  | "image"
  | "file"
  | "select"
  | "multiselect"
  | "json"
  | "reference";

export interface CollectionField {
  /** Machine name, e.g. "title", "body", "cover_image". */
  name: string;
  label: string;
  type: CollectionFieldType;
  required: boolean;
  unique: boolean;
  /** For select / multiselect. */
  options: ReadonlyArray<string> | null;
  /** For reference: target collection id. */
  referenceCollectionId: string | null;
  /** Default value (stringified for the simple types). */
  defaultValue: string | null;
  /** Order in the editor, ascending. */
  order: number;
}

export interface CmsCollection {
  id: string;
  siteId: string;
  /** Machine name, e.g. "blog_posts". */
  name: string;
  label: string;
  description: string | null;
  fields: ReadonlyArray<CollectionField>;
  createdAt: string;
  updatedAt: string;
}

/** A single entry. The shape of `data` matches the parent collection's `fields`. */
export interface CmsEntry {
  id: string;
  collectionId: string;
  siteId: string;
  /** URL slug, unique within a collection. */
  slug: string;
  data: Readonly<Record<string, unknown>>;
  /** Locale-specific variant, or null if this is the default. */
  locale: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
