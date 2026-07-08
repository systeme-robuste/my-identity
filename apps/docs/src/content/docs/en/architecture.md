---
title: Architecture
description: Overview of the technical architecture.
---

## Main components

```
                         ┌─────────────────┐
                         │   Cloudflare    │
   Visitor ────────────►│   Edge Network  │
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

See the full architecture doc in [`/docs/architecture.md`](https://github.com/systeme-robuste/my-identity/blob/main/docs/architecture.md).
