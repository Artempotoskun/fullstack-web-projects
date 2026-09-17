# API quick reference

Interactive OpenAPI documentation is available at `http://localhost:4000/api/docs` while the backend is running.

| Area | Endpoints | Access |
| --- | --- | --- |
| Health | `GET /api/health` | Public |
| Authentication | `POST /api/auth/register`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password` | Mixed |
| Catalog | `GET /api/products`, `/products/:id`, `/products/suggestions`, `/categories`, `/manufacturers` | Public reads; admin writes |
| Vehicles | `GET /api/vehicles` | Public read; admin writes |
| Profile | `GET/PATCH /api/users/me` | User |
| Cart | `GET /api/cart`, `POST/PATCH/DELETE /api/cart/items` | User |
| Orders | `POST /api/orders`, `GET /api/orders/mine`, `GET /api/orders/:id` | User |
| Administration | `/api/admin/*`, order status updates, catalog mutations, user list | Admin |

Public product queries accept `search`, `category`, `manufacturer`, `engineId`, `year`, `minPrice`, `maxPrice`, `inStock`, `discounted`, `sort`, `page`, `limit`, and `locale`.
