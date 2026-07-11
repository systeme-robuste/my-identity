# My Identity — Checklist M1 : Build & Deploy

> Pour Y. **À faire dans l'ordre**. Coche au fur et à mesure. Lien direct vers le repo : <https://github.com/systeme-robuste/my-identity>

---

## Phase 0 — Setup (1-2h, à faire une seule fois)

### Comptes à créer

| # | Service | URL | Coût | Statut |
|---|---|---|---|---|
| 1 | Cloudflare (org NEXUS) | <https://dash.cloudflare.com/sign-up> | Gratuit (Workers free tier) | ☐ |
| 2 | Neon (Postgres EU) | <https://neon.tech> | Gratuit (0.5 Go) | ☐ |
| 3 | Resend (emails) | <https://resend.com> | Gratuit (3K/mois) | ☐ |
| 4 | Stripe (test mode d'abord) | <https://dashboard.stripe.com/register> | Gratuit | ☐ |
| 5 | Mistral AI | <https://console.mistral.ai> | Gratuit (1M tokens) | ☐ |
| 6 | Sentry | <https://sentry.io/signup> | Gratuit (5K events) | ☐ |
| 7 | Cloudflare Turnstile | <https://dash.cloudflare.com/?to=/:account/turnstile) | Gratuit (illimité) | ☐ |

### Domaines à acheter

| Domaine | Registrar suggéré | Coût/an |
|---|---|---|
| `myidentity.app` | Cloudflare Registrar (pas de marge) | ~12 $ |
| `myidentity.io` | Cloudflare Registrar | ~30 $ |

### Sécurité

| # | Action | Statut |
|---|---|---|
| 1 | Activer 2FA sur GitHub (`systeme-robuste`) | ☐ |
| 2 | Activer 2FA sur Cloudflare | ☐ |
| 3 | Activer 2FA sur Stripe | ☐ |
| 4 | Activer 2FA sur Resend | ☐ |
| 5 | Activer 2FA sur Neon | ☐ |

### Credentials Zapia (à stocker dans le vault)

```
GITHUB_TOKEN          = ghp_...         (actuel)
CLOUDFLARE_API_TOKEN  = ...              (Account.Workers:Edit, D1:Edit, R2:Edit, KV:Edit, Pages:Edit)
CLOUDFLARE_ACCOUNT_ID = ...
NEON_DATABASE_URL     = postgresql://...
RESEND_API_KEY        = re_...
STRIPE_SECRET_KEY     = sk_test_...
STRIPE_WEBHOOK_SECRET = whsec_...
MISTRAL_API_KEY       = ...
SENTRY_DSN            = https://...@...
TURNSTILE_SITE_KEY    = 0x4AAA...
TURNSTILE_SECRET_KEY  = 0x4AAA...
```

---

## Phase 1 — Infrastructure Cloudflare (1h)

Une fois ton compte CF créé et l'API token en main :

```bash
# Local
cd my-identity
chmod +x scripts/bootstrap-cloudflare.sh
CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=yyy ./scripts/bootstrap-cloudflare.sh
```

Le script crée :
- 2 Workers (api + renderer)
- 1 D1 (cache)
- 1 R2 bucket (media)
- 3 KV namespaces (sessions, rate-limit, audit)
- 1 Pages project (dashboard)

**Mets à jour les `wrangler.toml`** avec les vrais IDs reçus.

---

## Phase 2 — Premier build & deploy (2h)

```bash
pnpm install
pnpm --filter @my-identity/api deploy       # api.myidentity.app
pnpm --filter @my-identity/renderer deploy  # renderer.myidentity.app
pnpm --filter @my-identity/dashboard deploy # studio.myidentity.app
pnpm --filter @my-identity/marketing deploy
```

**Custom domains** : ajouter via dashboard CF ou wrangler :
- `api.myidentity.app` → Worker API
- `renderer.myidentity.app` → Worker Renderer
- `*.myidentity.app` → Worker Renderer (wildcard)
- `studio.myidentity.app` → Pages dashboard
- `myidentity.app` → Pages marketing

---

## Phase 3 — Database setup (30 min)

```bash
# Neon
psql $NEON_DATABASE_URL < packages/db/migrations/0001_initial.sql

# Verify
psql $NEON_DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

Devrait retourner 22 tables.

---

## Phase 4 — Secrets deploy (15 min)

```bash
cd apps/api
wrangler secret put DATABASE_URL
wrangler secret put RESEND_API_KEY
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put MISTRAL_API_KEY
wrangler secret put SENTRY_DSN
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put SESSION_SECRET
wrangler secret put COOKIE_SECRET
wrangler secret put JWT_SECRET
```

---

## Phase 5 — Test end-to-end (30 min)

1. Ouvrir `studio.myidentity.app`
2. Créer un compte
3. Créer un site "demo"
4. Ajouter une page "Home" avec un block Hero
5. Publier
6. Visiter `{demo-slug}.myidentity.app`
7. Vérifier : Lighthouse 100/100/100/100, 0 JS, page render en <200ms

---

## Phase 6 — Workflows GitHub Actions (10 min)

Les workflows sont dans `.github/_workflows/` (avec underscore) à cause d'une limitation GitHub Contents API. Pour les activer au bon endroit :

```bash
git clone https://github.com/systeme-robuste/my-identity
cd my-identity
git mv .github/_workflows/ci.yml .github/workflows/ci.yml
git mv .github/_workflows/deploy-api.yml .github/workflows/deploy-api.yml
git mv .github/_workflows/deploy-dashboard.yml .github/workflows/deploy-dashboard.yml
git mv .github/_workflows/deploy-renderer.yml .github/workflows/deploy-renderer.yml
rm -rf .github/_workflows
git commit -m "ci: move workflows to standard path"
git push
```

C'est **une seule commande** locale, 30 secondes.

---

## Estimations

| Phase | Durée | Y | Zapia |
|---|---|---|---|
| 0. Setup comptes | 1-2h | 100% | 0% |
| 1. Infra CF | 1h | 20% (lancer le script) | 80% (script auto) |
| 2. Build & deploy | 2h | 10% (validation) | 90% (build) |
| 3. DB setup | 30 min | 30% (lancer psql) | 70% (préparer) |
| 4. Secrets | 15 min | 50% (saisir valeurs) | 50% (préparer) |
| 5. Test E2E | 30 min | 80% (tester UI) | 20% (fix bugs) |
| 6. Workflows | 10 min | 100% (git local) | 0% |
| **TOTAL** | **5-7h** | ~3-4h | ~2-3h |

**Pour "terminer demain"** (fin de journée 2026-07-11) : faisable si tu crées les comptes ce matin.
**Pour un M1 complet** : viser fin de semaine prochaine.
