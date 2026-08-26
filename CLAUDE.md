# CLAUDE.md

Operating manual for Claude Code (and any dev) in this repository — a multi-vendor online marketplace for medical supplies and equipment.

**How to read this file.** Sections marked **Rules** are normative: follow them literally. If a rule blocks the task, stop and ask — do not work around it. Everything else is context to help you make good choices where no rule applies.

---

## 0. Non-negotiables

Violating any of these fails review, regardless of what else the PR does well.

1. **Money is integer minor units** (`int`, e.g. cents) plus an ISO-4217 `currency` column. Never `float`. Never `Decimal` on the wire.
2. **Never return a SQLAlchemy model from a route.** Routes return Pydantic response schemas only.
3. **Business logic lives in `services/`.** Routers parse, authorize, delegate, and shape HTTP. No queries, no rules, no `session.commit()` in a router.
4. **No payment-provider SDK outside `app/services/payments/adapters/`.** No provider type may appear in a model, schema, service signature, or router. See §4.
5. **Every stock mutation happens inside the row lock described in §5.3.** No read-then-write on `Product.stock` without it.
6. **No PHI or PII in logs, error messages, traces, or Sentry.** Prescriptions, health conditions, addresses, full names, emails: never logged. Log IDs.
7. **Model change ⇒ Alembic migration in the same PR.** Router schema change ⇒ `npm run generate:api` re-run in the same PR.
8. **Every `services/` change ships with a test.** No exceptions for "trivial" changes.
9. **No gradients, and exactly one shadow: `shadow-card`.** See §9 — enforced by lint and by the Tailwind theme, which defines no other shadow.
10. **Secrets come from the environment.** Nothing resembling a key, token, or DB password is ever committed, not even in a test fixture or example.
11. **User-facing copy is Uzbek (Latin script).** Interface strings, seeded catalog copy, and the `message` field of every API error are written in Uzbek. Error `code` values, identifiers, log lines, comments, and commit messages stay English — `code` is the public contract and renaming one is a breaking change (§3.4).

---

## 1. Product surfaces

| Surface | Route group | Audience |
|---|---|---|
| Storefront | `apps/web/app/(storefront)` | Public + buyers — browse, search, cart, checkout, prescription upload |
| Account | `apps/web/app/(account)` | Authenticated buyers — orders, returns, addresses, prescriptions |
| Seller dashboard | `apps/web/app/(seller)` | Verified sellers — listings, inventory, orders, payouts |
| Admin panel | `apps/web/app/(admin)` | Staff — seller approval, compliance review, order oversight, users |

Buyers are individuals, clinics, and small healthcare providers. Catalog: medical wear (scrubs, lab coats), headwear, medical footwear, PPE (masks, gloves), and first-aid kits.

---

## 2. Tech stack

All rows below are **settled**. Do not substitute, add an alternative, or introduce a second library for the same job without asking.

| Layer | Choice | Constraint it imposes |
|---|---|---|
| Backend | Python 3.12+, FastAPI | Async everywhere; no sync I/O in a request path |
| ORM | SQLAlchemy 2.0 async + Alembic | `Mapped[]` / `mapped_column()` style only — no legacy `Column()` declarations |
| Database | PostgreSQL 16 (Docker locally, managed in prod) | Postgres-specific features (JSONB, FTS, `FOR UPDATE`, partial indexes) are fair game |
| Validation | Pydantic v2 | Every request and response body is a schema; schemas drive the OpenAPI spec |
| Auth | Thin custom JWT layer in `app/auth` (access + refresh), roles `buyer \| seller \| admin` | No auth framework dependency; see §3.5 |
| Background jobs | `arq` + Redis | Chosen over Celery for a smaller surface. Job rules in §3.6 |
| Frontend | Next.js 14+ App Router, TypeScript strict | Server Components by default; see §3.8 |
| API contract | REST, typed client generated from OpenAPI via `openapi-typescript` | Frontend never hand-writes a type for an API payload |
| Styling | Tailwind CSS | Tokens only; see §9 |
| UI primitives | shadcn/ui (Radix), restyled | Shadows stripped at the point of vendoring, not overridden later |
| Client data | TanStack Query | Only inside Client Components; Server Components fetch directly |
| Object storage | S3-compatible (Cloudflare R2 or S3) via `boto3` | Two buckets, never one: documents private (presigned, short-lived), catalog images public — see §5.7 |
| Search | Postgres full-text search | Revisit (Meilisearch/Typesense) only when p95 search latency exceeds 300 ms |
| Email | Resend or Postmark, from the backend | Always enqueued as a job, never sent inline |
| Backend tests | pytest, pytest-asyncio, httpx | See §11 |
| Frontend tests | Vitest, Playwright | See §11 |
| Backend lint | Ruff + Black + mypy (strict on `app/services`, `app/models`) | CI-blocking |
| Frontend lint | ESLint + Prettier + `tsc --noEmit` | CI-blocking |
| Deploy | API: containerized (Fly.io / Render / ECS) · Web: Vercel · DB: managed Postgres | The dev Dockerfile is the prod Dockerfile |
| Monitoring | Sentry (both apps), structured JSON logs | See §12.4 |

---

## 3. Architecture principles

