# MoneyTrack API

All endpoints are prefixed with `/api`. Except for public authentication and health endpoints, requests require a valid access cookie or bearer token. Swagger is available at `/api/docs` while the API runs.

| Group | Representative endpoints |
| --- | --- |
| Health | `GET /health` |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/password-reset/request` |
| User | `GET /users/me`, `PATCH /users/me` |
| Accounts | `GET /accounts`, `POST /accounts`, `PATCH /accounts/:id`, `DELETE /accounts/:id` |
| Transactions | `GET /transactions`, `POST /transactions`, `POST /transactions/transfer`, `PATCH /transactions/:id`, `DELETE /transactions/:id` |
| Categories | `GET /categories`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` |
| Budgets | `GET /budgets`, `POST /budgets`, `DELETE /budgets/:id` |
| Goals | `GET /goals`, `POST /goals`, `PATCH /goals/:id`, `DELETE /goals/:id` |
| Recurring payments | `GET /recurring-payments`, `POST /recurring-payments`, `PATCH /recurring-payments/:id`, `DELETE /recurring-payments/:id` |
| Analytics | `GET /analytics/overview`, `GET /analytics/trends`, `GET /analytics/comparison` |
| Imports | `GET /imports`, `POST /imports/preview`, `POST /imports/:id/confirm` |
| Categorization | `GET /categorization-rules`, `POST /categorization-rules`, `PATCH /categorization-rules/:id`, `DELETE /categorization-rules/:id` |
| Activity | `GET /audit-logs` |

## Transaction filters

`GET /transactions` accepts `accountId`, `categoryId`, `type`, `from`, `to`, `search`, `minAmount`, `maxAmount`, `page`, and `limit`. Limits are capped at 100 records.

## Import contract

`POST /imports/preview` accepts multipart form data with an `accountId` and a `file` (`.csv` or `.xlsx`). The response includes headers, suggested mapping, validation results, and a preview ID. `POST /imports/:id/confirm` queues that preview exactly once.

## Error shape

Errors include the HTTP status, request path, ISO timestamp, and NestJS validation or exception payload. Unknown request properties are rejected.
