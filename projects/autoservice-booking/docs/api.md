# REST API summary

Swagger UI is available at `/api/docs`.

| Area | Endpoints |
| --- | --- |
| Authentication | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password` |
| Profile | `GET/PATCH /users/me` |
| Vehicles | `GET/POST /vehicles`, `PATCH/DELETE /vehicles/:id` |
| Catalog | `GET /services`, `/services/:id`, `/locations` |
| Availability | `GET /availability`, `/availability/calendar` |
| Bookings | `POST /bookings`, `GET /bookings/mine`, `PATCH /bookings/:id/reschedule`, `/cancel` |
| Notifications | `GET /notifications`, `/unread-count`, `PATCH /notifications/:id/read` |
| Admin | `GET /admin/dashboard`, `/resources`, `/audit`; service, schedule, block and resource mutations |

## Availability request

```http
GET /api/availability?serviceId=...&locationId=...&vehicleId=...&date=2026-10-02
```

The response includes the date state (`AVAILABLE`, `FULLY_BOOKED` or `UNAVAILABLE`) and concrete ISO intervals. Slots are calculated from business hours, special working days, service duration, blocked periods, active bookings, technician skills and service-bay capacity.
