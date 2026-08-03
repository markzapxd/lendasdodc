---
slug: lendas-do-dc
status: plan-complete
intent: clear
review_required: false
pending-action: user chooses `$start-work lendas-do-dc` or optional dual high-accuracy plan review
approach: Greenfield Next.js App Router application with an anonymous public surface, isolated administrative control plane, Supabase/Postgres data and Realtime, Upstash Redis plus QStash for a durable fair publication queue, and evidence-driven TDD/visual/security/deploy gates.
---

# Draft: lendas-do-dc

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
C1 | Public experience and design system | active | user brief; frontend skill design-system gate
C2 | Anonymous publishing, cooldown, and anti-abuse | active | user brief sections 6, 6.1, 6.2, and anonymous cooldown
C3 | Data, Realtime, and RLS | active | user brief sections 7 and 11
C4 | Administration, moderation, and security | active | user brief sections 9, 10, and Authorization and Identity
C5 | Testing and observability | active | user brief sections 14 and 6.3
C6 | Infrastructure, CI, and cloud deploy | active | user brief sections 2 and 15

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
Language and copy | Brazilian Portuguese | explicit brief | reversible
Visual direction | dark editorial minimalism with black/charcoal surfaces and a restrained red semantic ramp; no third-party brand name or copied token appears in product artifacts | satisfies the explicit visual brief while avoiding trademark/reference drift | reversible before UI implementation
Accessibility | WCAG 2.2 AA minimum; keyboard, touch, reduced motion, screen-reader flows | production best practice and explicit accessibility request | reversible only upward
Testing | TDD with Vitest plus real integration services and Playwright E2E | programming skill mandates red-green-refactor and request explicitly requires tests | reversible, but not recommended
Redis outage | fail closed for public posting; reading remains available | explicit user requirement | reversible operational policy
Visitor identity | no public accounts; optional sanitized nickname and opaque anonymous session | owner confirmed that final anonymous sections override earlier account requirements | cross-cutting, confirmed
Publication fairness | durable fair queue with one pending message per anonymous session | owner selected recommended anti-monopolization strategy | cross-cutting, confirmed
Admin authentication | Argon2id password plus mandatory TOTP, recovery codes, opaque expiring server session | owner selected the safer option after security research | safety-critical, confirmed
Online indicator | omit from initial implementation | anonymous Presence is trivial to spoof and would create tracking/abuse surface; brief made it conditional on safety | reversible
Anonymous deletion | visitors cannot delete messages after publication; only the administrator can moderate/remove | final anonymous authorization block overrides earlier author-account behavior | confirmed override
Moderation timing | valid queued messages publish automatically, then remain reportable and soft-removable | pre-moderation was not requested and would make the five-second publication queue meaningless | reversible policy

## Findings (cited - path:lines)
Workspace is greenfield: only `.codegraph/` and `.omo/` are present; there is no application source, package manifest, test suite, or git repository.
Frontend work must create `DESIGN.md` before components and validate a primitive showcase before product screens (`frontend/references/design/README.md:29-59`; `design-system-architecture.md:192-202`).
The requested direction is fixed as dark editorial minimalism with restrained red emphasis; external references are research input only, while `DESIGN.md` must contain project-original tokens and explicitly prohibit copied logos, proprietary fonts, trademark assets, and brand copy (`frontend/references/design/README.md:188-210`).
TypeScript implementation must use strict compiler flags, Zod boundary parsing, typed errors, no `any`/non-null assertions, and TDD (`programming/references/typescript/README.md:27-56`; `tsconfig-strict.md:17-49`).
The security-review skill is a post-implementation audit gate requiring a concrete code target and Team Mode; it cannot produce a meaningful greenfield vulnerability audit now.
Current Supabase guidance permits public `anon` SELECT policies while denying writes, and Realtime Postgres Changes only emits rows each subscriber is authorized to read; privileged keys must remain server-only (Context7 `/supabase/supabase`, RLS and Realtime authorization docs).
Current Next.js 16 guidance supports encrypted/opaque server-side sessions with `HttpOnly`, `Secure`, `SameSite` cookies and requires role/session verification in each protected mutation; only `NEXT_PUBLIC_*` variables may be browser-exposed (Context7 `/vercel/next.js/v16.2.9`, authentication and environment-variable guides).
Upstash pipelines are not atomic; conditional coordination needs a single command, transaction, or Lua script. QStash delivery is at-least-once, so publication requires durable idempotency (Upstash docs research).
A Redis lease and a Postgres commit cannot form one atomic transaction. Strict acceptance therefore requires a Postgres singleton gate transaction as the final arbiter, while the required Redis `SET NX PX` remains a fail-closed publication precondition and UI TTL source.
Supabase Realtime is an ephemeral notification layer, not the source of truth; clients must deduplicate by immutable IDs and reconcile from durable Postgres state after reconnect.
The workspace is not a Git repository and has no source, manifests, tests, CI, migrations, docs, or design system; implementation must initialize all of them without treating `.codegraph/` or `.omo/` as product assets.
Final adversarial architecture and scope reviews both returned PASS after queue, Redis TTL, CAPTCHA, data-boundary, release-evidence, card-first, moderation, and delivery-inventory corrections were incorporated.
After approval, mandatory Metis gap analysis was completed and folded into the plan: 60 implementation-plus-test tasks across 10 waves, four final verifier tasks, explicit dependencies, real-service/browser evidence, deployment gates, and no placeholder tasks. Structural self-check confirmed all 60 implementation rows and F1–F4 rows are column-zero in the correct sections and all plan headings remain in template order.

