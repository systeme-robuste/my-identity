# Guide de fix workflows — 1 minute, 3 options

> **Pour** : Y (CMS NEXUS)
> **Objectif** : déplacer `.github/_workflows/*` vers `.github/workflows/*` pour activer GitHub Actions
> **Date** : 2026-07-11 15:26 WAT
> **Pré-requis** : compte GitHub `systeme-robuste`, droits de push sur le repo `my-identity`

---

## Pourquoi ce fix est nécessaire

Les 4 workflows (`ci.yml`, `deploy-api.yml`, `deploy-renderer.yml`, `deploy-dashboard.yml`) sont actuellement dans `.github/_workflows/` mais GitHub Actions ne détecte que les workflows placés dans `.github/workflows/`. Sans ce fix, **la CI/CD ne tournera jamais** et le déploiement de Phase 1 échouera.

## Pourquoi Zapia ne peut pas le faire

La REST API GitHub (et l'API Git Data) **refusent de créer de nouveaux sous-dossiers** dans un repo (cf. Règles 2026-07-11, confirmée par test : `PUT .github/workflows/.gitkeep` → HTTP 404 "Not Found"). Seules 3 méthodes fonctionnent pour créer le dossier `workflows/` :

---

## Option A — UI GitHub Web (1 min, **recommandé**)

1. Ouvre https://github.com/systeme-robuste/my-identity/tree/main/.github/_workflows
2. Pour chaque fichier (4 + 1 README), procède ainsi :
   - Clique sur le nom du fichier
   - Clique sur l'icône **crayon** (Edit this file) en haut à droite
   - Renomme `_workflows/<nom>` → `workflows/<nom>` (GitHub crée automatiquement le dossier destination)
   - En bas de la page, message de commit : `fix: move workflow from _workflows to workflows`
   - "Commit changes"
3. Une fois les 5 fichiers déplacés, vérifie : https://github.com/systeme-robuste/my-identity/tree/main/.github/workflows — les 4 yml doivent être là
4. Va sur https://github.com/systeme-robuste/my-identity/actions — la CI doit apparaître

## Option B — git CLI local (si tu clones le repo)

```bash
# 1. Clone le repo
git clone https://github.com/systeme-robuste/my-identity.git
cd my-identity

# 2. Crée le nouveau dossier + déplace les fichiers
mkdir -p .github/workflows
git mv .github/_workflows/README.md .github/workflows/README.md
git mv .github/_workflows/ci.yml .github/workflows/ci.yml
git mv .github/_workflows/deploy-api.yml .github/workflows/deploy-api.yml
git mv .github/_workflows/deploy-dashboard.yml .github/workflows/deploy-dashboard.yml
git mv .github/_workflows/deploy-renderer.yml .github/workflows/deploy-renderer.yml
rmdir .github/_workflows

# 3. Commit + push
git commit -m "fix: move workflows from .github/_workflows to .github/workflows (enable CI)"
git push origin main
```

## Option C — Merge d'une PR contenant les fichiers (alternative)

Zapia peut préparer une branche avec les 4 fichiers `deploy-*.yml` + `ci.yml` au bon endroit (`.github/workflows/`). Mais ça demande quand même la création du dossier via merge.

---

## Vérification post-fix

Une fois le fix appliqué, vérifie :

```bash
# Les 4 workflows doivent être listés
curl -H "Authorization: Bearer <github_token>" \
  "https://api.github.com/repos/systeme-robuste/my-identity/contents/.github/workflows"
```

Tu dois voir 4 fichiers : `ci.yml`, `deploy-api.yml`, `deploy-dashboard.yml`, `deploy-renderer.yml`.

Puis va sur https://github.com/systeme-robuste/my-identity/actions → tu dois voir le workflow "CI" déclenché automatiquement sur le push du fix.

---

## Une fois le fix fait

Zapia pourra prendre le relais pour la Phase 1 dès que :

1. ✅ Ce fix est appliqué (workflows détectés par GH Actions)
2. ✅ Les 8 secrets sont fournis via le formulaire credentials
3. ✅ Le domaine `myidentity.app` est acheté
4. ✅ Le KYC Stripe est validé

ETA activation Phase 1 : **< 1h**.

---

_Document rédigé par Zapia (CAO NEXUS), 2026-07-11 15:26 WAT_