- **Two deployable apps, one repo.** `apps/api` and `apps/web` share nothing at runtime — only the OpenAPI contract.
- **Feature-first inside each app.** Group by domain (`products`, `orders`, `sellers`, `cart`), not by technical type alone. The frontend mirrors the backend's domain names exactly.
- **Thin routers, fat services.** HTTP concerns stop at the router boundary.
- **The database is the source of truth for invariants.** Anything that must never be violated (non-negative stock, unique SKU per seller, one review per buyer per product) gets a constraint, not just a service check.
- **Provider-agnostic core.** Payments, storage, email, and search are reached through interfaces in `app/services/*`; concrete SDKs live in `adapters/` subpackages.
- **Schema-driven contract.** Pydantic → OpenAPI → generated TS client. Never a duplicated hand-written type.
- **One source of truth for design tokens.** `tailwind.config.ts`. Never a hardcoded hex, radius, or spacing value in a component.

### 3.1 Layering and allowed imports (backend)

```
api/ (routers)  ──▶  services/  ──▶  models/ + db/
     │                   │
     └──▶ schemas/ ◀─────┘        core/ and auth/ may be imported by anyone
```

**Rules**

- `api/` may import: `schemas/`, `services/`, `auth/`, `core/`. It **may not** import `models/` except for type-only annotations in a dependency.
- `services/` may import: `models/`, `schemas/`, `db/`, `core/`, other services. It **may not** import `api/` or `fastapi` at all — services raise domain errors (§3.4), never HTTP errors.
- `models/` imports nothing from the layers above it.
- A service must not import a sibling service's *private* helpers (`_`-prefixed). Cross-domain calls go through the sibling's public functions.
- Circular service imports are a design smell: extract the shared logic into a third service or into `core/`.

### 3.2 Anatomy of a domain module

Adding a domain named `x` means adding **all** of these, in the same PR:

```
app/api/x.py              # router:  APIRouter(prefix="/x", tags=["x"])
app/services/x_service.py # logic:   verbNoun functions taking (session, actor, ...)
app/schemas/x.py          # XCreate, XUpdate, XRead, XListItem
app/models/x.py           # SQLAlchemy models
alembic/versions/*.py     # migration
tests/unit/test_x_service.py
tests/integration/test_x_api.py
```

Then register the router in `app/main.py` and re-run `npm run generate:api`.

### 3.3 Transactions and the unit of work

**Rules**

- One request = one database transaction. The session dependency opens it; the router-level dependency commits on success and rolls back on any raised exception.
- **Services never call `commit()`.** They may `flush()` when they need a generated ID.
- A service function is either fully atomic on its own or explicitly documented as "must be called inside an existing transaction" in its docstring.
- Anything that must happen only if the transaction succeeds — emails, webhooks out, payment capture side effects, search reindex — is **enqueued after commit**, never inside the transaction. Use the outbox pattern in §3.6.
- Never hold a database transaction open across an outbound HTTP call.

### 3.4 Errors

**Rules**

- Services raise subclasses of `AppError` from `app/core/errors.py`. They never raise `HTTPException`.
- `AppError` carries: `code` (stable `SCREAMING_SNAKE` string), `message` (safe to show a user), `status` (HTTP), optional `details` (dict, never PHI).
- A single exception handler in `app/main.py` maps `AppError` → JSON response. Add new error types there, not ad hoc in routers.
- Error response body is fixed and must not vary by endpoint:

```json
{ "error": { "code": "INSUFFICIENT_STOCK", "message": "…", "details": {"product_id": "…"}, "request_id": "…" } }
```

- Validation failures (Pydantic) map to `422` with `code: "VALIDATION_ERROR"` and a `details.fields` map.
- Never leak an ORM/driver exception message to the client. Catch, log with the request ID, return a generic `500` / `INTERNAL_ERROR`.
- Codes are part of the public contract. Renaming one is a breaking change and needs a frontend update in the same PR.

### 3.5 Authorization

**Rules**

- Two distinct checks, both required, in this order:
  1. **Role gate** — a router dependency (`require_role("seller")`) rejects the wrong role with `403`.
  2. **Ownership/scope check** — performed *in the service*, because only the service knows the object graph. A seller may only touch rows whose `seller_id` matches their own; a buyer only their own orders and prescriptions.
- Never trust a `seller_id`, `user_id`, or `role` supplied in a request body or query string. It comes from the verified token, full stop.
- Every list endpoint that returns per-owner data applies the ownership filter in the query, not after fetching.
- A missing resource the actor is not allowed to see returns `404`, not `403` — do not leak existence.
- Admin actions that change money, seller status, or compliance state are written to the audit log (§12.3).

### 3.6 Background jobs

**Rules**

- Jobs live in `app/workers/tasks/`, one module per domain. A job function is a thin wrapper that calls a service — no business logic in the worker.
- Job arguments are **IDs and primitives only**. Never an ORM object, never a Pydantic model with nested data. The job re-reads current state.
- Every job is **idempotent**: running it twice must be harmless. Delivery is at-least-once.
- Enqueue only after commit. Use the transactional outbox: services insert an `OutboxEvent` row in the same transaction; a poller enqueues from it and marks it dispatched.
- Every job declares a retry policy and a max attempt count. Exhausted jobs land in a dead-letter table and alert — they are never silently dropped.
- Long or unbounded work (report generation, bulk imports, image processing) is always a job, never a request handler.

### 3.7 The payment boundary

The provider is **not chosen** (§4). The boundary is.

- `app/services/payments/base.py` defines the abstract port. Everything else in the app depends on this and nothing else:

