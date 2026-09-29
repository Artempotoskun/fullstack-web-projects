# MoneyTrack security notes

MoneyTrack demonstrates practical application security controls for a portfolio project. It is not a bank, payment processor, or PCI-compliant product.

## Implemented controls

- bcrypt password hashing with work factor 12
- Separate JWT access and refresh signing secrets
- Short-lived access tokens and one-time refresh-token rotation
- SHA-256 hashes for persisted refresh tokens
- HTTP-only, `SameSite` cookies with the production `Secure` flag
- Route-level identity ownership checks
- DTO validation, input whitelisting, and rejection of unknown fields
- Global rate limiting
- Helmet security headers and explicit credentialed CORS origins
- Decimal database types, foreign keys, indexes, and restrictive deletes
- Audit events for login and material data-management actions
- Size- and extension-limited statement uploads
- Preview-first imports with malformed row reporting and duplicate detection
- No secret values in audit metadata

## Intentionally excluded data

Do not enter or store full card numbers, CVV values, online banking passwords, recovery codes, real API secrets, or financial institution credentials. Accounts in MoneyTrack are user-defined bookkeeping containers only.

## Production follow-ups

A real deployment should add an external email provider for password reset verification, a secret manager, TLS termination, dependency monitoring, backup/restore procedures, signed malware scanning for uploads, formal retention rules, and a completed TOTP enrollment/recovery flow.
