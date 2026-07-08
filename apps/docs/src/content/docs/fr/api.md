---
title: Référence API
description: Endpoints REST de l'API My Identity.
---

## Authentification

Toutes les routes sous `/v1/sites/*` et `/v1/me/*` nécessitent un cookie de session (`mi_session`).

Les routes publiques utilisent une clé API dans l'en-tête `Authorization: Bearer mi_live_xxx`.

## Endpoints

### Sites

```
GET    /v1/sites                    Liste les sites de l'utilisateur
POST   /v1/sites                    Crée un nouveau site
GET    /v1/sites/:id                Détails d'un site
PATCH  /v1/sites/:id                Met à jour un site
DELETE /v1/sites/:id                Supprime un site (soft delete)
GET    /v1/sites/:id/usage          Utilisation vs quotas
```

### Pages

```
GET    /v1/sites/:id/pages                    Liste les pages
POST   /v1/sites/:id/pages                    Crée une page
GET    /v1/sites/:id/pages/:pid               Détails d'une page
PATCH  /v1/sites/:id/pages/:pid               Met à jour (autosave)
DELETE /v1/sites/:id/pages/:pid               Supprime
POST   /v1/sites/:id/pages/reorder            Réordonne
```

### CMS

```
GET    /v1/sites/:id/collections                          Liste les collections
POST   /v1/sites/:id/collections                          Crée une collection
GET    /v1/sites/:id/collections/:cid/entries             Liste les entrées
POST   /v1/sites/:id/collections/:cid/entries             Crée une entrée
GET    /v1/sites/:id/collections/:cid/entries/:eid        Détails
PATCH  /v1/sites/:id/collections/:cid/entries/:eid        Met à jour
DELETE /v1/sites/:id/collections/:cid/entries/:eid        Supprime
```

### API publique (end-users)

```
GET    /v1/api/sites/:slug                       Infos du site
GET    /v1/api/sites/:slug/pages/:pageSlug       Page rendue
GET    /v1/api/sites/:slug/cms/:collectionSlug   Entrées publiées
```

## Codes d'erreur

| Code | Signification |
|------|---------------|
| 400 | Validation échouée (Zod) |
| 401 | Non authentifié |
| 403 | Rôle insuffisant |
| 404 | Ressource introuvable |
| 409 | Conflit (slug déjà pris) |
| 429 | Rate limit dépassé |
| 500 | Erreur serveur |
