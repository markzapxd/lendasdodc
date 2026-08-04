# API Reference

All responses are JSON. Error responses use `{ "error": "..." }`; validation errors may also include an `issues` array.

## Authentication

Admin routes accept a valid admin session in the `_ldc_admin_session` cookie or as `Authorization: Bearer <session-token>`. State-changing admin requests made with the cookie must also send the value of the readable `_ldc_admin_csrf` cookie in `X-CSRF-Token`. Do not send both cookie and bearer credentials on those requests.

Cron `POST` routes require `Authorization: Bearer <CRON_SECRET>`. Their `GET` routes are health and metrics endpoints and do not require this header.

## Public Route

### `POST /api/report`

Submit a report for a message. The request needs an anonymous session, supplied by the `_ldc_session` cookie or `X-Session-Hmac` header.

```json
{
  "messageId": "e2c1c4ef-0d07-45f3-bcf5-1f1e3513bff7",
  "cardId": "d7895ece-fb64-48a8-9a02-c4b65b3c4568",
  "reason": "spam",
  "details": "Optional context, up to 500 characters."
}
```

`reason` is one of `spam`, `abuse`, `inappropriate`, or `other`. A successful request returns `201` with the created report object.

```json
{
  "id": "b9137a9b-6cf2-45b2-b33e-24dcf8c8b7c1",
  "messageId": "e2c1c4ef-0d07-45f3-bcf5-1f1e3513bff7",
  "cardId": "d7895ece-fb64-48a8-9a02-c4b65b3c4568",
  "reason": "spam",
  "status": "pending",
  "createdAt": "2026-08-04T12:00:00.000Z"
}
```

Returns `401` for a missing session, `400` for a malformed body, invalid reason, or `details` longer than 500 characters, `409` for a duplicate report or a report of the caller's own message, `429` when report limits are reached, and `500` for an unexpected error.

## Admin Session Routes

### `POST /api/admin/login`

```json
{
  "email": "admin@example.com",
  "password": "password",
  "totpCode": "123456"
}
```

`totpCode` must be six digits. A successful request returns `200`, sets the admin and CSRF cookies, and returns:

```json
{
  "success": true,
  "user": {
    "id": "a1c9aa97-c174-43ef-a1ec-0e47faa948c5",
    "email": "admin@example.com",
    "name": "admin@example.com",
    "role": "admin"
  }
}
```

Returns `400` for an invalid body, `401` for invalid credentials or TOTP code, and `429` when login attempts are limited.

### `POST /api/admin/logout`

Clears the current admin and CSRF cookies. It returns `200` with:

```json
{ "success": true }
```

### `GET /api/admin/me`

Requires admin authentication. Returns `200` with:

```json
{ "user": { "id": "a1c9aa97-c174-43ef-a1ec-0e47faa948c5", "role": "admin" } }
```

Returns `401` without a valid session and `500` for an unexpected error.

## Admin Cards

### `GET /api/admin/cards`

Requires admin authentication. Example request: `GET /api/admin/cards`. Returns `200` with:

```json
{ "cards": [{ "id": "d7895ece-fb64-48a8-9a02-c4b65b3c4568", "name": "Nome do card", "slug": "nome-do-card", "status": "active", "message_count": 0 }] }
```

Cards also include optional description and image fields and timestamps. Returns `401` or `500` on authentication or unexpected errors.

### `POST /api/admin/cards`

Requires admin authentication and CSRF when using cookies.

```json
{
  "name": "Nome do card",
  "slug": "nome-do-card",
  "description": "Optional description",
  "image_url": "https://example.com/image.webp",
  "image_alt": "Descrição da imagem"
}
```

`name` is 1 to 100 characters, `slug` uses lowercase letters, digits, and single hyphens, `description` is at most 500 characters or `null`, and `image_alt` is at most 200 characters or `null`. `image_url` is a URL or `null`. Returns `201` with `{ "card": { ... } }`. Returns `400` for invalid JSON or card data, `401` or `403` for authentication or CSRF failures, and `500` for an unexpected error.

### `PATCH /api/admin/cards/:id`

Requires admin authentication and CSRF when using cookies. `id` must be a UUID. Update the card with:

```json
{
  "action": "update",
  "card": {
    "name": "Nome do card",
    "slug": "nome-do-card",
    "description": null,
    "image_url": null,
    "image_alt": null
  }
}
```

Archive or restore it with `{ "action": "archive" }` or `{ "action": "restore" }`. Returns `200` with `{ "card": { ... } }`. Returns `400` for invalid JSON, ID, action, or data, `401` or `403` for authentication or CSRF failures, and `500` for an unexpected error.

### `POST /api/admin/upload`

Requires admin authentication and CSRF when using cookies. Send `multipart/form-data` with `file` and `cardId`. `cardId` uses letters, digits, underscores, and hyphens, with a maximum length of 128. Files must be JPEG, PNG, or WebP and no larger than 4 MiB.