```python
class PaymentProvider(Protocol):
    async def create_checkout_session(self, order: OrderPaymentIntent) -> CheckoutSession: ...
    async def parse_webhook(self, raw_body: bytes, headers: Mapping[str, str]) -> PaymentEvent: ...
    async def refund(self, payment_ref: str, amount_minor: int, reason: str) -> RefundResult: ...
    async def onboard_seller(self, seller_id: UUID) -> SellerOnboardingLink: ...
    async def get_seller_payout_status(self, seller_id: UUID) -> PayoutStatus: ...
```

- `OrderPaymentIntent`, `CheckoutSession`, `PaymentEvent`, `RefundResult`, `PayoutStatus` are **our** dataclasses in `payments/types.py`. No provider types cross this line.
- Concrete implementations go in `payments/adapters/<provider>.py`. A `FakePaymentProvider` in the same directory backs all tests and local dev; it is the only implementation that exists until §4 is decided.
- The provider is selected by `PAYMENT_PROVIDER` env var and resolved in one factory function.
- Models store `payment_ref: str` and `payout_account_ref: str` — opaque strings, no provider semantics, no foreign-key-like assumptions about their format.

### 3.8 Frontend architecture

**Rules**

- **Server Components by default.** A file gets `"use client"` only if it uses state, effects, event handlers, or browser APIs. Push the boundary as deep as possible — a page is a Server Component that renders small client leaves.
- Server Components fetch through the generated client directly. Client Components fetch through TanStack Query. Never `fetch()` an API route by hand outside `lib/api-client/`.
- `features/<domain>/` holds the domain's hooks, client-side logic, and composed components. `components/domain/` holds shared cross-feature compositions. `components/ui/` holds restyled primitives and contains no business logic.
- Data flows down as props. React Context is permitted for exactly three things: auth/session, cart, and saved items. Anything else needs a reason in the PR description.
- **Saved items** are client-only: a list of product slugs in `localStorage`, resolved against the public product endpoint so price and stock are always live. There is no wishlist resource on the API. The `localStorage` ban in this section is about the access token — non-sensitive UI state is fine there, but nothing identifying a person or a purchase goes in it.
- A **guest cart** is identified by an opaque token the API mints and returns in the `X-Cart-Token` response header. The browser keeps it in a readable (non-httpOnly) cookie and sends it back on every cart call; signing in merges it into the account's cart. It is a basket id, not a credential.
- Active-nav marking lives in one Client Component leaf, `components/domain/nav-links.tsx`, which reads `usePathname()`. It is the only client part of a dashboard shell — the header, the account menu, and the page stay server-rendered. Do not read the path on the server for this: a layout is **not** re-rendered when the router moves between its child pages, so a path captured during the first render sticks and the highlight trails one navigation behind. (This replaces an earlier `x-pathname` header set by `middleware.ts`, which was removed for exactly that reason.)
- A rail whose first item is the section index (`/seller`, `/account`, `/admin`) must mark the **most specific** match only. That href prefixes every sibling, so a plain `startsWith` lights two rows at once on any nested page.
- Product and category pages use ISR with tag-based revalidation; cart, checkout, and every dashboard route are dynamic and never cached.
- Tags are declared in `CACHE_TAGS` (`lib/api-client/endpoints.ts`) and busted through `POST /api/revalidate`, guarded by `REVALIDATE_SECRET`. **Every catalog mutation must bust them**: `catalog_service` emits a `PRODUCT_REINDEX` outbox event, and the `revalidate_storefront` job calls that endpoint after the transaction commits (§3.6). A mutation that skips this leaves the seller staring at their own change not appearing, which reads as a lost save, not as a cache. A time window on its own is not a cache strategy — without a tag there is no way to publish a catalog change before the window closes, and a stale page looks exactly like a bug.
- An endpoint helper may supply a caching *default*, never an override. Caller options win; spreading `next` after `...options` silently ignores what the caller asked for and collides with `cache: 'no-store'`.
- Cart mutations are optimistic and reconciled against the server response; the server is authoritative on price and stock, always.
- The access token never touches `localStorage`. Refresh tokens are httpOnly cookies.
- Every mutation path has a visible loading and error state. No silent failures.

---

## 4. Open decisions — do not guess

### 4.1 Payment provider — OPEN

**Status: undecided, and intentionally so.** It depends on the launch market's payout countries and currencies, which are not fixed yet. Do not pick one, do not add an SDK, do not "temporarily" wire up a real provider.

Must satisfy, when chosen:

- Marketplace split payments / per-seller payouts (not a single merchant account)
- Full and partial refunds (returns are common in this category)
- PCI scope kept off us — hosted checkout or hosted fields; we never see a card number
- Coverage of the target market's currencies and seller payout countries
- Signed webhooks for payment succeeded / failed / refunded / payout state
- A sandbox usable in CI

Candidates to evaluate: Stripe Connect, Adyen for Platforms, PayPal Commerce Platform, or a regional PSP if selling primarily outside the US/EU.

**How to build while it is open**

- Program against the `PaymentProvider` port in §3.7 and nothing else.
- `FakePaymentProvider` is the implementation for dev, tests, and CI. It must model the awkward cases, not just the happy path: delayed capture, webhook arriving before the checkout response, duplicate webhook, partial refund, payout on hold.
- The webhook endpoint `POST /api/v1/payments/webhook` exists now and delegates signature verification to the adapter.
- Anything you cannot build without knowing the provider, write down here rather than inventing an answer.

