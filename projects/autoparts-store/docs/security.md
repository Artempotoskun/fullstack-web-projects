# Security model

## Trust boundaries

The browser is untrusted. It may request any route and manipulate any payload, so authorization and all price, discount, stock and order calculations live in NestJS. Prisma is the only database access layer.

## Controls

- Passwords are hashed with bcrypt using cost factor 12.
- Access tokens expire quickly (15 minutes by default).
- Refresh tokens use a separate signing secret, are rotated after every refresh, stored only as SHA-256 digests, and delivered in `HttpOnly`, `SameSite=Lax` cookies.
- ADMIN permissions are checked by a global backend guard.
- Validation uses an allow-list and rejects undeclared fields.
- Global and endpoint-specific throttles protect authentication and reset endpoints.
- Helmet applies defensive HTTP headers; CORS uses an explicit origin allow-list.
- Prisma parameterizes database operations. No SQL text is built from user input.
- Generic 500 responses do not disclose internal exceptions.
- Administrative product and order mutations produce immutable audit log records.
- Checkout recalculates money and decrements stock inside one database transaction.
- Password reset tokens are random, short-lived and stored only as digests.

## Production checklist

1. Use independent, randomly generated 48+ byte JWT secrets.
2. Terminate TLS at a trusted proxy and keep `NODE_ENV=production`.
3. Restrict PostgreSQL to the application network and use a least-privilege database user.
4. Send reset links through a transactional email provider; never return the token outside development.
5. Centralize structured logs and alert on authentication spikes and administrative audit events.
6. Add dependency scanning, image scanning and secret scanning to the deployment platform.