Returns `200` with:

```json
{
  "success": true,
  "url": "https://example.com/card-image.webp",
  "metadata": { "width": 1200, "height": 630, "format": "webp", "size": 12345, "hasAlpha": false }
}
```

Returns `400` for invalid form data or image input, `401` or `403` for authentication or CSRF failures, and `500` for an unexpected error.

## Admin Moderation

### `GET /api/admin/messages`

Requires admin authentication. Example request: `GET /api/admin/messages?status=pending&limit=25`. Optional query parameters are `status`, which defaults to `pending`, and `limit`, which defaults to 50 and must be an integer from 1 through 100. Returns `200` with:

```json
{ "messages": [{ "id": "e2c1c4ef-0d07-45f3-bcf5-1f1e3513bff7", "status": "pending" }] }
```

Returns `401` for an invalid session and `500` for invalid limits or unexpected errors.

### `PATCH /api/admin/messages`

Requires admin authentication and CSRF when using cookies.

```json
{
  "messageId": "e2c1c4ef-0d07-45f3-bcf5-1f1e3513bff7",
  "action": "approve",
  "reason": "Optional moderation note"
}
```

`action` is `approve`, `reject`, `delete`, or `flag`. Returns `200` with the action, message ID, moderator ID, timestamp, and optional reason. Returns `400` for an invalid body or action, `401` or `403` for authentication or CSRF failures, and `500` for an unexpected error.

### `GET /api/admin/reports`

Requires admin authentication. Example request: `GET /api/admin/reports?status=pending&limit=25`. Optional `status` is `pending`, `reviewed`, `resolved`, or `dismissed`, defaulting to `pending`. Optional `limit` defaults to 50 and must be an integer from 1 through 100. Returns `200` with:

```json
{ "reports": [{ "id": "b9137a9b-6cf2-45b2-b33e-24dcf8c8b7c1", "status": "open" }] }
```

Returns `400` for an invalid status, `401` for an invalid session, and `500` for invalid limits or unexpected errors.

### `PATCH /api/admin/reports`

Requires admin authentication and CSRF when using cookies.

```json
{ "reportId": "b9137a9b-6cf2-45b2-b33e-24dcf8c8b7c1", "status": "resolved" }
```

`status` is `resolved` or `dismissed`. Returns `200` with the report ID and status. Returns `400` for an invalid body, `401` or `403` for authentication or CSRF failures, and `500` for an unexpected error.

### `GET /api/admin/reports/:id`

Requires the admin session cookie. Example request: `GET /api/admin/reports/b9137a9b-6cf2-45b2-b33e-24dcf8c8b7c1`. Returns `200` with report details, for example `{ "id": "b9137a9b-6cf2-45b2-b33e-24dcf8c8b7c1", "status": "open" }`. Returns `401` without a valid session and `404` when details cannot be found.

### `PATCH /api/admin/reports/:id`

Requires admin authentication and CSRF when using cookies.

```json
{ "status": "dismissed", "deleteMessage": false }
```

`status` is `resolved` or `dismissed`; `deleteMessage` is optional and defaults to `false`. Returns `200` with the resolution result. Returns `400` for invalid JSON, invalid resolution data, or a failed resolution, `401` or `403` for authentication or CSRF failures, and `500` for an unexpected authentication error.

## Admin Settings

### `GET /api/admin/settings`

Requires admin authentication. Returns `200` with:

```json
{
  "settings": {
    "configured_interval_ms": 60000,
    "emergency_mode": false,
    "degraded_mode": false
  }
}
```

### `PATCH /api/admin/settings`

Requires admin authentication and CSRF when using cookies. Send at least one supported property:

```json
{ "configured_interval_ms": 60000, "emergency_mode": false, "degraded_mode": false }
```

`configured_interval_ms` must be a positive integer. The mode values must be booleans. Returns `200` with `{ "success": true }`. Returns `400` for invalid JSON, settings, or an empty update, `401` or `403` for authentication or CSRF failures, and `500` for an unexpected error.

## Cron Routes

### `POST /api/cron/publish`

Requires the cron bearer token. Returns `200` with `{ "success": true, ... }` after running the publication scheduler, `401` for an invalid token, and `500` with `{ "success": false, "error": "..." }` on failure.

### `GET /api/cron/publish`

Returns `200` with `{ "status": "ok", "timestamp": 0 }`.

### `POST /api/cron/worker`

Requires the cron bearer token. Returns `200` with `success`, `processed`, `dlqProcessed`, `duration`, and `metrics`. Returns `401` for an invalid token and `500` with `{ "success": false, "error": "..." }` on failure.

### `GET /api/cron/worker`

Returns `200` with `{ "status": "ok", "metrics": { ... }, "timestamp": 0 }`, or `500` with `{ "status": "error", "error": "Failed to get metrics" }`.