**Deferred sub-questions:** payout schedule and who holds funds in transit; whether refunds claw back from seller balance or platform balance; how disputes/chargebacks map onto `Order` state; whether seller onboarding is hosted or embedded; how platform fees are represented per `OrderItem`.

### 4.2 Answering the "which provider" question later

When the decision is made: implement one adapter, delete nothing else, flip `PAYMENT_PROVIDER`, and update this section with the choice and the reason. If a provider requirement contradicts a rule in this file, change this file in the same PR — do not let the code and the doc diverge.

---

## 5. Domain rules

### 5.1 Money

- Stored and transported as `amount_minor: int` + `currency: str` (ISO-4217, uppercase). Never a float, never a bare number without currency.
- **The catalog trades in Uzbek so'm (`UZS`).** `DEFAULT_CURRENCY` in `app/core/money.py` and `SITE_CURRENCY` in `lib/utils/money.ts` are the only two places that name it.
- **"Minor unit" is per currency, not always a hundredth.** So'm has no subdivision, so `amount_minor` on a UZS row *is* the so'm figure. Nothing multiplies or divides by a literal `100` — `minor_unit_exponent()` on the API and `toMinor()` / `fromMinor()` on the web do the conversion. A hardcoded `100` is the bug that renders 437 000 so'm as 4 370.
- Formatting happens only at the display edge, in the frontend, using the buyer's locale. `Intl` bills UZS at two decimals by default; the exponent overrides it.
- Every arithmetic path that splits money (platform fee, tax, multi-seller totals) must reconcile exactly: the sum of parts equals the whole, with any rounding remainder assigned deterministically to a documented party. Test this with a property test.
- An `Order` has exactly one currency. A cart containing sellers who cannot settle in that currency is rejected at checkout with a clear error, not silently converted.
- A discounted listing stores the was-price in `compare_at_amount_minor`, which must be strictly greater than the selling price (database CHECK plus a service check for the error message). It is display-only: orders are always built from `price_amount_minor`. The saving percentage is derived at read time and never stored.

### 5.2 Multi-seller orders

A cart routinely spans several sellers. The model reflects that explicitly.

- `Order` is the buyer-facing purchase: one payment, one currency, one shipping address, one buyer.
- `Shipment` (a per-seller fulfillment group) is the seller-facing unit: one seller, its own status, its own tracking number, its own payout line.
- `OrderItem` belongs to exactly one `Shipment` and carries a **snapshot** of the product at purchase time: `product_name`, `unit_amount_minor`, `sku`, `seller_id`, `prescription_required`. Never join to `Product` to display a historical order.

**Rules**

- Order totals are computed server-side from the snapshot at order creation. Client-supplied prices are ignored entirely.
- A seller may read and mutate only their own `Shipment` rows and the `OrderItem`s under them. They never see the buyer's other sellers, other items, or the order-level total.
- Buyer-visible order status is **derived** from its shipments (§5.4), not stored twice.
- Partial fulfillment is normal: one shipment delivered while another is still pending is a valid, expected state.

### 5.3 Inventory and stock

**Rules**

- `Product.stock` has a `CHECK (stock >= 0)` constraint. The constraint is the real guarantee; service checks are for good error messages.
- Decrement pattern, always: select the product rows for the order `... FOR UPDATE` **ordered by product id** (consistent ordering prevents deadlocks), verify availability, decrement, then proceed. Never read stock in one statement and write it in a later unlocked statement.
- Adding to cart does **not** reserve stock. Stock is committed at order creation, inside the order transaction.
- If the payment provider settles asynchronously, stock is held by the order row itself; a payment failure releases it via the cancellation path in §5.4, not by an ad hoc decrement.
- Overselling is a correctness bug, not a business inconvenience. Any change to this path needs a concurrency test that runs competing checkouts against the same product.

### 5.4 Order and shipment state machines

`Shipment.status` (the authoritative per-seller state):

```
pending_payment ──▶ paid ──▶ processing ──▶ shipped ──▶ delivered
      │                │          │
      │                │          └──▶ cancelled
      ├──▶ payment_failed         
      └──▶ cancelled

delivered ──▶ return_requested ──▶ returned ──▶ refunded
paid|processing|shipped|delivered ──▶ refunded   (partial or full)
```

`Order.status` is **derived**: `pending_payment` while any shipment awaits payment; `cancelled`/`refunded` when all shipments are; `partially_shipped` when some but not all are shipped; `completed` when all are delivered or returned.

**Rules**

- Transitions happen in exactly one place: `order_service.transition_shipment(...)`. Nothing else assigns a status.
- Illegal transitions raise `INVALID_STATE_TRANSITION`. The allowed-transition map is a module-level constant and is covered by a table-driven test.
- Every transition writes an `OrderEvent` row (actor, from, to, reason, timestamp). This is the order's history and the basis for buyer-facing tracking.
- Cancellation before shipment restores stock. Cancellation after shipment is not a thing — that is a return.
- A prescription-gated order cannot leave `paid` until its prescription is `approved` (§5.5).

### 5.5 Prescriptions and regulated products