## Decisions (with rationale)
Use one full-scope plan rather than an invented MVP because the user requested a complete deploy-ready system.
Treat the later anonymous-identity sections as the confirmed override of earlier account-based sections; the user selected anonymous visitors with an optional nickname.
Treat the later global cooldown as the confirmed override of the earlier per-user cooldown; IP/session quotas remain supplemental anti-abuse controls rather than authorization for a publication slot.
Keep public reads available during Redis failure while failing closed only writes, so safety does not unnecessarily take the community offline.
Owner confirmed six-component topology and TDD with Vitest, real integrations, and Playwright E2E.
Owner confirmed anonymous-only visitors plus global 5-second publication cadence; earlier profiles, public login, roles, and per-user cooldown requirements are superseded.
Owner confirmed a durable fair queue using Upstash QStash, including one pending item per anonymous session, approximate position, expiry, and server-side revalidation before publication.
Owner confirmed Argon2id password plus mandatory TOTP for the isolated `/admin` control plane.
Separate public enqueue from internal publication: a valid new or idempotently repeated submission receives `202 Accepted` plus receipt state. The visitor never receives `GLOBAL_COOLDOWN_ACTIVE`; receipt status communicates queued/published/expired/rejected. Only the signed QStash worker contends for the publication gate, and its retry/metrics response may carry the TTL/`Retry-After` contract. This is the necessary consequence of the owner-selected fair queue: cooldown blocks publication, not admission of one pending item per session.
Define publication acceptance as the durable Postgres transaction commit, not Redis acquisition or enqueue acknowledgement; persist queue status and idempotency state so unknown outcomes are safely retried.
Retain the Redis lock on any persistence failure or unknown outcome rather than releasing it; this may consume one five-second slot but cannot over-accept.
Use pseudonymous HMAC abuse identifiers instead of storing raw IPs; rotate secrets and delete buckets on a short documented retention schedule.
Keep public-safe tables/views in an exposed schema with explicit read-only RLS for anonymous clients; keep admin sessions, TOTP secrets/recovery hashes, abuse telemetry, queue internals, and audit internals private and server-only.
Expose only a dedicated `api` schema through Supabase Data API. Place public-safe `cards`, redacted `messages`, and sanitized `platform_state` there with anon SELECT-only RLS. Keep queue, credentials, reports, abuse telemetry, idempotency, retention, and audit tables in an unexposed `private` schema; service-only `SECURITY DEFINER` RPCs use empty `search_path`, fully qualified names, and revoked PUBLIC execution.
Use a single-region Upstash Redis colocated as closely as practical with the Supabase/Vercel write region for lock coordination; do not use eventually consistent multi-region Redis as the sole acceptance authority.
Use Upstash QStash as the sole durable delivery provider for this release, backed by a Postgres transactional outbox and permanent Postgres idempotency. Do not substitute another queue without new approval.
Use QStash delayed messages for sub-minute worker delivery; do not use QStash cron schedules for the five-second cadence because schedules are minute-granularity. Keep a minute-level rescue sweep only for stranded work.
QStash officially supports second-level relative delivery through `delay`/`Upstash-Delay` (for example `10s`), confirming delayed messages can drive the default five-second worker cadence (`https://upstash.com/docs/qstash/features/delay`).
Define fairness as actor-alternating FIFO: atomically assign a committed `enqueue_seq`; publish the oldest valid pending item whose anonymous session differs from the last published session when possible, otherwise the oldest valid item. Never use `SKIP LOCKED` in the authoritative selector.
Fairness applies only among active server-issued anonymous sessions retaining their cookie; it is not a per-person identity guarantee. Cookie/network rotation still passes Turnstile escalation, one-pending enforcement, duplicate detection, and versioned pseudonymous network limits.
Set one pending item per session, a 10-minute pending expiry, a bounded poisoned-head rejection scan, permanent Postgres idempotency for QStash/message IDs, and approximate queue positions that may move after expiry/revalidation.
Use two Redis concepts around publication: a processing fence and a `global:message-cooldown` owner token. Both precommit TTLs are strictly longer than the enforced maximum database transaction duration plus commit/network margin, and are never capped by or shorter than the DB statement timeout. On successful commit, atomically convert the owner fence into the configured cooldown; on failure or unknown outcome, retain both until expiry. Postgres still serializes and rechecks every publication.
The authoritative Postgres transaction locks one singleton gate row, rechecks eligibility with `clock_timestamp()` after the lock, selects one actor-alternating FIFO item without `SKIP LOCKED`, revalidates it, inserts one public message, marks the queue item, updates card aggregates/sanitized platform state and gate metadata, and writes outbox/idempotency rows in one commit. A second worker can only continue after both Redis and Postgres checks pass.
After a successful commit, the worker atomically converts its owner processing fence into a fresh cooldown of the configured interval; therefore no later worker may begin a commit until at least five seconds after the prior commit. If that post-commit Redis transition is lost or fails, the longer processing fence remains and only over-delays. DB time and a bounded DB timeout are test-enforced; no unbounded work or network call occurs inside the publication transaction.
Public Realtime uses only Postgres Changes from RLS-safe `cards`, redacted `messages`, and sanitized platform-state surfaces; unpublished queue/report/security/admin data is never subscribed publicly. Clients reconnect before the documented 24-hour anonymous connection limit and reconcile from durable cursors.
All mutations pass a central same-origin/fetch-metadata guard. Admin mutations additionally require a server synchronizer CSRF token, current Argon2id password/TOTP assurance, opaque rotated `__Host-` session, account+network limits, TOTP-step replay prevention, and transactional append-only audit.
Anonymous and admin session identifiers are generated only server-side with at least 128 bits of entropy; an anonymous session is never elevated into an admin session.
Turnstile verification is server-side, hostname/action-bound, single-use, idempotent, and fail-closed; trusted client IP comes only from the Vercel-controlled ingress header, never arbitrary forwarded headers.
CAPTCHA remains adaptive as explicitly requested: normal low-risk enqueue is not challenged, while suspicious behavior or threshold escalation requires a fresh Turnstile token bound to the enqueue action, session nonce, and production hostname. Once required, invalid/replayed/unavailable verification fails closed and cannot be bypassed by creating a new idempotency key.
Before creating an anonymous session, queue row, receipt, or outbox row, the enqueue endpoint must successfully perform its Redis rate-limit/fail-closed precondition. Redis unavailability returns `503 POSTING_TEMPORARILY_UNAVAILABLE`, creates no durable submission state, and leaves public reads/Realtime available.
Abuse buckets store only a domain-separated HMAC of the canonical trusted-ingress IP/session plus key version and expiry. Active and previous keys remain available for the complete bucket-retention window, and rotation never resets an active quota.
Every admin mutation requires CSRF protection and a session whose password-plus-TOTP reauthentication is no older than 15 minutes; accepted TOTP steps are consumed transactionally to prevent replay. Initial admin bootstrap, password/TOTP rotation, recovery-code issuance, and break-glass recovery are server-side CLI operations only—never public registration routes.
Use São Paulo as the production locality contract: Vercel `gru1`, Supabase South America/São Paulo, and a regional Upstash deployment in the matching `sa-east-1` locality when offered. If any selected paid tier cannot provide that locality, stop for a new owner decision rather than silently choosing another region. Staging and production have separate Vercel, Supabase, Redis, QStash, Turnstile, and secret sets.
The home page is card-first and cannot be replaced by a generic chronological feed. Each responsive person/character card exposes name, optional safe image or initial avatar, optional description, visible message count, last activity, and “Abrir card”; search, recent/commented/alphabetical sorting, cursor pagination, and loading/empty/error/long-name states are acceptance requirements.
Only explicitly allowlisted public fields are selectable or emitted through Realtime: card public ID/name/slug/description/sanitized image/count/activity/status-safe projection; message public ID/card public ID/current optional nickname/plain text or null removal placeholder/published timestamp/public status/version; and sanitized platform cadence/availability/degraded flags. Session/receipt IDs, nickname history, queue/report/abuse/audit data, moderation rationale, enqueue timing, private primary keys, and admin data never cross the public boundary.
Report lifecycle is `open -> reviewing -> resolved|dismissed`; a resolution can remove or retain content and must include a reason. Removed messages keep a stable public row/URL with content nulled and the Portuguese notice “Mensagem removida pela moderação”; hidden/archived/deleted cards disappear publicly while remaining recoverable internally until retention purge. Every moderation transition is transactional with an append-only audit event.
The final handoff inventory is mandatory: complete source app, `DESIGN.md`, Supabase migrations/RLS/pgTAP/seed, Redis Lua and QStash configuration, `.env.example`, local README, deployment/operations runbook, first-admin CLI instructions, technical decisions, CI workflows, Portuguese rules/terms/privacy/accessibility pages, automated test reports, visual/performance/security evidence, and observability/alert configuration.
Release evidence must be independently reproducible from CI artifacts against isolated real services and browsers. It must prove: no two committed messages have `published_at` less than five seconds apart; concurrent submissions from one session create at most one pending row; duplicate/late QStash deliveries create at most one public message; Redis unavailability creates no anonymous session/enqueue/outbox state; anon/authenticated clients cannot read private-schema data or private fields through SQL, API, or Realtime; and CSRF failures, expired reauthentication, reused TOTP steps, forged worker signatures, direct writes, and unknown outcomes are safely rejected/reconciled. Grep, screenshots alone, mocks alone, Redis-only tests, worker self-report, or undeclared manual checks never satisfy a correctness gate.
Initial server-enforced anti-abuse defaults are fixed: global publication 1 per 5 seconds; anonymous session 3 accepted messages per 10 minutes; trusted-ingress IP tag 5 accepted messages per 10 minutes; one active pending item per session; identical normalized content blocked for 30 minutes per session/IP tag; at most one safe HTTP(S) URL per message; report limits 5/hour per session and 15/hour per IP tag; admin login 5 attempts/15 minutes per account and IP with exponential backoff and adaptive Turnstile.
Security-retention defaults are fixed and disclosed: pending/rejected/expired queue payloads 30 days; IP/session abuse buckets and security telemetry 72 hours unless escalated into an incident; removed message originals 90 days in private recovery storage; expired/revoked admin-session metadata 90 days; resolved reports 1 year; append-only admin audit 2 years. Public content remains until moderation/deletion policy applies. Retention jobs are idempotent, audited, and tested.
Card images are administrator-only: upload directly to a private staging bucket through a short-lived signed URL, accept only bounded raster formats, verify magic bytes/dimensions, strip metadata and re-encode, then publish a generated derivative to a deliberately public read bucket. No external malware-scanning service is a release dependency; bounded raster decoding, magic-byte/dimension validation, metadata stripping, and server-side re-encoding are the acceptance gate. SVG, PDF, polyglots, oversize images, and any decode/transform failure never become public.
Use Vercel Firewall/Bot Management as the WAF equivalent and Cloudflare Turnstile only for adaptive challenges; do not add a second CDN/proxy trust boundary. Production trusts only Vercel’s documented ingress IP metadata and rejects/ignores browser-forged forwarding headers.

