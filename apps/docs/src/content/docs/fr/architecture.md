---
title: Architecture
description: Vue d'ensemble de l'architecture technique.
---

## Composants principaux

```
                         ┌─────────────────┐
                         │   Cloudflare    │
   Visiteur ────────────►│   Edge Network  │
                         │   (Workers)     │
                         └────────┬────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
            ┌──────────┐   ┌──────────┐   ┌──────────┐
            │ Renderer │   │   API    │   │  Static  │
            │  Worker  │   │  Worker  │   │  Pages   │
            └─────┬────┘   └─────┬────┘   └──────────┘
                  │              │
                  └──────┬───────┘
                         ▼
                  ┌──────────────┐
                  │     Neon     │
                  │   Postgres   │
                  └──────┬───────┘
                         │
                  ┌──────┴───────┐
                  ▼              ▼
            ┌──────────┐   ┌──────────┐
            │  Stripe  │   │  Resend  │
            └──────────┘   └──────────┘
```

## Apps

- **`@my-identity/api`** — Hono sur Cloudflare Workers. Endpoints REST versionnés (`/v1/*`).
- **`@my-identity/renderer`** — Worker de rendu edge. Sert les sites publiés avec cache KV + D1.
- **`@my-identity/dashboard`** — SPA React pour le studio éditeur.
- **`@my-identity/marketing`** — Site marketing (myidentity.app).
- **`@my-identity/docs`** — Documentation (docs.myidentity.app).

## Packages

- **`@my-identity/shared`** — Types et schémas Zod partagés.
- **`@my-identity/db`** — Schémas Drizzle ORM + client Neon.
- **`@my-identity/ui`** — Composants React partagés.
- **`@my-identity/config`** — Configs partagées (eslint, prettier, tsconfig, tailwind).

## Stockage

| Type | Service | Usage |
|------|---------|-------|
| Base de données | Neon Postgres | Utilisateurs, sites, pages, CMS, commandes |
| Cache edge | Cloudflare KV | Pages rendues, sessions |
| Cache index | Cloudflare D1 | Métadonnées de cache pour SWR |
| Assets | Cloudflare R2 | Images, vidéos, médias uploadés |
| Email | Resend | Transactionnel + broadcasts |
| Paiements | Stripe | Checkout, abonnements, portail client |
| IA | Mistral | Génération de contenu, workflows |
