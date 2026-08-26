# MedBaza

Tibbiy mahsulotlar va uskunalar uchun ko'p sotuvchili bozor — a multi-vendor marketplace for
medical supplies. The interface is Uzbek; the codebase, comments, and error codes are English.

Two deployable apps in one repo, sharing nothing at runtime except the OpenAPI contract:

| Path | What it is |
|---|---|
| `apps/api` | FastAPI + SQLAlchemy 2.0 async + Postgres. Business logic in `services/`, thin routers. |
| `apps/web` | Next.js App Router. Server Components by default, typed client generated from the API. |

Working rules for this repository live in [CLAUDE.md](./CLAUDE.md) — read that before changing
anything. This file only covers getting it running.

## Prerequisites

- Docker (Postgres and Redis)
- Python 3.12+
- Node 20+ and npm 10

## Run it

```bash
# 1. Datastores
docker compose up -d db redis

# 2. API
cd apps/api
cp .env.example .env                       # then fill in the blanks
python -m venv .venv && .venv/bin/pip install -e ".[dev]"
.venv/bin/alembic upgrade head
.venv/bin/python -m app.scripts.seed       # categories, sellers, catalog, dev accounts
.venv/bin/uvicorn app.main:app --reload    # http://localhost:8000/docs

# 3. Worker (optional; outbox dispatch and transactional email)
.venv/bin/arq app.workers.settings.WorkerSettings

# 4. Web
cd ../web
cp .env.example .env.local
npm install
npm run dev                                   # http://localhost:3000
```

### Dev sign-ins

Created by the seed script. Password for all of them: `MedBaza-dev-2026`.

| Email | Surface |
|---|---|
| `buyer@medbaza.example` | Storefront and account |
| `seller1@medbaza.example` | Seller dashboard (verified) |
| `seller4@medbaza.example` | Seller dashboard (pending verification) |
| `admin@medbaza.example` | Admin panel |

## Checks

```bash
# API — from apps/api
.venv/bin/python -m pytest                      # unit + integration (needs the Postgres container)
.venv/bin/ruff check . && .venv/bin/black --check . && .venv/bin/mypy app

# Web — from apps/web
npm run typecheck && npm run lint && npm test

# End to end — from the repo root, with web + api running
npm run test:e2e
```

Integration tests create and drop their own `medsupply_test` database on the same Postgres
container. Override with `TEST_DATABASE_URL` if you keep it elsewhere.

## Regenerating the API client

The frontend never hand-writes a type for an API payload. After changing any router schema:

```bash
cd apps/web && npm run generate:api   # pulls /openapi.json from a running API, regenerates schema.d.ts
```

Commit the generated diff in the same change.

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

The payment provider. Everything is written against the `PaymentProvider` port in
`apps/api/app/services/payments/base.py`, and `FakePaymentProvider` is the only implementation
that exists — it models delayed capture, duplicate webhooks, partial refunds, and payouts on hold
so the awkward paths are exercised without a real PSP. See §4 of CLAUDE.md before wiring one up.