- `Product.prescription_required: bool`. If any item in a cart requires one, checkout demands a `Prescription` upload before the order can be created.
- A `Prescription` is uploaded to private object storage, encrypted at rest, and referenced by key only. The bytes never pass through a log, a response body, or a job argument.
- Review states: `pending → approved | rejected(reason)`. Only `admin` may transition. The reviewing admin's ID and timestamp are recorded.
- Access is granted to: the owning buyer, and admins. **Not sellers** — a seller sees only that the gate is satisfied, never the document or its contents.
- Downloads are served as presigned URLs valid for ≤ 5 minutes, single use where the provider supports it. Every issuance is written to the audit log (§12.3).
- Certifications (CE / FDA / ISO) are required at product creation for regulated categories — `REGULATED_CATEGORY_SLUGS` names **departments**, and the check walks up from the product's own category, because a product always sits in a leaf. Matching the leaf slug against a set of department slugs passes every listing silently. Validate in `catalog_service.py`. Frontend validation is a convenience, never the enforcement point.

### 5.6 Idempotency and webhooks

**Rules**

- `POST /api/v1/checkout` requires an `Idempotency-Key` header. Keys are stored with the resulting order ID; a repeat key returns the original response instead of creating a second order.
- Webhooks: verify the signature **before** parsing or trusting anything. Reject unsigned or stale payloads.
- Store the provider event ID in a uniquely-indexed table before acting. A duplicate insert means "already processed" — return `200` and stop.
- Webhook handlers do the minimum synchronously (verify, record, enqueue) and return `200` fast. Real work happens in a job.
- Assume out-of-order delivery: a `payment.succeeded` may arrive before the checkout call returns. Handlers must be written as state reconciliation ("make it so"), not as event sequencing.
- Never trust amounts from a webhook without comparing them to the stored order total.

---

### 5.7 Catalog images

Product photos are the one thing in this system stored **publicly**. Everything
else in object storage — prescriptions above all — stays private, encrypted, and
reachable only through an expiring presigned URL (§5.5, §12.2).

**Rules**

- Two buckets, never one. `STORAGE_BUCKET` holds documents and is private;
  `IMAGE_BUCKET` holds catalog photos and is public. `app/storage/images.py` is
  the only module that touches the image bucket, and it never handles a
  prescription key.
- A photo is public because it has to be: the storefront serves it to anonymous
  shoppers on ISR-cached pages, and a URL that expires in minutes would make
  those pages uncacheable and break every CDN in front of them.
- Nothing identifying goes in an image key. Keys are
  `products/<product_id>/<uuid>.<ext>` — no seller name, no filename the
  uploader chose.
- Accepted types are JPEG, PNG, and WebP, at most 5 MB, at most
  `MAX_PRODUCT_IMAGES` per listing. **SVG is never accepted**: it is a
  script-bearing document served from our own origin, not a photo.
- `Product.images` is an ordered list and the order *is* the carousel order.
  Position 0 is the storefront thumbnail; reordering is a `PATCH` of the whole
  list, never a separate "primary" flag.
- Rows store a bare key; the response schema resolves it into a URL against
  `IMAGE_PUBLIC_BASE_URL`, so the bucket's hostname lives in configuration
  rather than being baked into every row. Seeded `/path` values and absolute
  URLs pass through untouched.
- Deleting a photo removes the stored object only when the key belongs to our
  image store, so a seeded asset is detached without being deleted.

## 6. API conventions

- Base path `/api/v1`. Breaking changes get `/api/v2`; additive changes do not.
- Resource paths are plural nouns: `/products`, `/orders`, `/sellers/{id}/shipments`. Verbs only for genuine actions that are not CRUD: `POST /orders/{id}/cancel`.
- IDs are UUIDv7 (time-ordered) exposed as strings. Never expose an auto-increment integer.
- Timestamps are UTC, RFC 3339, suffixed `_at`. The database stores `timestamptz`.
- **Pagination is cursor-based** on every list endpoint: `?limit=&cursor=`, response `{ "items": [...], "next_cursor": "..." }`. No offset pagination — the catalog changes under the reader.
- Filtering and sorting use explicit whitelisted query params. Never accept a raw sort expression or column name from the client.
- `PATCH` for partial updates; the schema's optional fields use a sentinel so "set to null" is distinguishable from "not provided".
- Every response body is a Pydantic schema with `model_config = ConfigDict(from_attributes=True)`. List endpoints return a slimmer `XListItem`, not the full `XRead`.
- Every endpoint declares `response_model`, `status_code`, and a docstring — the docstring becomes the OpenAPI description the frontend reads.
- `operation_id` is set explicitly on every route so generated client method names are stable and readable.

---

## 7. Data model

Core entities (`apps/api/app/models/`). Every model has `id: UUID`, `created_at`, `updated_at`.

| Model | Notes |
|---|---|
| `User` | role `buyer \| seller \| admin`; email unique (citext); `password_hash` (argon2) |
| `Seller` | 1:1 with a `User`; `verification_status`, certifications, `payout_account_ref: str \| None` (opaque) |
| `Product` | FK `seller_id`, `category_id`; `price_amount_minor`, optional `compare_at_amount_minor` (CHECK > price), `currency`, `stock` (CHECK ≥ 0), certifications, `prescription_required`; unique `(seller_id, sku)` |
| `Category` | self-referencing `parent_id`; slug unique; keep the tree shallow (≤ 3 levels) |
| `Order` | buyer, currency, shipping address snapshot, `payment_ref: str \| None`, derived status |
| `Shipment` | FK `order_id`, `seller_id`; status (§5.4), tracking, per-seller totals |
| `OrderItem` | FK `shipment_id`; product snapshot fields; quantity; `unit_amount_minor` |
| `OrderEvent` | append-only transition log: actor, from, to, reason, timestamp |
| `Prescription` | encrypted object key, owner, linked order, review status + reviewer |
| `Review` | unique `(product_id, buyer_id)`; rating 1–5; `verified_purchase` derived from a delivered `OrderItem` |
| `OutboxEvent` | type, payload (JSONB), `dispatched_at` — see §3.6 |
| `AuditLog` | actor, action, subject type/id, timestamp, IP — see §12.3 |
| `IdempotencyKey` | key, endpoint, request hash, response, expiry |
| `WebhookEvent` | provider, unique provider event ID, received/processed timestamps |

