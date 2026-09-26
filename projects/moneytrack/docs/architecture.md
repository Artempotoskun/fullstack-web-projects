# MoneyTrack architecture

## Runtime components

The Next.js frontend owns presentation, locale routing, responsive navigation, forms, and Recharts visualizations. It never calculates authoritative analytics. Authenticated requests go to the NestJS REST API with HTTP-only cookies.

NestJS owns validation, authorization, balance mutations, analytics, import orchestration, and audit events. Prisma is the only database access layer. PostgreSQL stores relational application state. Redis and BullMQ execute imports and recurring-payment work outside request latency.

## Financial invariants

- Transaction amounts are stored as positive decimal values; `type` determines their direction.
- Account balances and transaction records change in one database transaction.
- A transfer creates paired `TRANSFER` records sharing `transferGroupId` and updates both accounts atomically.
- Transfers never contribute to income/expense/savings analytics.
- Archived accounts, categories, and goals remain available to historical records.
- Category deletion is archival; transaction category foreign keys use `SET NULL` only for a hard database deletion.
- Multi-currency totals are grouped by currency rather than silently applying invented exchange rates.

## Import pipeline

Uploads are held in memory with a 5 MB limit. Parsers return normalized row objects, column matching proposes a mapping, and preview validation shows row errors before confirmation. Confirmed jobs run through BullMQ. Each valid row receives a deterministic account/date/description/amount fingerprint so repeated statements are skipped safely.

## Scaling notes

The queue separates CPU and I/O-heavy imports from API latency. Analytics currently use indexed PostgreSQL queries and in-process aggregation, which is appropriate for personal datasets. Larger deployments could add materialized monthly summaries without changing the public API.
