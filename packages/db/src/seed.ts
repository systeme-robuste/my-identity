/**
 * Seed script — populates a fresh database with realistic demo data.
 *
 * Usage:
 *   pnpm --filter @my-identity/db seed
 *
 * Idempotent: re-running the seed will NOT duplicate data. It checks for
 * existing rows by email (users) and slug (sites) before inserting.
 *
 * Creates:
 *   - 1 owner user (demo@myidentity.local)
 *   - 4 plan variants (free, pro, business, owner)
 *   - 5 sites, each with 3-5 pages, 1-2 forms, 1 collection with 3 entries,
 *     2-3 media items, and a published design
 *   - 12 sessions (active + expired)
 *   - 1 API key per site
 *   - 8 abuse events
 *   - 1 webhook
 *
 * Demo credentials: demo@myidentity.local / demo1234
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { randomBytes, scryptSync } from "node:crypto";
import * as schema from "./schema/index.ts";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://myidentity:myidentity_dev@localhost:5432/myidentity_dev";

function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function ulid(): string {
  // Crockford base-32, 26 chars, monotonic
  const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const now = Date.now();
  let out = "";
  let t = now;
  for (let i = 0; i < 10; i++) {
    out = ENCODING[t % 32] + out;
    t = Math.floor(t / 32);
  }
  const rand = randomBytes(8);
  for (let i = 0; i < 16; i++) {
    out += ENCODING[rand[i] % 32];
  }
  return out;
}

async function main() {
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("🌱 Seeding database...\n");

  // ---- 1. Owner user (idempotent) ----
  const ownerEmail = "demo@myidentity.local";
  let owner = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, ownerEmail),
  });
  if (owner) {
    console.log(`  ↺ owner user exists: ${ownerEmail} (${owner.id})`);
  } else {
    const [created] = await db
      .insert(schema.users)
      .values({
        email: ownerEmail,
        passwordHash: hashPassword("demo1234"),
        name: "Demo Owner",
        role: "owner",
        plan: "business",
        emailVerifiedAt: new Date(),
        locale: "fr",
        metadata: { source: "seed", version: 1 },
      })
      .returning();
    owner = created;
    console.log(`  ✓ owner user: ${ownerEmail} → ${owner.id}`);
  }

  // 4 additional test users (different plans)
  const planUsers = [
    { email: "alice@myidentity.local", name: "Alice Martin", plan: "pro", role: "admin" },
    { email: "bob@myidentity.local", name: "Bob Dupont", plan: "free", role: "editor" },
    { email: "charlie@myidentity.local", name: "Charlie Lévi", plan: "pro", role: "editor" },
    { email: "diana@myidentity.local", name: "Diana Roy", plan: "free", role: "viewer" },
  ];
  for (const u of planUsers) {
    const exists = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.email, u.email),
    });
    if (exists) {
      console.log(`  ↺ user exists: ${u.email}`);
      continue;
    }
    await db.insert(schema.users).values({
      email: u.email,
      passwordHash: hashPassword("demo1234"),
      name: u.name,
      role: u.role,
      plan: u.plan,
      emailVerifiedAt: new Date(),
      locale: "fr",
    });
    console.log(`  ✓ user: ${u.email} (${u.plan})`);
  }

  // ---- 2. Sites (5 demos) ----
  const siteDefs = [
    { slug: "aura", name: "Aura Photography", owner: ownerEmail, template: "aura", plan: "pro" },
    { slug: "kiosk", name: "Kiosk Café", owner: ownerEmail, template: "kiosk", plan: "free" },
    { slug: "ledger", name: "Ledger Conseil", owner: ownerEmail, template: "ledger", plan: "pro" },
    { slug: "atelier", name: "Atelier Zola", owner: "alice@myidentity.local", template: "atelier", plan: "pro" },
    { slug: "studio-bb", name: "Studio BB", owner: "charlie@myidentity.local", template: "blank", plan: "free" },
  ];

  for (const s of siteDefs) {
    const exists = await db.query.sites.findFirst({
      where: (t, { eq }) => eq(t.slug, s.slug),
    });
    if (exists) {
      console.log(`  ↺ site exists: ${s.slug}`);
      continue;
    }
    const siteOwner = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.email, s.owner),
    });
    if (!siteOwner) continue;

    const [site] = await db
      .insert(schema.sites)
      .values({
        ownerId: siteOwner.id,
        slug: s.slug,
        name: s.name,
        description: `${s.name} — site de démo`,
        locale: "fr",
        design: {
          template: s.template,
          theme: "light",
          primary: "#0F172A",
          radius: 0,
          font: "Inter",
        },
        isPublished: true,
        plan: s.plan,
        url: `https://${s.slug}.myidentity.local`,
      })
      .returning();
    console.log(`  ✓ site: ${s.slug} → ${site.id}`);

    // Pages: home + 3 sub-pages
    const pageDefs = [
      { slug: "index", title: s.name, isHomepage: true, blocks: homeBlocks(s.name, s.template) },
      { slug: "about", title: "À propos", blocks: aboutBlocks(s.name) },
      { slug: "contact", title: "Contact", blocks: contactBlocks() },
      { slug: "work", title: "Réalisations", blocks: portfolioBlocks() },
    ];
    for (let i = 0; i < pageDefs.length; i++) {
      const p = pageDefs[i];
      await db.insert(schema.pages).values({
        siteId: site.id,
        slug: p.slug,
        title: p.title,
        isHomepage: !!p.isHomepage,
        order: i,
        status: "published",
        publishedAt: new Date(),
        blocks: p.blocks,
        seo: {
          title: `${p.title} — ${s.name}`,
          description: `Page ${p.title} du site ${s.name}`,
        },
      });
    }

    // 1 Form (contact)
    await db.insert(schema.forms).values({
      siteId: site.id,
      slug: "contact",
      name: "Contact",
      fields: [
        { name: "name", label: "Nom", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "message", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Envoyer",
      successMessage: "Merci, je vous réponds sous 24h.",
      emailTo: siteOwner.email,
    });

    // 1 Collection (posts) with 3 entries
    const [collection] = await db
      .insert(schema.collections)
      .values({
        siteId: site.id,
        slug: "posts",
        name: "Articles",
        description: "Articles de blog",
        schema: {
          title: { type: "text", required: true },
          body: { type: "textarea", required: true },
          publishedAt: { type: "date" },
        },
      })
      .returning();

    for (let i = 1; i <= 3; i++) {
      await db.insert(schema.entries).values({
        collectionId: collection.id,
        siteId: site.id,
        status: "published",
        locale: "fr",
        publishedAt: new Date(Date.now() - i * 86400000),
        data: {
          title: `Article ${i} : tendances ${2026 - i}`,
          body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Article ${i}.`,
        },
      });
    }

    // 3 media items (placeholder images, no actual upload)
    for (let i = 1; i <= 3; i++) {
      await db.insert(schema.media).values({
        siteId: site.id,
        filename: `image-${i}.jpg`,
        mimeType: "image/jpeg",
        sizeBytes: 100000 * i,
        r2Key: `${s.slug}/image-${i}.jpg`,
        url: `https://media.myidentity.local/${s.slug}/image-${i}.jpg`,
        width: 1920,
        height: 1080,
        alt: `Image ${i} de ${s.name}`,
      });
    }

    // 1 API key per site
    await db.insert(schema.apiKeys).values({
      userId: siteOwner.id,
      siteId: site.id,
      name: "Default key",
      prefix: `mi_live_${ulid().toLowerCase().slice(0, 12)}`,
      keyHash: hashPassword(ulid()), // secret (would be shown once on create)
      scopes: ["read", "write"],
      lastUsedAt: new Date(),
    });
  }

  // ---- 3. Sessions for owner (12: 6 active, 6 expired) ----
  for (let i = 0; i < 6; i++) {
    await db.insert(schema.sessions).values({
      id: ulid(),
      userId: owner.id,
      ip: `192.168.1.${i + 1}`,
      userAgent: `Mozilla/5.0 (Device-${i})`,
      expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days
    });
  }
  for (let i = 0; i < 6; i++) {
    await db.insert(schema.sessions).values({
      id: ulid(),
      userId: owner.id,
      ip: `10.0.0.${i + 1}`,
      userAgent: `Old device ${i}`,
      expiresAt: new Date(Date.now() - 86400000 * (i + 1)), // expired
    });
  }
  console.log(`  ✓ sessions: 12 (6 active, 6 expired)`);

  // ---- 4. Webhooks ----
  const firstSite = await db.query.sites.findFirst({
    where: (t, { eq }) => eq(t.slug, "aura"),
  });
  if (firstSite) {
    await db.insert(schema.webhooks).values({
      siteId: firstSite.id,
      url: "https://example.com/webhook",
      secret: hashPassword(ulid()),
      events: ["site.published", "form.submitted", "order.created"],
      isActive: true,
    });
    console.log(`  ✓ webhook on aura`);
  }

  // ---- 5. Abuse events (8) ----
  const events = ["rate_limit", "auth_failure", "captcha_fail", "tor_exit", "vpn_exit"];
  for (let i = 0; i < 8; i++) {
    await db.insert(schema.abuse).values({
      kind: events[i % events.length],
      ip: `203.0.113.${i + 1}`,
      path: `/v1/sites/aura/pages/${i % 2 === 0 ? "index" : "about"}`,
      method: i % 3 === 0 ? "POST" : "GET",
      userAgent: `curl/7.${i}`,
      metadata: { reason: "demo-seed", attempt: i },
    });
  }
  console.log(`  ✓ abuse events: 8`);

  // ---- 6. Analytics (50 pageviews for aura) ----
  if (firstSite) {
    for (let i = 0; i < 50; i++) {
      await db.insert(schema.analytics).values({
        siteId: firstSite.id,
        path: i % 3 === 0 ? "/" : i % 3 === 1 ? "/about" : "/contact",
        referrer: i % 2 === 0 ? "https://google.com" : "direct",
        country: ["FR", "BE", "CA", "CH"][i % 4],
        device: i % 2 === 0 ? "mobile" : "desktop",
        ts: new Date(Date.now() - i * 3600000),
      });
    }
    console.log(`  ✓ analytics: 50 events on aura`);
  }

  console.log("\n✨ Seed complete.\n");
  console.log("Demo credentials:");
  console.log("  email:    demo@myidentity.local");
  console.log("  password: demo1234\n");

  await client.end();
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});

// ---- Block builders (return JSON arrays of blocks for the CMS) ----

interface Block {
  type: string;
  data: Record<string, unknown>;
}

function homeBlocks(name: string, template: string): Block[] {
  return [
    { type: "hero", data: { title: name, subtitle: "Construit avec My Identity", align: "center", cta: { label: "En savoir plus", href: "/about" } } },
    { type: "text", data: { html: "<p>Bienvenue sur ce site de démo propulsé par <strong>My Identity</strong>.</p>" } },
    { type: "gallery", data: { images: ["1.jpg", "2.jpg", "3.jpg"], cols: 3 } },
    { type: "cta", data: { title: "Prêt à créer votre site ?", label: "Commencer", href: "/contact" } },
  ];
}

function aboutBlocks(name: string): Block[] {
  return [
    { type: "hero", data: { title: "À propos", subtitle: name } },
    { type: "text", data: { html: "<p>Notre mission : un web souverain, rapide, accessible, sans JavaScript inutile.</p>" } },
  ];
}

function contactBlocks(): Block[] {
  return [
    { type: "hero", data: { title: "Contact", subtitle: "On vous répond sous 24h" } },
    { type: "form", data: { slug: "contact" } },
  ];
}

function portfolioBlocks(): Block[] {
  return [
    { type: "hero", data: { title: "Réalisations", subtitle: "Quelques projets récents" } },
    { type: "gallery", data: { images: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"], cols: 2 } },
  ];
}