**Rules**

- Address is stored as a snapshot on the order, not a live FK to a mutable address book row.
- Soft deletes only where the domain needs history (`Product` uses `archived_at`; a listing that has been ordered is never hard-deleted). Everything else deletes for real.
- Index every FK, every column used in a `WHERE` on a list endpoint, and add a GIN index for full-text search on product name + description.
- Every model gets matching Pydantic schemas. A model field is never exposed simply because it exists — response schemas are written by hand, field by field.

---

## 8. Folder structure

```
/
├── apps/
│   ├── web/                              # Next.js frontend
│   │   ├── app/
│   │   │   ├── (storefront)/             # Public buyer-facing routes
│   │   │   │   ├── page.tsx
│   │   │   │   ├── category/[slug]/
│   │   │   │   ├── product/[slug]/
│   │   │   │   ├── cart/
│   │   │   │   └── checkout/
│   │   │   ├── (account)/                # Authenticated buyer routes
│   │   │   ├── (seller)/                 # Seller dashboard routes
│   │   │   ├── (admin)/                  # Admin routes
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                       # Restyled shadcn primitives — no business logic
│   │   │   └── domain/                   # Shared cross-feature compositions
│   │   ├── features/                     # Domain modules, names mirror the backend
│   │   │   ├── products/ orders/ sellers/ cart/ prescriptions/
│   │   ├── lib/
│   │   │   ├── api-client/               # Generated from OpenAPI — do not hand-edit
│   │   │   └── utils/
│   │   └── tailwind.config.ts
│   │
│   └── api/                              # FastAPI backend
│       ├── app/
│       │   ├── main.py                   # App entrypoint, router registration, error handlers
│       │   ├── core/                     # settings.py, errors.py, security.py, logging.py
│       │   ├── db/                        # engine, session, base, mixins
│       │   ├── auth/                     # JWT, current-user dependency, role guards
│       │   ├── models/                   # SQLAlchemy models
│       │   ├── schemas/                  # Pydantic request/response schemas
│       │   ├── api/                       # Routers, one module per domain
│       │   │   ├── deps.py
│       │   │   ├── products.py orders.py checkout.py sellers.py
│       │   │   ├── prescriptions.py payments.py admin.py
│       │   ├── services/                 # Business logic
│       │   │   ├── catalog_service.py order_service.py inventory_service.py
│       │   │   ├── seller_service.py prescription_service.py outbox_service.py
│       │   │   └── payments/
│       │   │       ├── base.py           # PaymentProvider port (§3.7)
│       │   │       ├── types.py          # Provider-agnostic dataclasses
│       │   │       └── adapters/         # fake.py (+ the real one, once §4 is decided)
│       │   ├── workers/                  # arq worker settings + tasks/ per domain
│       │   ├── storage/                  # S3/R2 client, presigning, encryption helpers
│       │   └── scripts/                  # seed.py and other one-off operational scripts
│       ├── alembic/versions/
│       ├── tests/
│       │   ├── unit/                     # Services, pure logic, no DB
│       │   ├── integration/              # Routers + real Postgres
│       │   └── conftest.py
│       ├── Dockerfile
│       ├── .env.example
│       └── pyproject.toml
│
├── tests/e2e/                            # Playwright, web + api together
├── docker-compose.yml                    # Postgres + Redis (+ api, optionally)
├── CLAUDE.md
└── README.md
```

---

## 9. Design system

Enforced through Tailwind tokens. Never hardcode a value that a token exists for.

**Palette — one neutral, one brand hue, one ink, plus opacity tints for hierarchy.**

Defined once in `apps/web/lib/design-tokens.ts`; `tailwind.config.ts` builds its colour scale from that file, and it is the only place a raw hex may appear (enforced by an ESLint rule).

```ts
// apps/web/lib/design-tokens.ts
export const palette = {
  base:           '#F7F8F9',  // background / neutral
  primary:        '#0096C7',  // medical blue — fills, active states, tints
  'primary-ink':  '#0077A3',  // the readable shade of primary — see below
  accent:         '#1B2430',  // dark navy/charcoal — headings, body text, emphasis
};
```

`primary-ink` is **a shade of `primary`, not a fourth hue.** It exists because the brand blue is a fill colour, not an ink one: white on `primary` is 3.39:1 and `primary` as text on white is 3.39:1, both under the 4.5:1 AA floor. The darker shade is 5.04:1 on white, so it carries anything made of text.

**Rules**

