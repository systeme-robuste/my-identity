# @my-identity/shared

> Shared types, Zod schemas, constants, utilities, and i18n tables. Imported by every app and the dashboard.

## Layout

```
src/
├── index.ts          # barrel
├── types/            # Public type definitions
├── schemas/          # Zod schemas derived from DB types
├── constants/        # Plans, limits, event names, locales
├── utils/            # slug, sanitize, format, validate, crypto, id
└── i18n/             # fr, en, es string tables
```

## Usage

```ts
import { slugify, translate, signupSchema, PLANS, SUPPORTED_LOCALES } from "@my-identity/shared";
```

## Conventions

- This package must remain **free of runtime side effects** and **tree-shakable**.
- New additions must be re-exported from `src/index.ts`.
- No dependencies on other workspace packages.
- No imports of environment-specific APIs (Node, Workers, DOM). The package must be usable everywhere.
