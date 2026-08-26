# MedBaza

Tibbiy mahsulotlar va uskunalar uchun ko'p sotuvchili bozor — a multi-vendor marketplace for
medical supplies. The interface is Uzbek; the codebase, comments, and error codes are English.

This repository is the storefront. The API lives in its own repository,
[`medbaza-api`](../medbaza-api), and the two share nothing but the OpenAPI contract.

| Where | What it is |
|---|---|
| `apps/web` (here) | Next.js App Router. Server Components by default, typed client generated from the API. |
| `medbaza-api` | FastAPI + SQLAlchemy 2.0 async + Postgres. Runs its own Docker stack. |

Working rules for this repository live in [CLAUDE.md](./CLAUDE.md) — read that before changing
anything. This file only covers getting it running.

## Prerequisites

- Node 20+ and npm 10
- The API running — see [`medbaza-api`](../medbaza-api). Nothing here renders without it.

## Run it

```bash
# 1. The API and its datastores, from the other repository
cd ../medbaza-api && docker compose up -d      # api, worker, Postgres, Redis

# 2. This app
cd ../MedBaza
cp apps/web/.env.example apps/web/.env.local   # NEXT_PUBLIC_API_URL points at the API
npm install
npm run dev                                    # http://localhost:3000
```

### Dev sign-ins

Created by the API's seed script. Password for all of them: `MedBaza-dev-2026`.

| Email | Surface |
|---|---|
| `buyer@medbaza.example` | Storefront and account |
| `seller1@medbaza.example` | Seller dashboard (verified) |
| `seller4@medbaza.example` | Seller dashboard (pending verification) |
| `admin@medbaza.example` | Admin panel |

## Checks

```bash
npm run typecheck && npm run lint && npm test

# End to end, with this app and the API both running
npm run test:e2e
```

The API's own checks live in its repository.

## Regenerating the API client

The frontend never hand-writes a type for an API payload. After changing any router schema:

```bash
npm run generate:api   # pulls /openapi.json from a running API, regenerates schema.d.ts
```

Commit the generated diff. The API now lives in a separate history, so its schema change and this
regenerated client cannot share a commit — do them in the same sitting, or the contract drifts.

## Publishing a catalog change

Category and product pages are cached with ISR, so a seed or an import is not visible until the
window closes. Bust the tag instead:

```bash
curl -X POST localhost:3000/api/revalidate \
     -H "x-revalidate-secret: $REVALIDATE_SECRET" \
     -H 'content-type: application/json' -d '{"tag":"catalog"}'
```

Tags: `catalog`, `categories`, `products`, `product:<slug>`.

## What is deliberately not decided

The payment provider. Everything is written against the `PaymentProvider` port in the API's
`app/services/payments/base.py`, and `FakePaymentProvider` is the only implementation
that exists — it models delayed capture, duplicate webhooks, partial refunds, and payouts on hold
so the awkward paths are exercised without a real PSP. See §4 of CLAUDE.md before wiring one up.