- No `drop-shadow`, no `bg-gradient-*`, anywhere, including inside vendored shadcn components. Strip them when the component is added.
- **One shadow exists: `shadow-card`, and only on a product card's hover.** It is defined once in `design-tokens.ts` (`accent` at 12%, not black) and installed as `theme.boxShadow` — *replacing* Tailwind's scale, not extending it, so `shadow-sm`/`md`/`lg` do not compile. Nothing at rest carries a shadow, and no other component may adopt this one without changing this rule. The ESLint guard permits `shadow-card` and rejects every other `shadow-`, `drop-shadow`, and `bg-gradient-`.
- Radius: **`rounded-lg` (8px) project-wide** for cards, buttons, inputs, modals, and images, set once as `radius` in `design-tokens.ts`. `rounded-full` is permitted only for avatars, pill badges, and counter bubbles. No other radius values — if cards ever need to read rounder than controls, that is a second radius and this rule has to change with it.
- Elevation and separation at rest come from `border border-accent/10` or a background step (`bg-base` against `bg-white`) — never from a shadow. The hover lift is the one case where a shadow says something a colour change cannot: this element moves when you click it.
- **Which blue goes where:** filled controls are `bg-primary-ink text-white`. `primary` carries tints and washes (`bg-primary/10`, `bg-primary/15`) and decorative fills that hold no text. Links, small text, icons, control borders, and focus rings are `primary-ink`. Never put white text on `primary`, and never use `primary` as a text colour.
- Icons: flat, line-based, from Lucide only. No icon sets with built-in shading or 3D effects.
- Typography: one scale, Helvetica Neue (`Helvetica, Arial, sans-serif` behind it — nothing is downloaded, and Arial is the metric match off Apple platforms). Text is `accent` on `base`/white; the blue is reserved for interactive elements.
- Hierarchy is built from weight, size, and spacing — not from adding a fourth color.
- Contrast must meet WCAG AA, including 3:1 for control boundaries. A cyan hairline does not clear that, which is why control borders use `primary-ink`.
- Every interactive element has a visible, non-shadow focus state (`ring-2 ring-primary-ink ring-offset-2`).
- Nothing scrolls sideways to be reachable. A row that overflows shows what fits and puts the remainder behind a menu that lists **everything**, so no viewport hides a destination.

---

## 10. Local development

Postgres and Redis run in Docker locally — no manual installs. The API runs either in Compose or on the host with `uvicorn --reload`; the Docker image is authoritative for what ships.

```yaml
# docker-compose.yml (repo root)
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: medsupply
      POSTGRES_PASSWORD: medsupply
      POSTGRES_DB: medsupply
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medsupply"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports: ["6379:6379"]

  api:
    build: { context: ./apps/api }
    env_file: ./apps/api/.env
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_started }
    ports: ["8000:8000"]
    volumes: ["./apps/api:/app"]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  worker:
    build: { context: ./apps/api }
    env_file: ./apps/api/.env
    depends_on:
      redis: { condition: service_started }
    volumes: ["./apps/api:/app"]
    command: arq app.workers.settings.WorkerSettings

volumes:
  pgdata:
```

### 10.1 Environment variables (`apps/api/.env`, documented in `.env.example`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://medsupply:medsupply@localhost:5432/medsupply` (`@db:5432` inside Compose) |
| `REDIS_URL` | `redis://localhost:6379/0` |
| `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | Auth |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | Object storage |
| `PRESCRIPTION_ENCRYPTION_KEY` | At-rest encryption for sensitive uploads |
| `IMAGE_BUCKET`, `IMAGE_PUBLIC_BASE_URL` | Public catalog-image bucket and its hostname (§5.7). Empty hostname falls back to the API's dev media route |
| `API_BASE_URL` | Used to build that dev fallback URL |
| `REVALIDATE_SECRET` | Shared with the web app's `POST /api/revalidate`; must match `apps/web/.env.local`. Empty disables the storefront cache bust |
| `PAYMENT_PROVIDER` | `fake` until §4 is decided |
| `EMAIL_API_KEY`, `EMAIL_FROM` | Transactional email |
| `SENTRY_DSN`, `ENVIRONMENT`, `LOG_LEVEL` | Observability |

`.env.example` lists every variable with a safe placeholder. Adding a setting to `core/settings.py` means adding it there in the same PR.

### 10.2 Commands

**Datastores (repo root)**

```bash
docker compose up -d db redis   # datastores only; run api/web on the host
docker compose up -d            # full backend stack
docker compose down             # stop
docker compose down -v          # stop and WIPE the DB volume — destructive, confirm first
```

**Backend (`apps/api`)**

```bash
uvicorn app.main:app --reload                  # dev server
arq app.workers.settings.WorkerSettings        # background worker
alembic upgrade head                           # apply migrations
alembic revision --autogenerate -m "message"   # create migration (always review the output)
python -m app.scripts.seed                     # seed dev data
pytest                                         # tests
ruff check . && black --check . && mypy app    # lint + types
```

**Frontend (`apps/web`)**

```bash
npm run dev            # dev server
npm run build          # production build
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm test               # vitest
npm run generate:api   # regenerate the typed client from the backend OpenAPI schema
```

**E2E (repo root)**

```bash
npm run test:e2e       # playwright against local web + api
```

---

## 11. Testing

| Layer | Tool | What it covers |
|---|---|---|
| Unit | pytest | Service logic with the DB and adapters faked. Pure rules: totals, splits, state transitions, validation |
| Integration | pytest + httpx + real Postgres | Router → service → DB. Auth, authorization, error codes, pagination |
| Concurrency | pytest | Competing checkouts, duplicate webhooks, repeated idempotency keys |
| Frontend unit | Vitest | Components, hooks, formatting |
| E2E | Playwright | Browse → cart → prescription upload → checkout → order tracking; seller listing → order → fulfillment |

**Rules**

- Integration tests run against a real Postgres (Docker), never SQLite. The dialects differ where it matters.
- Each test gets a transaction that is rolled back afterwards. Tests never depend on each other's data or on execution order.
- Payments are always `FakePaymentProvider`. Never hit a provider sandbox from a test.
- Test the authorization boundary explicitly: for every protected endpoint, assert that the wrong role gets `403` and that a valid actor cannot reach another actor's rows.
- Every bug fix starts with a failing test that reproduces it.
- Fixtures live in `conftest.py` as factories, not as module-level constants.

---

## 12. Security and compliance

### 12.1 Authentication
- Passwords hashed with argon2id. Never bcrypt-with-defaults, never a fast hash.
- Access tokens are short-lived (≤ 15 min); refresh tokens rotate on use and are revocable server-side.
- Rate-limit login, registration, password reset, checkout, and prescription upload (`slowapi`). Lock out after repeated failures with exponential backoff.
- Email enumeration is not permitted: login and reset return the same response whether or not the account exists.

### 12.2 Data handling
- Prescriptions and any health-related document: encrypted at rest, private bucket, presigned access only, role-checked at the service layer, access logged.
- Never place a raw file, address, or health detail in a job argument, a log line, a Sentry event, or a URL.
- Sellers never receive buyer contact details beyond what shipping requires, and never another seller's data.
- Input validation is Pydantic-first at the boundary and re-asserted in services for anything that carries an invariant. Client-side validation is UX, not security.

### 12.3 Audit log
Written for: prescription view/download, prescription review decision, seller verification change, refund issued, order state change by an admin, role change, user deletion. Entries are append-only and never contain document contents.

### 12.4 Observability
- Structured JSON logs with a `request_id` propagated from an inbound header or generated per request, and carried into jobs.
- Log at the edges (request start/end, job start/end, external call) and on every handled error. Do not log inside tight loops.
- Sentry on both apps with `send_default_pii=False` and a scrubber for our sensitive field names.
- Health endpoints: `/healthz` (liveness, no dependencies) and `/readyz` (DB + Redis reachable).

---

## 13. Git, PRs, and definition of done

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`. Scope with the domain where useful: `feat(orders): ...`.
- Branch per change, rebased on main, squash-merged.

