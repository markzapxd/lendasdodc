# Lendas do DC Architecture

## Scope

Lendas do DC is an anonymous, card-first messaging platform. Visitors discover cards, read published messages, submit messages without a public account, and report content. A separate administrative plane handles moderation and operations.

The product does not provide public profiles, registration, social login, author-owned deletion, moderator accounts, or a spoofable online-user count.

## System Overview

The browser renders the public experience through the Next.js 16 App Router. Server Components and route handlers delegate to typed feature services rather than exposing database or provider clients to the browser.

The application server coordinates four layers:

1. Public read paths serve cards and redacted messages.
2. Anonymous mutation paths validate input and place messages into a durable fair queue.
3. The publication worker commits one eligible message at a time.
4. The admin plane performs authenticated moderation, security, and operational actions.

Supabase/Postgres is the durable data layer. Upstash Redis provides fail-closed admission limits and short-lived coordination. QStash delivers signed, at-least-once worker callbacks. Turnstile is an adaptive, server-verified abuse control.

## Module Boundaries

```text
src/
  app/             App Router pages, layouts, and route handlers
  features/        Domain modules such as cards, messages, queue, reports, and admin
  components/      Shared presentation and UI primitives
  lib/
    env/           Typed public and server environment contracts
    errors/        Shared discriminated application error contracts
    ids/           Branded semantic identifier types
    server-only/   Marker for privileged modules that cannot reach client code
docs/              Architecture, operational, and decision documentation
tests/             Unit, integration, and end-to-end contracts
```

Client Components may import browser-safe presentation and public contracts only. They must not import `src/lib/env/server.ts`, private providers, admin services, queue workers, or any module reachable from those modules. Privileged modules belong behind the `src/lib/server-only/` convention and must not be re-exported from a shared barrel.

Only `src/lib/env/public.ts` and `src/lib/env/server.ts` read `process.env`. The public module parses only the two `NEXT_PUBLIC_*` values. The server module parses every secret and is never a source for browser bundles.

Routes translate service outcomes into safe responses. Domain failures use `AppError` discriminated unions; provider details, stack traces, secrets, private IDs, receipts, and raw abuse identifiers never cross the public response boundary.

## Data Layer and Security Schemas

The public `api` schema contains cards, published message projections, removed-message placeholders, and other explicitly allowlisted public state. Anonymous clients receive read-only data through Row Level Security (RLS). Realtime publishes only the same sanitized public projections.

The private `private` schema contains queue items, delivery and idempotency records, anonymous-session metadata, reports, abuse state, administrator credentials, sessions, audit records, retention state, and outbox records. It is not exposed through the browser, Supabase Data API, Realtime, logs, analytics, or test evidence. Service-only functions use narrowly scoped grants and fixed search paths.

Private image staging is server/admin-only. Public images are validated and re-encoded derivatives; untrusted source files never become public objects directly.

## Anonymous Message Data Flow

```text
anonymous visitor
  -> guarded server mutation
  -> input validation and optional Turnstile verification
  -> Redis admission limits and coordination fence
  -> server-issued opaque anonymous session
  -> Postgres queue item and transactional outbox
  -> signed QStash delivery
  -> worker verification and Postgres publication gate
  -> public message projection and aggregate update
  -> Supabase Realtime hint and client reconciliation
```

Redis is required for admission and short-lived fencing, but it is not durable business truth. Postgres decides committed queue order, idempotency, publication cadence, and final state. QStash is at-least-once delivery, so duplicate and late callbacks must resolve through durable idempotency records.

The publication gate enforces the configured global cadence, five seconds by default, and selects an eligible actor-alternating FIFO item where possible. A Realtime event is only a hint: clients deduplicate by public ID/version and refetch authoritative public data after reconnects or missed events.

## Security Boundaries

### Browser to application

- Validate method, content type, body size, origin, and Fetch Metadata on mutations.
- Use typed request and response contracts with no state-changing GET routes.
- Keep authorization, rate limiting, idempotency, and Turnstile decisions on the server.
- Use CSP, HSTS, `nosniff`, frame, referrer, and permissions protections.

### Anonymous identity and abuse controls

- Issue server-generated opaque `__Host-lddc_anon` cookies with HttpOnly, Secure, and SameSite=Lax attributes.
- Store only versioned HMAC-derived identity material, never raw session tokens or raw IP addresses.
- Trust only documented ingress metadata; never trust caller-supplied forwarding headers.
- Fail closed for required Redis or Turnstile paths. Public reads may remain available during mutation degradation.

### Administration and workers

- Keep admin routes separate from anonymous sessions.
- Protect administrators with Argon2id, mandatory TOTP, one-time recovery codes, session rotation/revocation, CSRF, and fresh reauthentication for mutations.
- Bootstrap and break-glass operations are CLI-only.
- Require QStash signature verification before processing worker payloads and dedicated secret verification for cron routes.
- Record privileged mutations in append-only, redacted audit records transactionally.

### Secrets and observability

Server secrets never use the `NEXT_PUBLIC_` prefix. They must not appear in browser bundles, HTML, responses, logs, analytics, screenshots, or evidence. Logs and alerts contain stable typed events and redacted operational metadata, never message bodies, raw IPs, session tokens, receipts, credentials, or private identifiers.

## Technology Choices

| Technology | Responsibility |
| --- | --- |
| Next.js 16 App Router | Server-first routing, Server Components, route handlers, and deployment integration |
| React 19 | Public and admin UI composition |
| Supabase/Postgres | Durable public/private schemas, RLS, transactions, and Realtime projections |
| Upstash Redis | Fail-closed quotas, admission checks, TTL state, and worker fencing |
| Upstash QStash | Signed, delayed, at-least-once worker delivery |
| Cloudflare Turnstile | Adaptive, server-side challenge verification when risk requires it |
| Zod | Runtime parsing for environment and external input contracts |
| TypeScript strict mode | Compile-time module, error, and semantic-ID contracts |
| Vitest | Fast unit verification of boundary contracts |
| Biome | Formatting and linting for the repository |

## Failure and Recovery Model

Public reads degrade independently from mutations. Redis outages, required Turnstile failures, invalid worker signatures, authorization failures, and audit failures fail closed for state-changing operations. Unknown worker outcomes remain represented by durable delivery/idempotency state and are reconciled by rescue jobs rather than by releasing a fence early.

The system does not promise exactly-once Realtime delivery, exact queue positions, or absolute anonymity. It promises that durable publication and public visibility are governed by the server-side contracts above.
