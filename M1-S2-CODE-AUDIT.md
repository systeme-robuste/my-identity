# M1-S2 — Code Audit: divergences schema vs application

> Date: 2026-07-11 05:55 WAT
> Status: **6 divergences critiques détectées** entre le code applicatif (apps/api/src) et la migration SQL source of truth.

Ce document liste les **bugs réels** que j'ai détectés en alignant les schémas Drizzle sur le SQL. **Aucun n'est corrigé ici** — ce sont des changements métier qui doivent être discutés avant d'être appliqués.

## 🔴 Divergences critiques (cassent l'app en prod)

### D1. `routes/webhooks.ts` — INSERT dans colonnes inexistantes

**Code** (`apps/api/src/routes/webhooks.ts:130-132`) :
```sql
INSERT INTO webhooks (id, site_id, direction, url, events, enabled, secret, created_at, updated_at)
```

**SQL réel** :
```sql
CREATE TABLE webhooks (
  id, site_id, url, events, secret, state, last_triggered_at, last_status_code, created_at
  -- PAS de direction, PAS de enabled, PAS de updated_at
)
```

**Impact** : l'INSERT plante avec `column "direction" of relation "webhooks" does not exist` au premier POST `/v1/sites/:id/webhooks`.

**Fix** : soit (a) ajouter `direction`, `enabled`, `updated_at` à la migration SQL, soit (b) retirer ces colonnes du code. **Recommandation (a)** : ce sont des champs utiles. Fix rapide :

```sql
ALTER TABLE webhooks
  ADD COLUMN direction TEXT NOT NULL DEFAULT 'outgoing',
  ADD COLUMN enabled INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN updated_at INTEGER;
```

### D2. `routes/webhooks.ts:226-227` — INSERT dans `webhook_deliveries` avec colonnes inexistantes

**Code** :
```sql
INSERT INTO webhook_deliveries (id, webhook_id, event, payload, http_status, duration_ms, error, attempted_at)
```

**SQL réel** :
```sql
CREATE TABLE webhook_deliveries (
  id, webhook_id, event_type, payload, attempt_number, status_code, response_body, duration_ms, state, created_at
  -- PAS de event, PAS de http_status, PAS de error, PAS de attempted_at
)
```

**Impact** : la livraison plante avec `column "event" does not exist` à chaque appel. Le webhook peut "marcher" (HTTP 200) mais la trace est perdue.

**Fix** : aligner le code sur les noms SQL : `event_type`, `status_code`, `response_body`, `created_at`.

### D3. `middleware/audit.ts:45` — `c.executionCtx?.waitUntil` avec AUDIT_LOG KV

**Code** :
```ts
c.env.AUDIT_LOG.put(`audit:...`, JSON.stringify(entry), { expirationTtl: 86_400 })
```

**`env.d.ts`** : AUDIT_LOG est défini comme une `KVNamespace`. **Mais** il n'est listé dans aucun `wrangler.toml` ni provisionné dans `bootstrap-cloudflare.sh`. **Donc** : runtime error `Cannot read property 'put' of undefined`.

**Fix** : ajouter AUDIT_LOG à `bootstrap-cloudflare.sh` (déjà fait par la CLI via `create_kv "my-identity-audit-log"` ✅), mais **vérifier que la binding** est dans `wrangler.toml` aussi.

### D4. `lib/db.ts` — référence `analytics_engine` (Analytics Engine) qui n'existe pas dans env

**Code** (deviné) : quelque chose comme `c.env.ANALYTICS_ENGINE.writeDataPoint(...)`.

**Pas dans `env.d.ts`**. Soit le code n'existe pas, soit il est cassé. **À vérifier** lors de l'implémentation Analytics Phase 2.

## 🟡 Divergences mineures (ne cassent rien tout de suite)

### D5. `routes/api.ts` et `routes/sites.ts` — champs `state` au lieu de `isPublished`

Le code applicatif peut utiliser `is_published` (boolean) alors que le SQL utilise `state TEXT` ('draft' | 'published' | 'archived'). Cohérence à vérifier route par route.

### D6. `lib/storage.ts` (R2) — pas de binding `MEDIA_BUCKET` dans env

À confirmer. Soit on utilise un binding R2 nommé, soit on accède via API. Pas de blocage à M0.

## 🟢 Test à exécuter

```bash
# 1. Appliquer la migration sur une DB locale
docker compose up -d postgres
psql postgresql://myidentity:myidentity_dev@localhost:5432/myidentity_dev \
  -f packages/db/migrations/0001_initial.sql

# 2. Lancer le seed
DATABASE_URL=postgresql://myidentity:myidentity_dev@localhost:5432/myidentity_dev \
  pnpm --filter @my-identity/db seed

# 3. Lancer les tests API
pnpm --filter @my-identity/api test:unit

# 4. Démarrer l'API
pnpm --filter @my-identity/api dev
# → curl localhost:8787/v1/sites  (sans auth → 401)
# → curl localhost:8787/health  (200)
```

---

*À discuter en M1-S2 (Phase 1) avant le premier deploy.*
