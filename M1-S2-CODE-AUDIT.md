# M1-S2 — Code Audit: divergences schema vs application

> Date initial: 2026-07-11 05:55 WAT
> Mise à jour: 2026-07-11 06:10 WAT
> Status: **6 divergences détectées**, **2 fixées en M1-S2** (D1, D2), **4 ouvertes** pour Phase 1 (D3-D6).

Ce document liste les **bugs réels** détectés en alignant les schémas Drizzle sur le SQL source of truth.

---

## 🔴 Divergences critiques

### D1. `routes/webhooks.ts` — INSERT dans colonnes inexistantes ✅ FIXED

**Bug** : `INSERT INTO webhooks (id, site_id, direction, url, events, enabled, secret, created_at, updated_at)` — `direction`, `enabled`, `updated_at` n'existent pas dans le SQL.

**Fix appliqué (commit inclus)** : retiré `direction`, `enabled`, `updated_at` du code. Le code insère maintenant `id, site_id, url, events, secret, state, created_at`. Le Zod schema (`createWebhookSchema`) conserve `direction` et `enabled` mais marqués `@deprecated` (rétrocompatibilité).

**Diff** :
```ts
// avant
sql`INSERT INTO webhooks (id, site_id, direction, url, events, enabled, secret, created_at, updated_at)
    VALUES (${id}, ${siteId}, ${input.direction}, ${input.url}, ${JSON.stringify(input.events)}, ${input.enabled ? 1 : 0}, ${secret}, ${now}, ${now})`

// après
sql`INSERT INTO webhooks (id, site_id, url, events, secret, state, created_at)
    VALUES (${id}, ${siteId}, ${input.url}, ${JSON.stringify(input.events)}, ${secret}, 'active', ${now})`
```

### D2. `routes/webhooks.ts:226-227` — INSERT dans `webhook_deliveries` avec colonnes inexistantes ✅ FIXED

**Bug** : `INSERT INTO webhook_deliveries (id, webhook_id, event, payload, http_status, duration_ms, error, attempted_at)` — `event`, `http_status`, `error`, `attempted_at` n'existent pas.

**Fix appliqué** : alignement sur les noms SQL. Nouveau code insère `id, webhook_id, event_type, payload, attempt_number, status_code, response_body, duration_ms, state, created_at`.

**Diff** :
```ts
// avant
sql`INSERT INTO webhook_deliveries (id, webhook_id, event, payload, http_status, duration_ms, error, attempted_at)
    VALUES (${ulid()}, ${wh.id}, ${event}, ${body}, ${httpStatus}, ${durationMs}, ${error}, ${now})`

// après
sql`INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, attempt_number, status_code, response_body, duration_ms, state, created_at)
    VALUES (${ulid()}, ${wh.id}, ${eventType}, ${body}, 1, ${httpStatus}, ${error ?? null}, ${durationMs}, ${state}, ${now})`
```

### D3. `middleware/audit.ts:45` — `c.env.AUDIT_LOG` non provisionné 🟡 OPEN

**Bug** : `c.env.AUDIT_LOG.put(...)` plantera avec `Cannot read property 'put' of undefined` car la binding KV n'est pas dans `wrangler.toml`.

**Fix (Phase 1)** : ajouter la binding dans `apps/api/wrangler.toml` :
```toml
[[kv_namespaces]]
binding = "AUDIT_LOG"
id = "<to-fill-after-bootstrap>"
```

Le namespace lui-même est déjà provisionné par `scripts/bootstrap-cloudflare.sh` (KV `my-identity-audit-log`).

### D4. `lib/db.ts` — Analytics Engine non déclaré 🟡 OPEN

**Bug** : le code peut appeler `c.env.ANALYTICS_ENGINE.writeDataPoint(...)` (déduit du nom), mais `ANALYTICS_ENGINE` n'est pas dans `env.d.ts`.

**Fix (Phase 2 — feature pas encore impl)** : déclarer le binding dans `env.d.ts` quand Analytics est implémenté. **Aucun blocage pour M0** car la feature n'est pas active.

---

## 🟡 Divergences mineures (ne cassent rien tout de suite)

### D5. `routes/sites.ts` — `state` vs `is_published` 🟡 OPEN

**Possibilité** : le code applicatif pourrait utiliser `is_published` (boolean) alors que le SQL utilise `state TEXT` ('draft' | 'published' | 'archived').

**Fix (Phase 1)** : auditer chaque route (sites, pages, cms) et remplacer `is_published` par `state` (mapping `'published' | 'draft' | 'archived'`).

### D6. `lib/storage.ts` (R2) — binding `MEDIA_BUCKET` 🟡 OPEN

**Possibilité** : pas de binding R2 nommé dans `env.d.ts`. Soit on utilise un binding nommé, soit on accède via API REST.

**Fix (Phase 1)** : ajouter le binding dans `wrangler.toml` :
```toml
[[r2_buckets]]
binding = "MEDIA"
bucket_name = "my-identity-media"
```

---

## ✅ Tests à exécuter (Phase 1)

```bash
# 1. Appliquer la migration sur une DB locale
docker compose up -d postgres
psql postgresql://myidentity:myidentity_dev@localhost:5432/myidentity_dev \
  -f packages/db/migrations/0001_initial.sql

# 2. Lancer le seed
DATABASE_URL=postgresql://myidentity:myidentity_dev@localhost:5432/myidentity_dev \
  pnpm --filter @my-identity/db seed

# 3. Lancer les tests API (50+ tests)
pnpm --filter @my-identity/api test:unit

# 4. Démarrer l'API
pnpm --filter @my-identity/api dev
# → curl localhost:8787/v1/sites  (sans auth → 401)
# → curl localhost:8787/health  (200)

# 5. Tester le flow webhooks (D1+D2 fixes)
curl -X POST http://localhost:8787/v1/sites/<id>/webhooks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"url":"https://webhook.site/...","events":["site.published"]}'
# → doit retourner 201 avec {id, secret, url, events, state}
# → l'INSERT ne doit PAS planter
```

---

*Mis à jour: 2026-07-11 06:10 WAT — 2 fixes appliqués, 4 à faire en Phase 1.*