**Definition of done** — a change is not finished until all of these hold:

- [ ] Lint, format, and type checks pass on both apps
- [ ] `pytest` passes, including a new test for the changed behavior
- [ ] Model change → Alembic migration in this PR, and `alembic downgrade -1` was actually run and works
- [ ] Router schema change → `npm run generate:api` re-run, generated diff committed
- [ ] New settings → added to `.env.example`
- [ ] New error code → added to the handler map and used by the frontend
- [ ] New endpoint → authorization test for the wrong role and the wrong owner
- [ ] No hardcoded colors, radii, or shadows introduced
- [ ] No secrets, no PHI in logs
- [ ] `CLAUDE.md` updated if a rule, decision, or convention changed

**Migration rules**

- Review every autogenerated migration by hand; Alembic misses type changes, server defaults, and index renames.
- Expression and partial indexes (the product FTS GIN index, the active-listing partial index) are written by hand and listed in `HAND_WRITTEN_INDEXES` in `alembic/env.py`, so `--autogenerate` stops proposing to drop them. Add to that set when you add another.
- A column whose database type is not the model's type will be "fixed" by autogenerate on every run. Declare the real type instead — `users.email` uses the `CaseInsensitiveText` decorator, which renders `citext` on Postgres, rather than being patched in a migration.
- Tests build the schema from the metadata rather than by running migrations, so anything a migration does outside the models (the `citext` extension) has to be repeated in `tests/conftest.py`.
- Destructive changes use expand/contract across two deploys: add the new column, backfill, switch reads, then drop the old one in a later PR. Never drop and recreate a populated column in one step.
- Backfills that touch many rows run in batches, in a job, not inside the migration.

---

## 14. Working agreements for agents

- **Read before writing.** Inspect the existing module in the domain you are touching and match its shape. Consistency beats personal preference.
- **Stay inside the domain module.** A change to orders should not reach into `catalog_service.py`. If it must, that is a signal worth raising, not a refactor to do silently.
- **Never invent a decision this file marks open.** §4 is open on purpose. If a task cannot proceed without it, do the provider-agnostic part, and say precisely what is blocked.
- **Do not add a dependency** without asking — including a "small" utility library. The stack in §2 is settled.
- **Do not run destructive commands** (`docker compose down -v`, `alembic downgrade` beyond one step, `DROP`, bulk `UPDATE`/`DELETE` without a `WHERE`) without explicit confirmation.
- **Do not weaken a test to make it pass.** A failing test is information.
- **Do not disable a lint rule, add `# type: ignore`, or cast to `any`** to get past an error. Fix the cause, or ask.
- **Never edit generated code** (`lib/api-client/`). Change the Pydantic schema and regenerate.
- **When a rule here conflicts with the task**, stop and say so. Do not quietly pick one.
- **Prefer the smallest change that fully solves the problem.** No speculative abstraction, no unrequested refactor, no drive-by reformatting of files you did not otherwise touch.
- **Ambiguity gets one question, not a guess** — especially anything touching money, stock, auth, or prescriptions.