## Scope IN
Complete responsive public app, card/message features, optional anonymous nickname, Realtime updates, moderation/reporting, secure admin control plane, Redis-backed global and auxiliary limits, observability, Supabase migrations/RLS/seed, legal/community pages, CI, tests, and Vercel/Supabase/Upstash deployment documentation.

## Scope OUT (Must NOT have)
No real-person seed data or unapproved personal data.
No administrative secret, service-role key, raw abuse identifier, or authorization claim exposed to browser code.
No direct HTML rendering of visitor content.
No frontend-only authorization or rate limiting.
No copied third-party branding, proprietary fonts, logos, or trademark assets.
No public visitor profiles, account registration, social login, moderator role, or self-service message deletion.
No spoofable “usuários online” counter presented as trustworthy data.
No claim of legal compliance or true anonymity: the deliverable provides baseline Portuguese terms/privacy disclosures and explicitly describes short-lived pseudonymous abuse processing; legal counsel remains an external deployment responsibility.
No exact queue-position promise or exactly-once Realtime delivery promise; position is approximate and clients reconcile missed/duplicate/out-of-order events from Postgres.
No implementation in this planning session.

## Open questions
None. Collection, falsification, architecture design, and final adversarial scope/security reviews are complete; all blocking corrections are recorded above.

## Approval gate
status: approved-and-written
approach: Write one XL, full-scope, dependency-ordered work plan for the six confirmed components. The plan will use TDD, exact file targets, atomic commits, real-service/browser QA evidence, and final compliance/code-quality/manual-QA/scope-fidelity verification; it will not implement product code.
next-action: User chooses execution in a separate worker session with `$start-work lendas-do-dc` (optionally `--worktree`, `--make-pr`, or `--ship`) or requests the optional dual high-accuracy plan review first.
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
