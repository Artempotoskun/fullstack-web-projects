# Architecture notes

AutoParts Store is a modular monolith. The NestJS application owns all business rules and persistence; Next.js is a separate presentation layer that consumes its REST contract. PostgreSQL is the only source of truth.

## Module boundaries

- `auth` owns credentials, tokens, password reset and session revocation.
- `users` owns profiles and administrative user views.
- `catalog` owns products, categories, manufacturers, translations and search.
- `vehicles` owns the make/model/engine hierarchy and compatibility mapping.
- `cart` owns the single persistent cart per user and server-side totals.
- `orders` owns checkout, immutable line snapshots, stock mutation and lifecycle rules.
- `admin` exposes role-protected reporting and management operations.

## Important invariants

1. Product prices and discounts are always recalculated by the API.
2. Order creation and stock decrement happen in one database transaction.
3. Refresh tokens are stored only as SHA-256 hashes and are rotated on refresh.
4. Localized entities have a stable base record and one translation record per locale.
5. Compatibility is many-to-many through `ProductCompatibility`.
