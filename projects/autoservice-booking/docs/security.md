# Security model

## Trust boundaries

- The browser is untrusted. IDs, prices, roles and availability are revalidated by the API.
- DTO allow-lists reject mass-assignment fields.
- Ownership checks protect vehicles, bookings and notifications against IDOR.
- `ADMIN` routes use backend RBAC guards; hidden controls are not authorization.
- Prisma parameterizes application queries. The two raw SQL calls use tagged templates.

## Authentication

- Passwords use bcrypt with cost factor 12.
- Access and refresh tokens use separate secrets and expirations.
- Refresh tokens rotate and are stored as SHA-256 digests.
- Refresh tokens use `HttpOnly`, `SameSite=Lax` cookies and `Secure` in production.
- Login, registration and reset endpoints are rate-limited.
- Password reset responses do not reveal whether an email exists.

## HTTP and operations

- Helmet provides secure response headers.
- CORS uses an explicit environment allow-list.
- Global validation strips unknown properties and rejects non-allow-listed input.
- Internal errors are logged server-side and returned as sanitized envelopes.
- Administrative mutations produce audit records with actor, action, entity and metadata.
- No card data or real payment credentials are accepted by this portfolio demo.

Secrets belong in `.env`, never source control. Demo credentials are public test data and must not be reused in a real deployment.
