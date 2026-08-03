# lendas-do-dc - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** Uma aplicação completa, responsiva e pronta para implantação: cards pesquisáveis, mensagens anônimas em fila justa, atualização em tempo real, denúncias, administração protegida, moderação, observabilidade, documentação e testes reproduzíveis.

**Why this approach:** A fila durável evita que uma pessoa monopolize as janelas globais; o banco decide atomicamente cada publicação, enquanto o Redis bloqueia falhas e coordena a cadência. A separação entre dados públicos e privados reduz drasticamente o risco de vazamentos.

**What it will NOT do:** Não criará contas públicas, perfis, moderadores, exclusão pelo autor ou contador de usuários online. Não prometerá anonimato absoluto, posição exata na fila ou entrega infalível em tempo real. Não copiará identidade visual de terceiros nem usará dados reais na demonstração.

**Effort:** XL
**Risk:** High - coordenação distribuída, autenticação administrativa própria e várias fronteiras de segurança precisam permanecer corretas durante falhas parciais.
**Decisions to sanity-check:** Visitantes anônimos; fila com publicação global a cada cinco segundos; CAPTCHA apenas após risco; administração com senha e TOTP; hospedagem principal em São Paulo; conteúdo removido mantém um aviso público sem o texto original.

Seu próximo passo: iniciar a execução em uma sessão de trabalho separada ou solicitar antes a revisão dupla de alta precisão. Os detalhes completos seguem abaixo.

---

> TL;DR (machine): XL/high-risk greenfield Next.js delivery with anonymous fair queue, Postgres-authoritative 5s cadence, Redis/QStash coordination, RLS-safe Realtime, hardened admin, full evidence and cloud handoff.

## Scope
### Must have
- A greenfield, Git-tracked Next.js 16 App Router application using React 19, TypeScript strict mode, pnpm, Tailwind CSS 4, shadcn/ui, Zod, React Hook Form, Supabase, Upstash Redis/QStash, Vitest, pgTAP, Playwright, Biome, and Vercel.
- A project-original `DESIGN.md`, primitive showcase, responsive dark editorial card-first public UI, WCAG 2.2 AA accessibility, Portuguese copy, and real-browser visual/performance evidence.
- Public routes for card discovery, card details/messages, community rules, terms, privacy, accessibility, 404, and recoverable errors; admin routes for login, dashboard, cards, messages, reports, queue, abuse/security, settings, and audit.
- Anonymous visitors only: no public registration or account. Optional nickname is unverified, normalized, plain text, and limited to 30 grapheme clusters; absent nickname displays “Anônimo”.
- Public card search (case/accent-insensitive), recent/commented/alphabetical sorting, cursor pagination, safe optional images/initial avatars, message counts, and last activity.
- A durable actor-alternating FIFO queue with one active pending item per server-issued anonymous session, ten-minute pending expiry, approximate position, QStash delayed delivery, permanent Postgres idempotency, and a minute-level rescue path.
- Global publication cadence of at most one committed message every five seconds by default. Redis is a mandatory fail-closed admission/fence layer; a serial Postgres singleton-gate transaction is the final authority.
- Supplemental server limits: session 3 accepted messages/10m, trusted-ingress IP tag 5/10m, duplicate text block 30m, one safe HTTP(S) URL/message, report 5/hour/session and 15/hour/IP tag, admin login 5 attempts/15m/account+IP.
- Adaptive, server-verified Turnstile after suspicious behavior; no low-risk always-on CAPTCHA. All challenge failures/replays/outages fail closed once challenge is required.
- Public-safe Supabase `api` schema with anon SELECT-only RLS and allowlisted Realtime fields; unexposed `private` schema for queue, reports, credentials, sessions, abuse, audit, retention, and idempotency.
- Separate server-only administration secured by Argon2id, mandatory TOTP, one-time recovery codes, opaque rotated sessions, CSRF synchronizer tokens, 15-minute reauthentication, brute-force controls, and CLI-only bootstrap/recovery.
- Card CRUD/archive/restore/delete, raster image quarantine/validation/re-encoding, report lifecycle, message soft removal/restoration, user-visible removal placeholders, emergency mode, temporary cadence increases, and append-only transactional audit.
- Structured privacy-minimized telemetry, metrics/alerts, retention jobs, operational dashboard, Vercel Firewall/Bot controls, health/degraded states, and fail-closed mutation behavior while public reads remain available.
- Complete migrations, grants, constraints, indexes, RLS, pgTAP policies, fictional seed, `.env.example`, local README, deployment/operations runbook, first-admin instructions, technical decisions, CI, and immutable-preview smoke evidence.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No public profiles, registration, email/password/social login, moderator role, public avatar uploads, author-owned deletion, or per-user-account cooldown.
- No generic chronological feed replacing the home card grid; no spoofable users-online indicator; no pre-moderation requirement that blocks the automatic fair queue.
- No real-person seed data, copied brand assets/tokens/fonts, trademarked imagery, emojis as icons, giant components, raw HTML/Markdown rendering, `dangerouslySetInnerHTML`, or user-supplied executable content.
- No administrative/service/QStash/Redis/Turnstile secret, raw IP, raw session token, receipt, private key, abuse identifier, internal primary key, or authorization claim in browser bundles, public API, Realtime, logs, analytics, screenshots, or test artifacts.
- No browser-direct writes, frontend-only rate limiting/authorization/CAPTCHA decisions, public RPC mutation grants, RLS bypass for ordinary reads, or trust in caller-supplied forwarded headers.
- No Redis-only correctness, multi-region eventual Redis as authority, `SKIP LOCKED` in the authoritative selector, early lock release after unknown outcomes, network calls inside publication transactions, exact queue-position promises, or exactly-once Realtime claims.
- No alternative queue/CDN/proxy/malware-scanner dependency, silent region substitution, production seed execution, destructive migration rollback, or staging resources shared with production without a new owner decision.
- No claim of true anonymity or legal compliance; legal pages provide baseline disclosures and explicitly describe temporary pseudonymous anti-abuse processing and need for counsel review.
- No file over 250 pure LOC without an approved `SIZE_OK` justification, `any`, unsafe assertions, swallowed errors, untyped environment reads, or implementation without a preceding failing test.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD (red → green → refactor) using Vitest for unit/component contracts, local Supabase/Postgres + pgTAP and a Redis-compatible service for integration, signed-wire fakes only at unavoidable external HTTP seams, and Playwright against production builds plus real staging contracts.
- Canonical local gate: `pnpm check && pnpm test:unit && pnpm test:db && pnpm test:integration && pnpm test:e2e`.
- Canonical release gate: `pnpm build && pnpm test:release`, followed by immutable-preview `pnpm test:smoke`; no retries on mandatory race/security smoke scenarios.
- Test isolation: `tests/support/test-env.mjs` derives `RUN_ID`, Supabase ports/project, database schema/fixture suffix, Redis key prefix, Realtime channel, QStash IDs, and artifact paths from the active worktree/session so concurrent workers never share mutable state.
- Clock policy: browser clocks are informational; Redis server TTL drives cooldown responses; Postgres `clock_timestamp()` sampled after the gate lock drives durable eligibility. Unit tests use injected clocks; one real five-second integration and deployed smoke contract remains wall-clock based.
- Required hard assertions: no committed `published_at` gap below 5000ms; one session cannot own two active queue rows; duplicate/late QStash deliveries create one message; Redis outage creates no anonymous session/enqueue/receipt/outbox; private fields never appear through SQL/API/Realtime; direct writes, forged worker signatures, CSRF failures, stale reauth, and reused TOTP steps fail.
- Evidence root: `<attemptDir>/task-{todo-number}-lendas-do-dc/`, where `attemptDir` is the active OMO attempt evidence directory; outside ulw-loop use `.omo/evidence/lendas-do-dc/`. Each task stores command log plus structured reports/traces/screenshots/network logs named in its QA scenarios.
- CI uploads JUnit/LCOV, pgTAP TAP, race JSON, Playwright HTML/traces/videos/screenshots, axe JSON, Lighthouse JSON/HTML, secret-scan/bundle manifest, migration digest, preview URL+commit SHA, and smoke report. Screenshots, grep, mocks, Redis-only tests, and worker self-report are never sufficient by themselves.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1 — repository/toolchain and test foundations: Todos 1–6.
- Wave 2 — design contract and database foundation: Todos 7–12.
- Wave 3 — trust-boundary and security primitives: Todos 13–18.
- Wave 4 — card-first public read experience: Todos 19–24.
- Wave 5 — anonymous admission and durable dispatch: Todos 25–30.
- Wave 6 — authoritative publication worker and recovery: Todos 31–36.
- Wave 7 — composer, queue UX, Realtime, and reconciliation: Todos 37–42.
- Wave 8 — reports, administration, moderation, and safe media: Todos 43–48.
- Wave 9 — retention, observability, hardening, and deployment: Todos 49–54.
- Wave 10 — full release evidence and handoff: Todos 55–60.

Workers may parallelize only items explicitly marked within a wave. Database contract and security-boundary changes land before any dependent API/UI. Each todo ends with its own atomic commit; generated lockfiles/migrations are committed with their owning task, never hand-edited.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | — | 2–6 | — |
| 2 | 1 | 13–18, 25–36, 53–54 | 3, 4, 5 |
| 3 | 1 | 12, 30, 36, 55–59 | 2, 4, 5 |
| 4 | 1, 3 | 55–60 | 2, 5 |
| 5 | 1 | 6, 19–24, 37–48, 52 | 2–4 |
| 6 | 5 | 20–24, 37–48, 52 | 7–8 after tokens freeze |
| 7 | 1–3 | 8–12, 25–36, 43–50 | 5–6 |
| 8 | 7 | 12, 19, 21–22, 31, 44 | 9–11 |
| 9 | 7 | 27–36, 38, 47–50 | 8, 10–11 |
| 10 | 7 | 16–18, 43, 46–50 | 8–9, 11 |
| 11 | 7–10 | 19, 29, 40–41, 45, 55 | 12 |
| 12 | 7–11, 3 | 19–60 | — |
| 13 | 2, 7 | 14–18, 25–30, 43–48, 51 | 14–15 |
| 14 | 2, 7, 13 | 15, 25–30, 37–39, 43 | 16 |
| 15 | 13–14 | 25–30, 43, 47, 51 | 16–18 |
| 16 | 2, 10, 13 | 17, 44–48, 57 | 14–15 |
| 17 | 13, 16 | 44–48, 51, 57 | 18 |
| 18 | 10, 13, 17 | 43–54 | — |
| 19 | 8, 11–12 | 20–24 | 25–26 |
| 20 | 5–6, 19 | 21–24, 37–42 | 25–26 |
| 21 | 6, 8, 19–20 | 55–56 | 22–24 |
| 22 | 6, 8, 19–20 | 37–43, 55–56 | 21, 23–24 |
| 23 | 6, 19–20 | 52, 55–56 | 21–22, 24 |
| 24 | 5–6, 20 | 52, 54, 56 | 21–23 |
| 25 | 8–15 | 27–30, 37, 43, 51 | 26 |
| 26 | 2–3, 9, 15 | 27–36, 38, 47, 55 | 25 |
| 27 | 9, 14–15, 25–26 | 28–30, 31, 37–39 | — |
| 28 | 13–15, 27 | 37–39, 55–56 | 29 |
| 29 | 2, 9, 11, 13, 27 | 31–36, 58 | 28 |
| 30 | 3, 25–29 | 31–36, 55 | — |
| 31 | 8–12, 26–30 | 32–36, 40–42 | — |
| 32 | 13, 26, 29–31 | 33–36, 58 | — |
| 33 | 26, 31–32 | 36, 38, 55 | 34–35 |
| 34 | 9, 26, 29, 31–32 | 36, 47, 49–50 | 33, 35 |
| 35 | 9, 26, 31 | 38, 40–42, 47–48 | 33–34 |
| 36 | 3, 30–35 | 37–42, 55–59 | — |
| 37 | 6, 22, 25, 28, 36 | 38–39, 42, 56 | 40–41 |
| 38 | 26, 28, 33, 35, 37 | 39, 42, 56 | 40–41 |
| 39 | 14, 28, 37–38 | 42, 56 | 40–41 |
| 40 | 11, 19–22, 31, 35–36 | 41–42, 56 | 37–39 |
| 41 | 8, 21–22, 31, 40 | 42, 56 | 37–39 |
| 42 | 20–23, 36–41 | 52, 56, 59 | — |
| 43 | 10, 13–15, 18, 22, 25 | 46, 55–57 | 44–45 |
| 44 | 6, 8, 16–18 | 45–48, 57 | 43 |
| 45 | 11, 13, 16–18, 44 | 54, 57 | 43 |
| 46 | 10, 17–18, 22, 43–44 | 48, 57 | 47 |
| 47 | 9–10, 17–18, 26, 34–35, 44 | 48, 50, 57 | 46 |
| 48 | 10, 17–18, 34–35, 44–47 | 50, 54, 57 | — |
| 49 | 9–12, 18, 34 | 50, 54–55 | 51 |
| 50 | 18, 34–35, 47–49 | 53–55, 59 | 51 |
| 51 | 13–18, 25–36, 43–50 | 52, 55–59 | — |
| 52 | 5–6, 20–24, 37–48, 51 | 55–59 | 53–54 |
| 53 | 2, 4, 11, 29, 50 | 54, 58–60 | 52 |
| 54 | 1–53 | 58–60 | — |
| 55 | 1–54 | 58–60 | 56–57 |
| 56 | 19–54 | 59–60 | 55, 57 |
| 57 | 16–18, 43–54 | 59–60 | 55–56 |
| 58 | 29–36, 51, 53–54 | 59–60 | 55–57 |
| 59 | 52–58 | 60 | — |
| 60 | 1–59 | Final verification | — |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Initialize Git and the pinned Next.js toolchain
  What to do / Must NOT do: Initialize Git; scaffold a `src/` Next.js 16.2 App Router project with React 19, Node 22 LTS (`.nvmrc`, `engines`), Corepack-managed pnpm 10, Tailwind 4, strict TypeScript, and a committed lockfile. Add `.gitignore` that preserves the existing `.codegraph/.gitignore` convention and excludes `.omo/` runtime/evidence where required. Configure Biome and the programming-skill strict TS flags/overrides for required Next default exports. Do not use npm/yarn, ESLint/Prettier, Pages Router, or edit a generated lockfile manually.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2–60
  References (executor has NO interview context - be exhaustive): `.omo/drafts/lendas-do-dc.md:38-48`; Next 16 requirements `https://nextjs.org/docs/app/guides/upgrading/version-16`; Tailwind Next setup `https://tailwindcss.com/docs/installation/framework-guides/nextjs`; programming TS rules loaded in planning.
  Acceptance criteria (agent-executable): `git rev-parse --is-inside-work-tree`, `node --version`, `pnpm --version`, `pnpm exec tsc --noEmit`, and `pnpm exec biome check .` all succeed; script asserts `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, and no product source exceeds 250 pure LOC.
  QA scenarios (name the exact tool + invocation): happy — run production `pnpm build`; failure — temporarily import a browser-forbidden Node module into a client fixture and verify type/build guard fails, then remove fixture. Evidence `<attemptDir>/task-1-lendas-do-dc/toolchain.log`.
  Commit: Y | `chore(init): scaffold strict Next.js application`

- [ ] 2. Define architecture boundaries and typed environment contracts
  What to do / Must NOT do: Create `src/lib/env/{public,server}.ts`, `src/lib/server-only/`, `src/lib/errors/`, `src/lib/ids/`, and architecture docs. Parse all environment variables once with Zod; brand semantic IDs/milliseconds; mark privileged modules `server-only`; model expected failures as exhaustive discriminated unions/typed errors. Add `.env.example` with names only. Never read `process.env` outside the environment module or prefix a secret with `NEXT_PUBLIC_`.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 13–18, 25–36, 53–54
  References: `.omo/drafts/lendas-do-dc.md:43-46,64-86`; Next environment docs `https://nextjs.org/docs/app/guides/environment-variables`; target `src/lib/env/`, `docs/ARCHITECTURE.md`.
  Acceptance criteria: `pnpm test:unit -- env` proves valid startup, missing-secret rejection, public/server separation, branded units, and redacted errors; `pnpm build` bundle manifest contains no server env names/values.
  QA scenarios: happy — boot with a complete test environment; failure — omit `UPSTASH_REDIS_REST_TOKEN` and assert mutation subsystem refuses startup without printing its value. Evidence `<attemptDir>/task-2-lendas-do-dc/env-contract.json`.
  Commit: Y | `feat(core): establish typed server boundaries`

- [ ] 3. Build worktree-isolated test infrastructure and evidence plumbing
  What to do / Must NOT do: Add Vitest, Playwright, pgTAP/Supabase CLI, a Redis-compatible test container, `tests/support/test-env.mjs`, deterministic clocks/barriers, and evidence reporters. Allocate unique ports, database fixtures, Redis prefixes, Realtime channels, QStash IDs, and artifact roots per `RUN_ID`; never use fixed shared paths/ports or sleeps as synchronization.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 12, 30, 36, 55–59
  References: `.omo/drafts/lendas-do-dc.md:85-89`; Metis gap analysis; Supabase test docs `https://supabase.com/docs/guides/local-development/testing/overview`; Playwright isolation `https://playwright.dev/docs/browser-contexts`.
  Acceptance criteria: two concurrent invocations of `pnpm test:env:start` report distinct ports/prefixes and both complete `pnpm test:env:smoke`; teardown leaves no containers/volumes/processes; reporters create the documented evidence tree.
  QA scenarios: happy — run two isolated smoke suites in parallel; failure — force the same requested port and verify allocator selects another port instead of colliding. Evidence `<attemptDir>/task-3-lendas-do-dc/isolation.json`.
  Commit: Y | `test(infra): add isolated real-service harness`

- [ ] 4. Establish CI and deterministic quality gates
  What to do / Must NOT do: Add GitHub Actions for install/frozen lock, Biome, strict typecheck, unit, Supabase/pgTAP, integration, production build, Playwright Chromium/mobile, artifact upload, preview smoke trigger, and dependency/secret scanning. Use service caching only for immutable package artifacts; do not cache mutable databases, reuse production credentials, or mark mandatory jobs allow-failure.
  Parallelization: Wave 1 | Blocked by: 1, 3 | Blocks: 55–60
  References: plan Verification strategy; target `.github/workflows/ci.yml`, `.github/workflows/deployed-smoke.yml`, `package.json` scripts.
  Acceptance criteria: `pnpm ci:validate` parses workflows and runs the same command graph locally; CI dry-run/lint shows all required jobs and artifact retention; a deliberately failing unit fixture blocks the workflow.
  QA scenarios: happy — execute the local CI composite command; failure — introduce a test secret matching the scanner fixture and assert the secret job fails, then remove it. Evidence `<attemptDir>/task-4-lendas-do-dc/ci-contract.json`.
  Commit: Y | `ci: add deterministic verification pipeline`

- [ ] 5. Research and author the project-original design system
  What to do / Must NOT do: Following the frontend greenfield gate, run embedded-reference shortlist, lazyweb screen research, and 2–3 concept drafts when tools are available; log genuine skips. Write root `DESIGN.md` with research log, atmosphere (“mural editorial noturno”), original black/charcoal/red OKLCH ramps, accessible semantic states, non-proprietary typography, 4px spacing, breakpoints, mixed tonal/subtle-shadow depth, motion, layout primitives, personas, WCAG 2.2 AA constraints, and accepted-debt register. Do not copy a brand, use proprietary fonts, generic gradient SaaS styling, or begin screens first.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 6, 19–24, 37–48, 52
  References: `.omo/drafts/lendas-do-dc.md:25-40`; frontend `design/README.md`, `design-system-architecture.md`, `designpowers/lane-a-direction.md`, `layout-skill.md` loaded during planning.
  Acceptance criteria: `pnpm design:lint` confirms all mandatory `DESIGN.md` sections/tokens/personas/states exist and no third-party brand/proprietary asset is adopted; contrast calculations meet 4.5:1 body and 3:1 large/control requirements.
  QA scenarios: happy — token validator and contrast report pass; failure — insert an undeclared hex and inaccessible red/text pair in a fixture and verify lint fails. Evidence `<attemptDir>/task-5-lendas-do-dc/design-system.json`.
  Commit: Y | `docs(design): define Lendas do DC design system`

- [ ] 6. Implement and visually verify the primitive showcase
  What to do / Must NOT do: Install configured shadcn/Radix primitives and Phosphor/Radix icons; implement small reusable Button, Input, Textarea, Select, Dialog, AlertDialog, Toast, Avatar, Badge, Skeleton, Progress, EmptyState, ErrorState, layout primitives, and `/dev/showcase` gated to non-production. Exercise default/hover/active/focus/disabled/loading/error/empty/long-content/reduced-motion states before product screens. Do not use emojis, raw token values, giant wrappers, or ship showcase in production.
  Parallelization: Wave 1 | Blocked by: 5 | Blocks: 20–24, 37–48, 52
  References: `DESIGN.md`; frontend primitive showcase gate; target `src/components/ui/`, `src/components/system/`, `src/app/dev/showcase/page.tsx`.
  Acceptance criteria: `pnpm test:unit -- primitives` and `pnpm exec playwright test tests/e2e/showcase.spec.ts` pass at 375/768/1280px with axe, keyboard, content-stress, and production-route absence assertions.
  QA scenarios: happy — capture all states at three widths; failure — long unbroken text and 200% zoom produce no primary horizontal overflow or focus clipping. Evidence `<attemptDir>/task-6-lendas-do-dc/showcase/`.
  Commit: Y | `feat(ui): establish accessible primitive system`

- [ ] 7. Create database schemas, extensions, enums, and migration safety contract
  What to do / Must NOT do: Add ordered Supabase SQL migrations for dedicated exposed `api` and unexposed `private` schemas; required extensions (`pgcrypto`, `citext`, `unaccent`, `pg_trgm` where supported); enums/status domains; ownership/default-privilege revocations; `updated_at` helpers; migration ledger. Add forward-fix/expand-contract policy. Never expose `private`, depend on destructive down migrations, or grant functions to PUBLIC by default.
  Parallelization: Wave 2 | Blocked by: 1–3 | Blocks: 8–12, 25–36, 43–50
  References: `.omo/drafts/lendas-do-dc.md:43,64-66`; Supabase API security `https://supabase.com/docs/guides/api/securing-your-api`; target `supabase/migrations/`.
  Acceptance criteria: fresh `pnpm supabase db reset --local` and replay over a previous fixture succeed; catalog pgTAP asserts only `api` is exposed, private grants are absent, function search paths are fixed, and migration ordering/digest is stable.
  QA scenarios: happy — fresh install and forward upgrade; failure — add a fixture function with PUBLIC execute/default search path and assert pgTAP blocks it. Evidence `<attemptDir>/task-7-lendas-do-dc/migrations.tap`.
  Commit: Y | `feat(db): establish public and private schemas`

- [ ] 8. Model cards, messages, search, slugs, and public aggregates
  What to do / Must NOT do: Create `api.cards`, `api.card_slug_aliases`, and `api.messages` with public UUIDs, constraints, statuses, descriptions, sanitized image metadata, optional nickname, nullable content for removed placeholders, versions, timestamps, message count, last activity, and audit-friendly soft-delete fields. Add case/accent-insensitive search/trigram indexes, unique slugs/aliases, cursor indexes, aggregate-maintenance functions, and stable old-slug redirects. Keep removed original content out of public rows.
  Parallelization: Wave 2 | Blocked by: 7 | Blocks: 12, 19, 21–22, 31, 44
  References: `.omo/drafts/lendas-do-dc.md:82-86`; user card/message model summarized in draft; target `supabase/migrations/*_public_content.sql`.
  Acceptance criteria: pgTAP proves FK/check/unique/index/soft-delete invariants, search ignores case/diacritics, cursor ordering is stable, aggregate updates are transactional, long names remain data-valid, and removed public message content is null.
  QA scenarios: happy — create/update/archive/restore/search cards and publish/remove a message; failure — duplicate slug, 501st content grapheme, invalid status, or removed row retaining public content is rejected. Evidence `<attemptDir>/task-8-lendas-do-dc/content-schema.tap`.
  Commit: Y | `feat(db): model cards and public messages`

- [ ] 9. Model the fair queue, publication gate, idempotency, and transactional outbox
  What to do / Must NOT do: Create private queue items with monotonic committed `enqueue_seq`, session/IP/content HMAC metadata and key version, receipt/idempotency hashes, statuses/versions, expiry, rejection code, published message FK, attempt data; singleton publication gate with last published timestamp/session and interval; processed QStash deliveries; dispatch outbox; platform-safe projection. Enforce one active pending/processing row per session. Do not use a Postgres sequence as proof of commit order without serialization, `SKIP LOCKED`, or Redis state as durable truth.
  Parallelization: Wave 2 | Blocked by: 7 | Blocks: 27–36, 38, 47–50
  References: `.omo/drafts/lendas-do-dc.md:45-47,67-75`; PostgreSQL row locking/time docs cited in research; target `supabase/migrations/*_queue.sql`.
  Acceptance criteria: pgTAP and two-connection SQL test prove committed enqueue ordering, one-active-item uniqueness, singleton gate serialization, permanent idempotency, actor-alternating candidate query, no `SKIP LOCKED`, and valid state transitions.
  QA scenarios: happy — enqueue A1/B1 then select A/B alternately; failure — simultaneous A2/A3 or duplicate delivery key produces one durable row/result. Evidence `<attemptDir>/task-9-lendas-do-dc/queue-schema-race.json`.
  Commit: Y | `feat(db): add fair publication queue`

- [ ] 10. Model reports, admin credentials, security telemetry, and append-only audit
  What to do / Must NOT do: Create private report lifecycle/reasons exactly matching the brief, encrypted TOTP metadata/key version, Argon2id credential metadata, recovery codes, session/revocation/reauth/TOTP-step state, abuse buckets/blocks, security events, alert outbox, moderation archive, retention ledger, and append-only admin audit. Use redacted metadata schemas and transactional mutation helpers. Never store raw password, TOTP/recovery code, IP, cookie, user message body in logs, or allow application UPDATE/DELETE of audit rows.
  Parallelization: Wave 2 | Blocked by: 7 | Blocks: 16–18, 43, 46–50
  References: `.omo/drafts/lendas-do-dc.md:76-83,88-93`; OWASP password/session/CSRF guidance cited in draft research; target `supabase/migrations/*_private_security.sql`.
  Acceptance criteria: pgTAP proves state transitions, one open report/session/message, atomic recovery-code consumption/TOTP-step monotonicity, audit append-only grants/triggers, redaction checks, and configured retention timestamps.
  QA scenarios: happy — resolve a report with audit in one transaction; failure — force audit insert failure and assert moderation rollback, or reuse recovery/TOTP step and assert rejection. Evidence `<attemptDir>/task-10-lendas-do-dc/security-schema.tap`.
  Commit: Y | `feat(db): add moderation and security records`

- [ ] 11. Enforce RLS, grants, safe Realtime publication, and Storage policies
  What to do / Must NOT do: Enable/FORCE RLS on all exposed tables; grant anon SELECT only on allowlisted public columns/rows; no public DML; revoke private/schema/RPC access; create `security_invoker` projections only when needed; add only `api.cards`, redacted `api.messages`, and sanitized platform state to Realtime. Create private image staging and deliberately public derivative buckets with admin-server-only write policies. Do not broadcast queue/report/admin/abuse data or assume public Storage reads are RLS-protected.
  Parallelization: Wave 2 | Blocked by: 7–10 | Blocks: 19, 29, 40–41, 45, 55
  References: `.omo/drafts/lendas-do-dc.md:43,64-66,75,86,92`; Supabase RLS `https://supabase.com/docs/guides/database/postgres/row-level-security`; Storage buckets `https://supabase.com/docs/guides/storage/buckets/fundamentals`.
  Acceptance criteria: pgTAP with anon/authenticated/service roles proves allowed reads, denied direct writes/private reads/RPCs, deleted/internal field absence, safe Realtime publication membership, and denied staging access; browser publishable-key integration returns only allowlisted fields.
  QA scenarios: happy — anon reads visible cards/messages and public derivative; failure — query private queue, removed original content, receipt, staging object, or mutation and receive denial/no rows. Evidence `<attemptDir>/task-11-lendas-do-dc/rls-storage.tap`.
  Commit: Y | `feat(db): lock public data boundaries`

- [ ] 12. Add deterministic fictional seed, generated database types, and baseline database suite
  What to do / Must NOT do: Create idempotent local-only seed with at least 18 clearly fictional cards (including no-image, long-name, empty, active, archived fixtures) and enough fictional messages to exercise pagination/sorts/removal; generate strict TypeScript DB types; add full pgTAP runner and production-seed guard. Never use the user’s example names unless documented fictional, seed credentials/secrets/security data, or run demo seed in production.
  Parallelization: Wave 2 | Blocked by: 3, 7–11 | Blocks: 19–60
  References: `.omo/drafts/lendas-do-dc.md:84,88,91`; target `supabase/seed.sql`, `src/types/database.generated.ts`, `supabase/tests/`.
  Acceptance criteria: two consecutive local resets yield identical public fixture counts/content hashes; `pnpm db:types:check` detects generated-type drift; `ENVIRONMENT=production pnpm db:seed` refuses; all pgTAP tests pass.
  QA scenarios: happy — seed/reset/search/sort fixtures; failure — fixture containing a real-person marker, credential field, or production environment is blocked. Evidence `<attemptDir>/task-12-lendas-do-dc/seed-db-report.json`.
  Commit: Y | `test(db): add fictional seed and database contracts`

- [ ] 13. Centralize mutation guards, response contracts, and browser security headers
  What to do / Must NOT do: Implement one typed server wrapper for every unsafe HTTP method/server mutation: HTTPS/host, body size/content type, exact Origin and Fetch Metadata, session context, rate-limit reservation, optional Turnstile, authorization, idempotency, transaction/audit, and typed JSON errors. Add CSP nonce policy, HSTS, nosniff, referrer/permissions/frame protections and strict no-store admin/error responses. Exempt only signature-verified QStash and secret-verified rescue routes. No state-changing GET or permissive CORS/unsafe-inline fallback.
  Parallelization: Wave 3 | Blocked by: 2, 7 | Blocks: 14–18, 25–30, 43–48, 51
  References: `.omo/drafts/lendas-do-dc.md:76-83,92`; Next CSP `https://nextjs.org/docs/app/guides/content-security-policy`; OWASP CSRF guidance cited in research; target `src/lib/security/mutation-guard.ts`, `src/proxy.ts`.
  Acceptance criteria: unit/static route-enumeration tests prove every mutation is wrapped; `curl`/Playwright tests assert headers, no wildcard credential CORS, bad Origin/Sec-Fetch rejection, QStash exemption only with signature, and no handler invocation after guard failure.
  QA scenarios: happy — same-origin guarded test mutation succeeds; failure — cross-origin form, missing CSRF admin request, oversized body, and unsigned worker are rejected with no DB change. Evidence `<attemptDir>/task-13-lendas-do-dc/mutation-guard.json`.
  Commit: Y | `feat(security): centralize mutation boundaries`

- [ ] 14. Implement opaque anonymous sessions and privacy-preserving ingress identity
  What to do / Must NOT do: Issue a server-generated 256-bit `__Host-lddc_anon` HttpOnly/Secure/SameSite=Lax cookie only after the Redis fail-closed precondition; hash with domain-separated HMAC/key version; define 7-day idle/30-day absolute expiry and rotation; derive IP tags only from Vercel’s documented trusted ingress metadata; support current+previous keys through bucket retention. Missing/malformed session on mutation must not silently mint after Redis failure. No fingerprinting or trust in JSON/X-Forwarded-For.
  Parallelization: Wave 3 | Blocked by: 2, 7, 13 | Blocks: 15, 25–30, 37–39, 43
  References: `.omo/drafts/lendas-do-dc.md:29-35,77-81`; OWASP session entropy/rotation guidance; Vercel request headers current docs; target `src/lib/security/anonymous-session.ts`, `src/lib/security/abuse-identity.ts`.
  Acceptance criteria: `pnpm test:integration -- anonymous-session` proves entropy/cookie flags, expiry/rotation/revocation, current+previous HMAC continuity, raw-token/IP absence, forged forwarded-header rejection, and zero session state during Redis outage.
  QA scenarios: happy — first eligible enqueue receives one opaque cookie reused across tabs; failure — forged cookie/header, retired key, or Redis timeout returns safe error and creates no durable state. Evidence `<attemptDir>/task-14-lendas-do-dc/anonymous-session.json`.
  Commit: Y | `feat(security): add anonymous session boundary`

- [ ] 15. Implement layered abuse limits, duplicate/link defenses, and adaptive Turnstile
  What to do / Must NOT do: Build atomic Upstash limit adapters/Lua for attempt and accepted quotas, one-pending gate input, duplicate normalized-content 30m keys, session/IP blocks, suspicious session-churn metrics, URL parser/one-link rule, and adaptive Turnstile challenge tickets. Verify Siteverify server-side with expected hostname/action/cdata/session/idempotency, single-use semantics and bounded timeout. Enforce fixed limits from Scope. Do not use IP as identity, regex-only URL security, or accept a new idempotency key to bypass challenge.
  Parallelization: Wave 3 | Blocked by: 13–14 | Blocks: 25–30, 43, 47, 51
  References: `.omo/drafts/lendas-do-dc.md:78-81,88-93`; Turnstile validation `https://developers.cloudflare.com/turnstile/get-started/server-side-validation/`; Upstash rate-limit docs.
  Acceptance criteria: `pnpm test:integration -- abuse` covers exact N/N+1 concurrent limits, Retry-After, duplicate/link/session-churn escalation, valid/invalid/expired/replayed/wrong-host/action/timeout Turnstile, and no mutation on Redis/Turnstile required-path outage.
  QA scenarios: happy — low-risk first enqueue proceeds without challenge then suspicious threshold returns challenge and valid token proceeds; failure — replayed token/new idempotency key remains blocked. Evidence `<attemptDir>/task-15-lendas-do-dc/abuse-turnstile.json`.
  Commit: Y | `feat(security): enforce anonymous abuse controls`

- [ ] 16. Implement CLI-only administrator bootstrap, Argon2id, TOTP, and recovery
  What to do / Must NOT do: Add interactive `pnpm admin:bootstrap`, `admin:rotate-password`, `admin:rotate-totp`, and `admin:break-glass` commands using the server secret and service-only RPCs. Hash passwords with Argon2id at OWASP minimum or stronger, encrypt TOTP seed with versioned server key, enforce 30s ±1 step and transactional replay counter, generate ten ≥128-bit one-time recovery codes stored hashed, and print QR/codes once. No web registration, password args/history, default credentials, or secret logging.
  Parallelization: Wave 3 | Blocked by: 2, 10, 13 | Blocks: 17, 44–48, 57
  References: `.omo/drafts/lendas-do-dc.md:32,58,76-83`; OWASP Password Storage/TOTP research; target `scripts/admin/*.ts`, service-only RPC migrations.
  Acceptance criteria: CLI integration on isolated DB proves single initial admin, policy parameters, encrypted seed, one-time recovery, replay rejection, session revocation after recovery, idempotent refusal when admin exists, and redacted output.
  QA scenarios: happy — bootstrap, scan fixture TOTP, consume one recovery code; failure — weak password, reused step/code, second bootstrap, or missing encryption key leaves DB unchanged. Evidence `<attemptDir>/task-16-lendas-do-dc/admin-bootstrap.json`.
  Commit: Y | `feat(admin): add secure bootstrap and MFA`

- [ ] 17. Implement opaque admin sessions, CSRF, rotation, revocation, and reauthentication
  What to do / Must NOT do: Create password→TOTP login flow and separate 256-bit `__Host-lddc_admin` SameSite=Strict session, store only HMAC, enforce 30m idle/8h absolute lifetime, rotate after MFA/every 15m/recovery, atomically revoke predecessors, issue server synchronizer CSRF token, require password+fresh non-replayed TOTP assurance ≤15m for every mutation, and apply account+IP exponential limits/adaptive challenge. Never elevate anonymous sessions or put claims in cookies.
  Parallelization: Wave 3 | Blocked by: 13, 16 | Blocks: 44–48, 51, 57
  References: `.omo/drafts/lendas-do-dc.md:76-83`; Next cookie/auth docs `https://nextjs.org/docs/app/guides/authentication`; target `src/features/admin-auth/`, `src/app/api/admin/auth/`.
  Acceptance criteria: integration tests prove uniform credential errors/timing band, password/TOTP/recovery flows, cookie attributes, rotation, predecessor rejection, idle/absolute expiry, CSRF, stale reauth, account/IP throttling and Turnstile escalation.
  QA scenarios: happy — password+TOTP creates session and fresh mutation succeeds; failure — session fixation, reused TOTP, stale assurance, missing CSRF, or revoked cookie returns 401/403 with no side effect. Evidence `<attemptDir>/task-17-lendas-do-dc/admin-session.json`.
  Commit: Y | `feat(admin): secure administrative sessions`

- [ ] 18. Add privacy-minimized structured logging, transactional audit, and alert delivery primitives
  What to do / Must NOT do: Configure Pino server-only structured logs with stable messages/request IDs and redaction; create typed security/operational event schemas, transactional admin/security audit outbox, generic signed `ALERT_WEBHOOK_URL` adapter with retries/dedupe, and fail-closed policy for exhausted privileged audit queue. Log decisions at boundaries, never content/secrets/raw identifiers or inside pure helpers.
  Parallelization: Wave 3 | Blocked by: 10, 13, 17 | Blocks: 43–54
  References: `.omo/drafts/lendas-do-dc.md:83-93`; programming logging rules; OWASP logging evidence from research; target `src/lib/observability/`, `src/lib/audit/`.
  Acceptance criteria: unit/integration tests assert schemas/redaction, mutation+audit atomicity, signed alert retry/dedupe, secret-pattern absence, and safe behavior when audit/alert sinks fail; consumer-routed log levels documented.
  QA scenarios: happy — audited admin test action emits redacted event+alert; failure — force audit insertion failure and verify mutation rollback, then force webhook outage and verify durable retry without secret leakage. Evidence `<attemptDir>/task-18-lendas-do-dc/observability-primitives.json`.
  Commit: Y | `feat(observability): add redacted audit and alerts`

- [ ] 19. Implement typed public card/message query services and cache policy
  What to do / Must NOT do: Create publishable-key Supabase clients and server query modules for card search, sort, cursor pagination, slug/alias resolution, visible/redacted messages, counts/activity, and platform state. Use Zod to parse DB responses/generated types, cache/tag only public data, and invalidate after trusted writes. Never use the secret key for ordinary public reads or cache private/user-specific results.
  Parallelization: Wave 4 | Blocked by: 8, 11–12 | Blocks: 20–24
  References: `.omo/drafts/lendas-do-dc.md:43-47,82-86`; Next Server Components/cache docs; target `src/features/cards/queries.ts`, `src/lib/supabase/{browser,public-server}.ts`.
  Acceptance criteria: `pnpm test:integration -- public-queries` proves case/accent search, all three sorts, stable cursor boundaries, alias redirect, removed placeholder, published-only visibility, cache invalidation, and publishable-key RLS enforcement.
  QA scenarios: happy — paginate/search seeded cards and messages without duplicates; failure — malformed cursor/private row/archived card cannot leak and returns typed Portuguese-safe outcome. Evidence `<attemptDir>/task-19-lendas-do-dc/public-queries.json`.
  Commit: Y | `feat(cards): add safe public queries`

- [ ] 20. Build the responsive public shell, header, navigation, and shared search placement
  What to do / Must NOT do: Implement public root layout/Header/logo, login-free anonymous state, server-verified admin link visibility, responsive single SearchBar rendered in header on desktop/main content on mobile, legal footer, skip link, connection/degraded banner region, and semantic landmarks. Keep Server Components dominant and client leaves small. No duplicate simultaneous search controls, fake online count, fixed mobile elements covering keyboard, or admin secret/claim in HTML.
  Parallelization: Wave 4 | Blocked by: 5–6, 19 | Blocks: 21–24, 37–42
  References: `DESIGN.md`; `.omo/drafts/lendas-do-dc.md:33,82,90-100`; target `src/app/(public)/layout.tsx`, `src/components/header/`.
  Acceptance criteria: component/Playwright tests at 375/768/1280 prove one search control, landmarks/skip link, keyboard/focus, admin-link visibility by server session, no horizontal overflow, and zero unnecessary client boundary at page root.
  QA scenarios: happy — keyboard navigate shell and responsive search; failure — anonymous forged client state cannot reveal/use admin route, long Portuguese labels reflow. Evidence `<attemptDir>/task-20-lendas-do-dc/public-shell/`.
  Commit: Y | `feat(ui): build public application shell`

- [ ] 21. Build the card-first home search, sorting, and progressive pagination
  What to do / Must NOT do: Implement `/` title/description, URL-backed search/sort, `CardGrid`, `PersonCard`, safe Next Image/initial avatar, optional description, count, localized last activity, “Abrir card”, Load More cursor flow, skeleton/empty/error/retry and long-name states. Default newest; support most-commented/alphabetical. Do not replace with message feed, truncate critical names without accessible full text, or retry unsafe actions.
  Parallelization: Wave 4 | Blocked by: 6, 8, 19–20 | Blocks: 55–56
  References: `.omo/drafts/lendas-do-dc.md:82`; `DESIGN.md`; target `src/app/(public)/page.tsx`, `src/features/cards/components/`.
  Acceptance criteria: Vitest/Playwright proves card-first DOM, URL state/deep links, all sorts/search, cursor no-duplicate behavior, image fallback, loading/empty/error/retry, 100-character stress name, keyboard/touch targets, and responsive grid.
  QA scenarios: happy — search “Neblína” accent-insensitively, sort, load more, open card; failure — network 500 shows Portuguese retry without destroying URL state. Evidence `<attemptDir>/task-21-lendas-do-dc/home-card-grid/`.
  Commit: Y | `feat(cards): deliver card-first discovery`

- [ ] 22. Build card detail and resilient public message list
  What to do / Must NOT do: Implement `/lendas/[slug]` with card metadata, created date, count, image/initial, description, newest-first cursor message list, optional nickname/generic avatar, local Brazilian dates, report/delete visibility rules (admin only), stable removed placeholder, empty/loading/error states, and alias redirects/404. Render text only; no auto-linking/raw HTML.
  Parallelization: Wave 4 | Blocked by: 6, 8, 19–20 | Blocks: 37–43, 55–56
  References: `.omo/drafts/lendas-do-dc.md:34-35,82-83,86`; target `src/app/(public)/lendas/[slug]/`, `src/features/messages/components/`.
  Acceptance criteria: tests prove visible/removed states, nickname/Anônimo, local timezone formatting without hydration mismatch, pagination, empty/error, 500-char/unbroken text wrapping, alias redirect, hidden card 404, keyboard report entry, and no HTML node creation from payloads.
  QA scenarios: happy — open seeded card and paginate messages; failure — `<script>`/bidi/long URL fixture renders safely or is absent, removed content never appears in DOM/network. Evidence `<attemptDir>/task-22-lendas-do-dc/card-detail/`.
  Commit: Y | `feat(messages): add public card conversations`

- [ ] 23. Implement shared loading, error, retry, localization, and route fallbacks
  What to do / Must NOT do: Add route loading/error/not-found boundaries, reusable safe-GET retry with abort/timeouts/backoff, PT-BR date/plural helpers using user timezone, offline/slow-connection states, accessible toasts/status regions, and reduced-motion transitions. Never auto-retry mutations with a new idempotency key, expose raw errors, or leave English fallback copy.
  Parallelization: Wave 4 | Blocked by: 6, 19–20 | Blocks: 52, 55–56
  References: user UX requirements in `.omo/drafts/lendas-do-dc.md:87-100`; target `src/app/**/{loading,error,not-found}.tsx`, `src/lib/i18n/`, `src/lib/http/`.
  Acceptance criteria: unit/Playwright tests with `pt-BR` and three timezones prove dates/plurals, abort/retry policy, safe errors, offline/slow banners, focus restoration, no English text, and reduced-motion compliance.
  QA scenarios: happy — transient safe GET retries and recovers; failure — persistent 500/offline shows actionable Portuguese state without retrying POST. Evidence `<attemptDir>/task-23-lendas-do-dc/error-localization/`.
  Commit: Y | `feat(ux): add resilient Portuguese states`

- [ ] 24. Publish community, terms, privacy, and accessibility pages
  What to do / Must NOT do: Add Portuguese pages with all required community rules/reporting, automatic fair-queue explanation, no-public-account/optional-nickname disclosure, temporary pseudonymous HMAC/IP/session processing and retention, Supabase/Upstash/Vercel/Turnstile subprocessors, moderation/removal, contact from validated public env, baseline terms/privacy, and accessibility commitment. Clearly state no guaranteed anonymity/publication/legal compliance. Do not use placeholders or claim counsel approval.
  Parallelization: Wave 4 | Blocked by: 5–6, 20 | Blocks: 52, 54, 56
  References: `.omo/drafts/lendas-do-dc.md:90-100`; required rules/reasons in user brief; target `src/app/(legal)/`, `docs/LEGAL_REVIEW.md`.
  Acceptance criteria: content contract tests assert every required rule/reason/retention/contact/disclaimer section, metadata/canonical links, heading hierarchy, keyboard/axe, and no placeholder/English/legal-guarantee phrases.
  QA scenarios: happy — navigate all legal/community pages on mobile/desktop; failure — missing contact env blocks production build rather than shipping placeholder. Evidence `<attemptDir>/task-24-lendas-do-dc/legal-pages/`.
  Commit: Y | `docs(web): publish community and privacy policies`

- [ ] 25. Implement canonical message/nickname/report parsers and plain-text policy
  What to do / Must NOT do: Create shared Zod boundary schemas and pure normalization: NFC/NFKC decision documented, trim/collapse excess horizontal whitespace while preserving bounded paragraphs, reject unsafe C0/C1/bidi/invisible abuse, count grapheme clusters (message 1–500, nickname 1–30, report details bounded), nickname visual-spoof checks, URL parsing and suspicious-link policy, normalized duplicate hash. Parse once at boundary and store/render plain text. Do not “sanitize” by accepting HTML/Markdown or use regex as the sole URL/parser.
  Parallelization: Wave 5 | Blocked by: 8–15 | Blocks: 27–30, 37, 43, 51
  References: `.omo/drafts/lendas-do-dc.md:30,78,88-93`; target `src/features/messages/schemas.ts`, `src/lib/text/`.
  Acceptance criteria: property/fixture Vitest covers Unicode graphemes, whitespace, zero-width/bidi controls, 0/1/30/31/500/501 boundaries, safe/unsafe URLs, duplicate canonicalization, HTML/script literal, and Portuguese field errors.
  QA scenarios: happy — normalize accented Portuguese multiline text and optional nickname; failure — invisible-only nickname, 501 graphemes, punycode/shortener/private-host URL, HTML/script are rejected with no persistence. Evidence `<attemptDir>/task-25-lendas-do-dc/text-policy.json`.
  Commit: Y | `feat(messages): define trusted text boundaries`

- [ ] 26. Implement Redis Lua contracts for admission, processing fence, cooldown, TTL, and dynamic limits
  What to do / Must NOT do: Add server-only Upstash adapter and versioned Lua scripts that atomically reserve quotas/challenges, acquire processing fence plus `global:message-cooldown` owner token, return Redis server time/max PTTL, verify/renew owner before commit, and atomically convert owner fence to configured cooldown after commit. Set fence/precommit TTL strictly above bounded DB+network timeout; compare token before any change; ambiguous/failure leaves tokens. Add dynamic interval/emergency keys as caches only. Never pipeline dependent operations, `DEL` blindly, or authorize from local memory.
  Parallelization: Wave 5 | Blocked by: 2–3, 9, 15 | Blocks: 27–36, 38, 47, 55
  References: `.omo/drafts/lendas-do-dc.md:45-46,66,73-75,88`; Upstash SET/Lua/PTTL docs cited in research; target `src/lib/redis/`, `redis/scripts/*.lua`.
  Acceptance criteria: real Redis integration proves one winner under 50 concurrent acquires, exact TTL/Retry-After ceil, owner-only renew/convert, DB-timeout margin invariant, dynamic interval non-shortening, and fail-closed timeout/ambiguous response.
  QA scenarios: happy — acquire, simulate bounded commit, convert to 5000ms cooldown; failure — wrong owner/Redis outage/postcommit unknown leaves blocking fence and never admits a second worker. Evidence `<attemptDir>/task-26-lendas-do-dc/redis-contract.json`.
  Commit: Y | `feat(queue): add atomic Redis coordination`

- [ ] 27. Implement transactional anonymous enqueue RPC and durable dispatch outbox
  What to do / Must NOT do: Add service-only `SECURITY DEFINER` enqueue RPC with empty search path: consume server-derived HMACs/key versions and parsed payload, lock serialized enqueue counter, resolve stable idempotency/receipt, enforce one active pending item, assign `enqueue_seq`, ten-minute expiry, write queue item and QStash wake outbox in one commit, return safe receipt. Recheck DB card visibility and quotas as defense in depth. No public execute grant or client-supplied session/IP truth.
  Parallelization: Wave 5 | Blocked by: 9, 14–15, 25–26 | Blocks: 28–31, 37–39
  References: `.omo/drafts/lendas-do-dc.md:57-75`; target `supabase/migrations/*_enqueue_rpc.sql`, `supabase/tests/enqueue.test.sql`.
  Acceptance criteria: pgTAP/two-connection tests prove one pending/session, committed monotonic order, same-idempotency same-receipt, conflict code, invalid/hidden card rejection, queue+outbox atomicity, ten-minute expiry, and no public function access.
  QA scenarios: happy — A/B concurrent enqueue yields two ordered receipts; failure — A double-click/new key produces one active item and rollback during outbox insert leaves neither row. Evidence `<attemptDir>/task-27-lendas-do-dc/enqueue-rpc-race.json`.
  Commit: Y | `feat(queue): persist anonymous submissions atomically`

- [ ] 28. Expose guarded public enqueue and private receipt-status APIs
  What to do / Must NOT do: Implement `POST /api/messages` and `GET /api/messages/status`: Redis precondition before creating session/durable state, central guard, typed validation, stable client idempotency key, adaptive challenge, enqueue RPC, `202` safe receipt; status binds opaque receipt to session HMAC, returns version/ETag, approximate ahead count, expiry, system cadence/degraded state, never private queue fields. Double-click/unknown response must reconcile before allowing a new submission. No visitor-facing global 429.
  Parallelization: Wave 5 | Blocked by: 13–15, 27 | Blocks: 37–39, 55–56
  References: `.omo/drafts/lendas-do-dc.md:59-60,72,81,88`; target `src/app/api/messages/route.ts`, `src/app/api/messages/status/route.ts`.
  Acceptance criteria: route integration asserts 202/body/headers, idempotent replay, 409 active-pending, 422 validation, 403 challenge, 503 Redis outage with zero session/queue/receipt/outbox, ETag 304, receipt/session isolation, no internal fields.
  QA scenarios: happy — valid anonymous submission and status poll; failure — two parallel clicks, forged receipt/other session, Redis outage, or uncertain response cannot create/reveal a second item. Evidence `<attemptDir>/task-28-lendas-do-dc/enqueue-api.json`.
  Commit: Y | `feat(api): expose anonymous queue admission`

- [ ] 29. Implement QStash outbox dispatcher and signed callback envelope
  What to do / Must NOT do: Add server-only QStash client, outbox dispatcher, stable dedup IDs, immediate/second-level delayed messages, publish response reconciliation, current+next signing-key verification, strict callback body schema, and diagnostic headers. Mark outbox dispatched only after confirmed response; unknown response remains retryable with same ID. QStash is the sole delivery provider; do not use cron for five-second cadence or treat its ten-minute dedup as correctness.
  Parallelization: Wave 5 | Blocked by: 2, 9, 11, 13, 27 | Blocks: 31–36, 58
  References: `.omo/drafts/lendas-do-dc.md:45,67-69`; QStash delay `https://upstash.com/docs/qstash/features/delay`; at-least-once `https://upstash.com/docs/qstash/features/at-least-once`; signature quickstart.
  Acceptance criteria: HTTP-wire integration proves signed immediate/delayed publish, stable dedup, unknown-response replay, current/next key rotation, forged/expired signature denial, and permanent Postgres delivery idempotency independent of QStash window.
  QA scenarios: happy — dispatch outbox and receive one signed wake; failure — lose QStash response then retry same dedup and process at most once, forged callback never reaches worker. Evidence `<attemptDir>/task-29-lendas-do-dc/qstash-dispatch.json`.
  Commit: Y | `feat(queue): add durable QStash dispatch`

- [ ] 30. Prove admission concurrency and fail-closed failure matrix
  What to do / Must NOT do: Add barrier-based real integration suite across route→Redis→Postgres/outbox for concurrent same/different sessions, duplicate content, limits, challenge escalation, DB rollback, Redis timeout, unknown QStash response, and worktree isolation. Use two independent DB/HTTP clients and observable states; no `Promise.all` without a barrier, sleeps, or mocked-only claims.
  Parallelization: Wave 5 | Blocked by: 3, 25–29 | Blocks: 31–36, 55
  References: plan Verification strategy; Metis race directives; target `tests/integration/admission/`, `tests/support/race-barrier.ts`.
  Acceptance criteria: `pnpm test:integration -- admission --runInBand` emits race JSON proving one active row/session, ordered different-session rows, zero durable state during Redis failure, atomic queue/outbox rollback, and idempotent unknown outcomes.
  QA scenarios: happy — 20 different sessions enqueue within limits; failure — 20 same-session requests yield one 202/reconciled item and no second pending row. Evidence `<attemptDir>/task-30-lendas-do-dc/admission-race.json`.
  Commit: Y | `test(queue): prove admission invariants`

- [ ] 31. Implement the authoritative actor-alternating publication transaction
  What to do / Must NOT do: Add service-only Postgres publication RPC that consumes verified delivery/owner token context; lock singleton gate first; use `clock_timestamp()` after lock; recheck emergency/interval/idempotency/expiry; bounded-scan invalid/poison items; choose oldest valid `enqueue_seq` from a session different from last published when possible, else oldest; lock without `SKIP LOCKED`; insert message, archive sensitive original appropriately, update queue/gate/card aggregates/sanitized platform state, processed delivery and outbox/audit in one short commit. No network call or client clock inside transaction.
  Parallelization: Wave 6 | Blocked by: 8–12, 26–30 | Blocks: 32–36, 40–42
  References: `.omo/drafts/lendas-do-dc.md:61,70-75,83`; PostgreSQL lock/clock evidence from research; target `supabase/migrations/*_publish_rpc.sql`, pgTAP publication tests.
  Acceptance criteria: pgTAP/two-connection tests prove gate-first serialization, exact actor alternation/fallback, no `SKIP LOCKED`, invalid-head bounded rejection, one message/delivery, atomic aggregates/outbox, safe removal fields, and DB statement timeout below Redis fence margin.
  QA scenarios: happy — A1/A2/B1 publishes A1→B1→A2 with ≥5s gate timestamps; failure — simultaneous delivery/expired or poisoned head creates at most one valid message and advances safely. Evidence `<attemptDir>/task-31-lendas-do-dc/publication-rpc.json`.
  Commit: Y | `feat(queue): serialize fair publication in Postgres`

- [ ] 32. Build the signed QStash worker orchestration route
  What to do / Must NOT do: Implement signed `/api/jobs/publish-next`: verify signature/envelope before parsing; acquire Redis fence+cooldown; invoke short publication RPC; classify no-item/emergency/not-yet/retry/terminal results; persist retry state before returning; schedule next delayed wake through outbox; return bounded 2xx/429/503 with server TTL/Retry-After only for transport. Enforce maximum route/DB timeout below fence. Never trust QStash retry count as attempts or acknowledge before state is durable.
  Parallelization: Wave 6 | Blocked by: 13, 26, 29–31 | Blocks: 33–36, 58
  References: `.omo/drafts/lendas-do-dc.md:59-60,67-75`; QStash receiving/retry docs; target `src/app/api/jobs/publish-next/route.ts`, `src/features/queue/worker.ts`.
  Acceptance criteria: integration tests prove signed success/noop/emergency, busy TTL/headers, retry persistence, bounded timeout, forged/late/duplicate delivery denial/idempotency, and no DB call on Redis failure.
  QA scenarios: happy — signed wake publishes one and schedules delayed next; failure — 50 simultaneous/forged wakes produce one commit, others safe retry/noop with no leaked data. Evidence `<attemptDir>/task-32-lendas-do-dc/worker-route.json`.
  Commit: Y | `feat(queue): orchestrate signed publication worker`

- [ ] 33. Guarantee post-commit cooldown conversion and unknown-outcome reconciliation
  What to do / Must NOT do: After confirmed DB commit, atomically convert owner processing fence to configured cooldown from commit completion; persist/emit availableAt, then respond. If conversion fails/response is unknown, retain longer fence and reconcile DB by delivery/idempotency key before any retry. Add explicit state machine for crash before claim, after claim, unknown commit, after commit/before Redis conversion, and duplicate retry. Do not release early or return success from Redis alone.
  Parallelization: Wave 6 | Blocked by: 26, 31–32 | Blocks: 36, 38, 55
  References: `.omo/drafts/lendas-do-dc.md:61-62,73-75,88`; target `src/features/queue/publication-outcome.ts`, Redis finalize Lua.
  Acceptance criteria: deterministic fault-injection integration proves each crash point, permanent idempotency, postcommit five-second block, longer fail-safe delay on conversion failure, and same final state after unknown-response reconciliation.
  QA scenarios: happy — commit then Redis conversion yields TTL≈5000 and public state; failure — kill connection after COMMIT and before conversion, retry reads committed result and publishes nothing else until safe. Evidence `<attemptDir>/task-33-lendas-do-dc/unknown-outcomes.json`.
  Commit: Y | `fix(queue): make publication outcomes crash-safe`

- [ ] 34. Implement rescue sweep, expiry, poison handling, retries, and emergency behavior
  What to do / Must NOT do: Add one-minute Vercel Cron rescue route protected by `CRON_SECRET` plus durable sweep RPC: dispatch undispatched outbox, expire ten-minute pending items, recover stale durable leases, bounded exponential retry/max attempts, reject poisoned items with reason, clean duplicate wakes, and ensure future wake exists. Emergency mode rejects new enqueue, pauses publication, preserves/then expires existing items per policy, but allows cleanup/reads; resume inserts immediate wake. No five-second cron scheduling.
  Parallelization: Wave 6 | Blocked by: 9, 26, 29, 31–32 | Blocks: 36, 47, 49–50
  References: `.omo/drafts/lendas-do-dc.md:68,72,83,88`; target `src/app/api/jobs/rescue/route.ts`, `supabase/migrations/*_queue_recovery.sql`, `vercel.json`.
  Acceptance criteria: tests prove stranded outbox dispatch, stale lease recovery, expiry, poison cap, emergency reject/pause/read behavior, resume wake, signed cron denial, idempotent repeated sweep, and no premature valid-item deletion.
  QA scenarios: happy — rescue a lost QStash publish and drain after resume; failure — repeated poison/expired item becomes terminal and cannot block another actor. Evidence `<attemptDir>/task-34-lendas-do-dc/queue-recovery.json`.
  Commit: Y | `feat(queue): recover and pause durable work`

- [ ] 35. Expose sanitized platform state and dynamic cadence settings contract
  What to do / Must NOT do: Implement public `GET /api/platform-state` and safe Realtime row with server time, availableAt, configured interval, emergency/degraded flags only; compute current block from max authoritative DB state and Redis PTTL. Add service RPC contract for temporary 5–60s interval with expiry and no shortening of active cooldown; emergency toggles audited. Do not expose raw keys/queue depth publicly or authorize from client countdown.
  Parallelization: Wave 6 | Blocked by: 9, 26, 31 | Blocks: 38, 40–42, 47–48
  References: `.omo/drafts/lendas-do-dc.md:69,73-75,83,86`; target `src/app/api/platform-state/route.ts`, `src/features/platform-state/`.
  Acceptance criteria: integration tests prove TTL/server-time response, `Retry-After` ceil helper, interval increase/decrease/expiry semantics, active-cooldown non-shortening, emergency state, ETag/no-store, and strict public field allowlist.
  QA scenarios: happy — increase interval temporarily then auto-return to 5s; failure — forged client state/invalid 0 or >60s interval cannot affect authorization. Evidence `<attemptDir>/task-35-lendas-do-dc/platform-state.json`.
  Commit: Y | `feat(queue): publish safe cadence state`

- [ ] 36. Prove global publication timing, fairness, idempotency, and outage guarantees
  What to do / Must NOT do: Build mandatory real Redis+Postgres two-connection worker race suite, including an exact wall-clock five-second contract, A/B alternation, duplicate/late QStash IDs, DB latency within bound, Redis loss before/after commit, postcommit conversion loss, interval changes, emergency, poisoned head, and rescue. Capture Redis TTL and DB rows independently. No retries masking failure or test-only production bypass.
  Parallelization: Wave 6 | Blocked by: 3, 30–35 | Blocks: 37–42, 55–59
  References: plan Required hard assertions; `.omo/drafts/lendas-do-dc.md:85-89`; target `tests/integration/publication/`.
  Acceptance criteria: `pnpm test:integration -- publication-race --retries=0` asserts every adjacent committed `published_at` delta ≥5000ms, exactly one winner per slot/delivery, fair order, zero extra row under every injected failure, and emits independently queried race/TTL JSON.
  QA scenarios: happy — three sessions publish across three slots in fair order; failure — 50 concurrent workers plus Redis/response faults never produce a sub-5s pair or duplicate. Evidence `<attemptDir>/task-36-lendas-do-dc/publication-race.json`.
  Commit: Y | `test(queue): prove global cadence and fairness`

- [ ] 37. Build the anonymous MessageComposer with safe form-state transitions
  What to do / Must NOT do: Add React Hook Form + shared Zod parser, optional nickname, 500-grapheme counter, permanent queue/cooldown explanation, community-rule acknowledgement, stable idempotency key, double-click guard, adaptive Turnstile slot, and explicit draft→validating→sending→queued/ambiguous/error state machine. Preserve draft through recoverable network failure and mobile keyboard; never infer publication from POST success or generate a new key after ambiguous outcome.
  Parallelization: Wave 7 | Blocked by: 6, 22, 25, 28, 36 | Blocks: 38–39, 42, 56
  References: `.omo/drafts/lendas-do-dc.md:30,35,59-60,82-83`; `DESIGN.md`; target `src/features/messages/components/MessageComposer.tsx`.
  Acceptance criteria: component/Playwright tests prove 1/500/501 boundaries, whitespace normalization preview, optional nickname, double click one request, challenge flow, ambiguous reconciliation, draft preservation, Portuguese errors, keyboard/focus/aria-live and visualViewport/safe-area behavior.
  QA scenarios: happy — compose and enter queue once on 375px with keyboard visible; failure — double click/timeout/invalid text cannot lose draft or create second item. Evidence `<attemptDir>/task-37-lendas-do-dc/composer/`.
  Commit: Y | `feat(messages): add anonymous composer`

- [ ] 38. Build QueueReceipt and global CooldownIndicator from server truth
  What to do / Must NOT do: Implement private receipt UI/status polling with ETag, approximate queue-ahead copy, expiry/rejection/published/ambiguous states, global availableAt countdown/progress, server clock offset and confirmation fetch at zero. Disable new submission only while own item is active/security guard requires it—not merely global cooldown—because enqueue and publication are separate. Never promise exact position/time or authorize from timer/local state.
  Parallelization: Wave 7 | Blocked by: 26, 28, 33, 35, 37 | Blocks: 39, 42, 56
  References: `.omo/drafts/lendas-do-dc.md:59-60,70-75,99`; target `src/features/queue/components/{QueueReceipt,CooldownIndicator}.tsx`.
  Acceptance criteria: fake-clock component and Playwright tests prove labels/progress 5→0, server correction, ETag, approximate-position disclaimer, every terminal state, offline freeze warning, zero confirmation, and active-own-item button guard.
  QA scenarios: happy — queued item progresses to published after server event; failure — stale local zero/server TTL 3200ms immediately corrects without enabling unauthorized publication. Evidence `<attemptDir>/task-38-lendas-do-dc/queue-receipt/`.
  Commit: Y | `feat(queue): surface authoritative queue status`

- [ ] 39. Synchronize own pending state across tabs without making the browser authoritative
  What to do / Must NOT do: Use BroadcastChannel only to announce “status may have changed”/receipt version between same-origin tabs; every tab refetches server-bound status. Rehydrate from HttpOnly anonymous session and server receipt lookup after reload/new tab; handle unavailable BroadcastChannel fallback. Do not send raw cookie/abuse identifiers or accept a peer tab’s countdown/authorization as truth.
  Parallelization: Wave 7 | Blocked by: 14, 28, 37–38 | Blocks: 42, 56
  References: `.omo/drafts/lendas-do-dc.md:30-31,77,99`; target `src/features/queue/use-queue-sync.ts`, Playwright multi-page docs.
  Acceptance criteria: two-page one-context Playwright test proves Tab A enqueue disables Tab B after server refetch, reload restores, terminal state propagates, forged BroadcastChannel payload only triggers refetch, and fallback polling converges.
  QA scenarios: happy — enqueue in Tab A and observe same receipt state in Tab B; failure — spoofed “published” channel event cannot render success without server confirmation. Evidence `<attemptDir>/task-39-lendas-do-dc/multitab.trace.zip`.
  Commit: Y | `feat(queue): reconcile queue state across tabs`

- [ ] 40. Implement public Supabase Realtime subscriptions with durable reconciliation
  What to do / Must NOT do: Subscribe with publishable key only to allowlisted Postgres Changes for cards, redacted messages, and platform state; represent insert/update/removal/version events by public IDs; deduplicate/idempotently upsert, ignore older versions, refetch durable cursor on ready/reconnect/focus/24h renewal/channel error, expose connection warning. Never subscribe to private tables, trust event as source of truth, or broadcast client-authored business events.
  Parallelization: Wave 7 | Blocked by: 11, 19–22, 31, 35–36 | Blocks: 41–42, 56
  References: `.omo/drafts/lendas-do-dc.md:43,47,75,86,99`; Supabase Realtime/Postgres Changes docs; target `src/lib/realtime/`, `src/features/messages/use-message-realtime.ts`.
  Acceptance criteria: unit reducer and real Realtime integration prove ready handshake, insert/update/removal, duplicate/out-of-order/stale ignore, reconnect cursor refetch, 24h renewal simulation, public field allowlist, and no private channel/table access.
  QA scenarios: happy — another context publishes and both converge once; failure — duplicate/out-of-order event or disconnect shows warning then converges from DB without duplicate/count drift. Evidence `<attemptDir>/task-40-lendas-do-dc/realtime.json`.
  Commit: Y | `feat(realtime): reconcile public changes safely`

- [ ] 41. Reconcile live card counts, activity, search pages, and message removal
  What to do / Must NOT do: Wire Realtime events to card-grid counts/activity and detail message list while preserving cursor/search/sort correctness; use immutable public IDs/version and targeted safe refetch/tag invalidation; on moderation null content and show stable placeholder/remove from counts according to documented aggregate semantics. Avoid optimistic double increment from own publication and mutating paginated arrays by position.
  Parallelization: Wave 7 | Blocked by: 8, 21–22, 31, 40 | Blocks: 42, 56
  References: `.omo/drafts/lendas-do-dc.md:47,75,82-83`; target `src/features/cards/realtime-reducer.ts`, `src/features/messages/realtime-reducer.ts`.
  Acceptance criteria: Vitest/Playwright proves own and remote publication exactly once, count/activity update, active sort reposition/refetch, removal placeholder, pagination consistency, and full convergence after replay/reconnect.
  QA scenarios: happy — remote message updates card and detail without reload; failure — initial fetch races same insert plus replay and still yields one row/count increment. Evidence `<attemptDir>/task-41-lendas-do-dc/live-aggregates.json`.
  Commit: Y | `feat(realtime): update cards and messages live`

- [ ] 42. Verify offline, slow-network, reconnect, multi-context, and responsive queue journeys
  What to do / Must NOT do: Add end-to-end narratives covering composer→queue→worker→Realtime→public message across two tabs and two isolated contexts, browser offline/tab sleep/reconnect, slow POST/ambiguous response, expired/rejected item, removed message, mobile keyboard and 375/768/1280 layouts. Subscribe before publication and await signals, not sleeps.
  Parallelization: Wave 7 | Blocked by: 20–23, 36–41 | Blocks: 52, 56, 59
  References: plan Verification strategy; Playwright pages/contexts docs; target `tests/e2e/publication-journey.spec.ts`.
  Acceptance criteria: `pnpm exec playwright test publication-journey --retries=0` passes all narratives with one public message, no duplicate, correct warnings/recovery, no overflow/hidden CTA, server-confirmed terminal state, and traces/network logs.
  QA scenarios: happy — two-context live publication journey; failure — disconnect during commit then reconnect resolves ambiguous receipt without resubmission. Evidence `<attemptDir>/task-42-lendas-do-dc/publication-journey/`.
  Commit: Y | `test(e2e): verify anonymous publication journeys`

- [ ] 43. Implement anonymous report submission and accessible ReportDialog
  What to do / Must NOT do: Add guarded `POST /api/reports`, service-only transactional RPC, exact reasons (assédio, ódio, dados pessoais, spam, sexual, ameaça, informação falsa, outro), optional bounded details, one report/session/message, report quotas/adaptive challenge, and shadcn ReportDialog with confirmation/aria/focus restoration. No public report status/count/details or report against hidden/nonexistent content.
  Parallelization: Wave 8 | Blocked by: 10, 13–15, 18, 22, 25 | Blocks: 46, 55–57
  References: `.omo/drafts/lendas-do-dc.md:83,88`; target `src/app/api/reports/route.ts`, `src/features/reports/`.
  Acceptance criteria: integration/component/E2E tests prove every reason, details bounds, unique report, 5/hour session+15/hour IP, Turnstile escalation, transactional audit/security event, Portuguese confirmation, keyboard/focus, and zero public leakage.
  QA scenarios: happy — keyboard-submit one valid report; failure — duplicate/quota/private-message/forged session rejected without exposing existing report. Evidence `<attemptDir>/task-43-lendas-do-dc/reporting/`.
  Commit: Y | `feat(moderation): add anonymous reporting`

- [ ] 44. Build protected admin shell and card lifecycle management
  What to do / Must NOT do: Implement `/admin/login` password→TOTP, session timeout/reauth UI, protected server layout/sidebar, dashboard entry, cards list/search/counts, create/edit name/description/status, archive/hide/restore/soft-delete with explicit named confirmation and audit, slug alias behavior. Every mutation uses server authorization/CSRF/fresh assurance and service-only RPC; no client role claim or icon-only destructive action.
  Parallelization: Wave 8 | Blocked by: 6, 8, 16–18 | Blocks: 45–48, 57
  References: `.omo/drafts/lendas-do-dc.md:32,58,76-84`; target `src/app/admin/`, `src/features/admin/cards/`.
  Acceptance criteria: integration/Playwright tests prove login/TOTP, route/mutation denial anonymous/stale/CSRF, card CRUD/search/archive/restore/delete/alias, confirmation copy, transactional audit, responsive admin shell and no-store responses.
  QA scenarios: happy — admin creates/archives/restores a fictional card; failure — anonymous direct POST/stale reauth/destructive dialog escape cannot mutate. Evidence `<attemptDir>/task-44-lendas-do-dc/admin-cards/`.
  Commit: Y | `feat(admin): manage card lifecycle securely`

- [ ] 45. Implement secure administrator-only card image processing
  What to do / Must NOT do: Add authenticated signed private staging upload, max 4 MiB raster allowlist, magic-byte/decoded dimensions/pixel limits, Sharp metadata stripping and deterministic WebP/AVIF derivative, random object key, public derivative metadata update, old/stale staging cleanup, and alt-text requirement. Reject SVG/PDF/polyglot/animated/oversize/decode failures. Do not proxy browser upload bytes through a public unauthenticated route or add external scanner.
  Parallelization: Wave 8 | Blocked by: 11, 13, 16–18, 44 | Blocks: 54, 57
  References: `.omo/drafts/lendas-do-dc.md:92`; Supabase Storage docs; target `src/features/admin/images/`, `src/app/api/admin/images/`.
  Acceptance criteria: real Storage integration verifies signed URL/session, private staging, format sniff/dimension/EXIF stripping/re-encode, derivative-only public access, cleanup, audit, and no secret in browser/network logs.
  QA scenarios: happy — valid JPEG becomes metadata-free derivative used by card; failure — renamed SVG/polyglot/huge-dimension/bad decode remains private and is removed. Evidence `<attemptDir>/task-45-lendas-do-dc/card-images.json`.
  Commit: Y | `feat(admin): process card images safely`

- [ ] 46. Build moderation queue, report resolution, and message removal/restoration
  What to do / Must NOT do: Implement admin report filters/detail/context, `open→reviewing→resolved|dismissed`, message search, remove/restore with mandatory reason/confirmation, private original archive, public content null + stable “Mensagem removida pela moderação”, report auto-resolution choice, Realtime update, and transactional append-only audit. No hard delete before retention, public reason/details leak, or unaudited bulk action.
  Parallelization: Wave 8 | Blocked by: 10, 17–18, 22, 43–44 | Blocks: 48, 57
  References: `.omo/drafts/lendas-do-dc.md:34-35,83,88,98`; target `src/app/admin/{mensagens,denuncias}/`, `src/features/admin/moderation/`.
  Acceptance criteria: pgTAP/integration/Playwright proves each transition, mandatory rationale, remove/restore redaction, stable URL/feed/count behavior, Realtime convergence, original private access only, audit rollback atomicity and permissions.
  QA scenarios: happy — resolve report by removing then restoring message; failure — missing reason/audit failure/stale session leaves public/private state unchanged. Evidence `<attemptDir>/task-46-lendas-do-dc/moderation/`.
  Commit: Y | `feat(admin): add audited moderation workflow`

- [ ] 47. Build admin queue, abuse, cooldown, and operational dashboard
  What to do / Must NOT do: Add protected dashboards for sanitized queue depth/oldest age/status, current DB+Redis cooldown/TTL discrepancy, accepted/blocked/retry/error counters, message rate, QStash/Redis errors, pseudonymous suspicious session/IP tags, temporary blocks, alerts, admin login failures, and safe manual idempotent retry. Never show raw IP/session/message body by default or permit manual fair-order reordering/bypass.
  Parallelization: Wave 8 | Blocked by: 9–10, 17–18, 26, 34–35, 44 | Blocks: 48, 50, 57
  References: `.omo/drafts/lendas-do-dc.md:71-75,79,84-89`; target `src/app/admin/{fila,seguranca}/`, `src/features/admin/operations/`.
  Acceptance criteria: integration/Playwright verifies metric calculations, redaction, filters, block/unblock expiry, TTL mismatch warning, safe retry idempotency, RBAC/session/CSRF, no queue reorder/global bypass and audit for every action.
  QA scenarios: happy — inspect queue and block an abusive pseudonymous tag; failure — crafted telemetry metadata cannot inject HTML/leak raw values or retry an already published item. Evidence `<attemptDir>/task-47-lendas-do-dc/admin-operations/`.
  Commit: Y | `feat(admin): expose safe operational controls`

- [ ] 48. Implement audited settings, emergency mode, temporary cadence, and audit viewer
  What to do / Must NOT do: Add settings RPC/UI for emergency mode and temporary 5–60s cadence with explicit duration, confirmation, expiry, active-cooldown non-shortening, resume wake, public banner, and audit. Add read-only audit search by period/action/target/request ID with redacted metadata and export limits. Require ≤15m reauth/TOTP and CSRF. No permanent non-5s default without code/config approval or audit editing/deletion.
  Parallelization: Wave 8 | Blocked by: 10, 17–18, 34–35, 44–47 | Blocks: 50, 54, 57
  References: `.omo/drafts/lendas-do-dc.md:80,83-84`; target `src/app/admin/{configuracoes,auditoria}/`.
  Acceptance criteria: tests prove enable/pause/resume, interval increase/decrease/auto-expiry, active cooldown safety, enqueue 503/reads 200, public banner, immediate resume wake, reauth/CSRF, immutable audit search/export redaction.
  QA scenarios: happy — activate 15s interval for 15m then auto-return; failure — stale TOTP/forged interval/audit mutation cannot change state. Evidence `<attemptDir>/task-48-lendas-do-dc/admin-settings/`.
  Commit: Y | `feat(admin): control emergency and audit state`

- [ ] 49. Implement idempotent retention and purge jobs for every data class
  What to do / Must NOT do: Add bounded-batch service-only retention RPC/jobs for queue payloads 30d, abuse/security buckets 72h with HMAC key-version coordination, removed originals 90d, revoked sessions 90d, resolved reports 1y, audit 2y, stale staging images, expired outbox/idempotency as explicitly permitted. Record retention ledger/audit, retry failures, keep legal hold flag, and protect public content/current buckets/required keys. No unbounded delete transaction or silent key rotation resetting quotas.
  Parallelization: Wave 9 | Blocked by: 9–12, 18, 34 | Blocks: 50, 54–55
  References: `.omo/drafts/lendas-do-dc.md:79,91`; target `supabase/migrations/*_retention.sql`, `src/app/api/jobs/retention/route.ts`.
  Acceptance criteria: time-controlled integration proves each exact cutoff, batch continuation/idempotency, key retirement only after buckets, storage cleanup, legal hold, audit, failed-run retry/alert, and no premature public/active deletion.
  QA scenarios: happy — purge expired fixtures in multiple batches; failure — injected mid-batch failure resumes without double-audit or deleting active/held data. Evidence `<attemptDir>/task-49-lendas-do-dc/retention.json`.
  Commit: Y | `feat(ops): enforce documented retention`

- [ ] 50. Implement measurable metrics, alerts, health/degraded status, and runbook dashboards
  What to do / Must NOT do: Instrument enqueue accepted/rejected, rate limits, Redis outage/fence contention, QStash dispatch/retry/failure, commit latency/cadence violation, queue depth/age/poison/expiry, idempotency, Realtime reconnect, Turnstile, admin auth/recovery, moderation, retention/image errors, RLS/security anomalies. Aggregate without high-cardinality/raw identifiers; add liveness/readiness/admin diagnostics and alert thresholds/dedup/runbooks. No public detailed health or content in metrics.
  Parallelization: Wave 9 | Blocked by: 18, 34–35, 47–49 | Blocks: 53–55, 59
  References: `.omo/drafts/lendas-do-dc.md:84-89`; target `src/lib/observability/metrics.ts`, `docs/runbooks/`, admin dashboard.
  Acceptance criteria: synthetic event integration verifies counters/histograms/alerts/redaction and degraded-state transitions; alert webhook failure persists retry; public health reveals only status; admin diagnostics reconcile DB/Redis/QStash.
  QA scenarios: happy — synthetic Redis outage raises one deduplicated alert and public degraded banner; failure — metric labels containing raw IP/content are rejected by schema and never exported. Evidence `<attemptDir>/task-50-lendas-do-dc/observability.json`.
  Commit: Y | `feat(ops): add privacy-safe observability`

- [ ] 51. Run application security hardening and regression suite
  What to do / Must NOT do: Add security tests for XSS/plain text, CSP nonce, clickjacking, CSRF/origin/fetch metadata, session fixation/rotation, TOTP/recovery replay, brute force, Turnstile replay/outage, forged ingress/QStash/cron, SSRF/link parsing, body limits, secret/service-key bundle leakage, RLS/direct-write/private-field access, audit rollback and safe errors. Add dependency audit and SBOM. Fix every demonstrated path; no speculative severity or lowering controls to pass tests.
  Parallelization: Wave 9 | Blocked by: 13–18, 25–36, 43–50 | Blocks: 52, 55–59
  References: `.omo/drafts/lendas-do-dc.md:76-83,85-93`; OWASP ASVS/WSTG/CWE; target `tests/security/`, `scripts/security-smoke.ts`.
  Acceptance criteria: `pnpm test:security` and staging-safe smoke pass with exact status/no-state assertions; public bundle/SBOM scan has zero secrets/known blocking vulnerabilities; all mutation routes appear in guard coverage; artifacts redact payloads.
  QA scenarios: happy — legitimate public/admin flows survive hardened headers; failure — each attack fixture is rejected and DB/log/bundle assertions prove no side effect/leak. Evidence `<attemptDir>/task-51-lendas-do-dc/security-report/`.
  Commit: Y | `test(security): lock trust boundaries`

- [ ] 52. Complete accessibility, visual QA, React performance, and Lighthouse gates
  What to do / Must NOT do: Run frontend `/visual-qa` against production build at 375/768/1280 plus 320/1024/1440 stress; exercise every page/state/dialog/keyboard/mobile keyboard/reduced motion/200% zoom/content stress. Run react-doctor/react-scan, axe, screen-reader-semantic checks, and real Chrome Lighthouse mobile+desktop 3–5 runs/median with 100 in performance/accessibility/best-practices/SEO. Repair architecture/design without hiding content or removing meaningful motion.
  Parallelization: Wave 9 | Blocked by: 5–6, 20–24, 37–48, 51 | Blocks: 55–59
  References: `DESIGN.md`; frontend perfection/visual QA rules loaded in planning; target `tests/e2e/{a11y,visual,performance}/`.
  Acceptance criteria: fresh objective artifacts show visual-qa pass, zero axe critical/serious, all key tasks keyboard-operable, no overflow/focus obstruction, no unnecessary React commits, and Lighthouse median 100/100/100/100 mobile+desktop for public routes plus admin accessibility audits.
  QA scenarios: happy — full state matrix passes; failure — deliberately clipped focus/undeclared token fixture is detected before removal. Evidence `<attemptDir>/task-52-lendas-do-dc/frontend-quality/`.
  Commit: Y | `perf(ui): satisfy accessibility and quality gates`

- [ ] 53. Configure Vercel, Supabase, Upstash/QStash, Turnstile, Firewall, and region gates
  What to do / Must NOT do: Add Vercel config/runtime/cron, Supabase local/remote schema settings exposing only `api`, Realtime publication, Storage, QStash callback/signing keys, Upstash regional Redis, Turnstile host/action, Vercel Firewall/Bot rules, preview protection, health checks, and separate staging/production env matrices. Add preflight that verifies Vercel `gru1`, Supabase São Paulo, Upstash `sa-east-1` availability/account selection and stops otherwise. No shared credentials/data or silent locality fallback.
  Parallelization: Wave 9 | Blocked by: 2, 4, 11, 29, 50 | Blocks: 54, 58–60
  References: `.omo/drafts/lendas-do-dc.md:81,84,93`; Vercel region/runtime/env docs; Supabase/Upstash/QStash deployment docs; target `vercel.json`, `supabase/config.toml`, `scripts/deploy/preflight.ts`.
  Acceptance criteria: `pnpm deploy:preflight --environment=staging` validates provider IDs/regions/secrets/callbacks/firewall without printing secrets; configuration lint confirms Node runtime, signed jobs, separate resources and preview cannot write production.
  QA scenarios: happy — staging preflight passes with masked inventory; failure — wrong/missing region/shared project/unsigned callback blocks deployment with actionable output. Evidence `<attemptDir>/task-53-lendas-do-dc/deploy-preflight.json`.
  Commit: Y | `chore(deploy): configure regional cloud services`

- [ ] 54. Write complete local setup, deployment, operations, admin, and decision documentation
  What to do / Must NOT do: Finalize `README.md` local install/test/reset/seed, `docs/DEPLOYMENT.md` Vercel/Supabase/Upstash/QStash/Turnstile/Firewall sequence, `docs/OPERATIONS.md` SLOs/alerts/emergency/recovery/rollback/backup, `docs/ADMIN.md` bootstrap/TOTP/recovery/rotation, `docs/DECISIONS.md`, env ownership/rotation, migration forward-fix, legal review and troubleshooting. Include exact commands and expected outputs, no real secrets/placeholders presented as complete or unsupported claims.
  Parallelization: Wave 9 | Blocked by: 1–53 | Blocks: 58–60
  References: mandatory handoff `.omo/drafts/lendas-do-dc.md:84`; all implemented scripts/configs; target root/docs.
  Acceptance criteria: docs command extractor executes every safe code block in a clean checkout against local/staging fixtures; link/env/command checks pass; a fresh scripted setup reaches seeded app and admin bootstrap; delivery inventory checker finds every requested artifact.
  QA scenarios: happy — automated clean-room setup follows docs to green local stack; failure — missing env/region/migration step yields documented deterministic diagnostic, never secret output. Evidence `<attemptDir>/task-54-lendas-do-dc/docs-validation.json`.
  Commit: Y | `docs: complete setup deployment and operations guide`

- [ ] 55. Execute the full unit, database, integration, race, and migration release suite
  What to do / Must NOT do: Run frozen install and all Biome/type/unit/pgTAP/integration/security/migration/seed/race gates from a clean worktree with isolated real Postgres/Redis; archive reports and rerun only after root-cause fixes. Include fresh install and forward-upgrade migration. No skipped/quarantined/flaky mandatory test, hidden retry, mock-only Redis/Postgres correctness or changed expectation to mask failure.
  Parallelization: Wave 10 | Blocked by: 1–54 | Blocks: 58–60
  References: plan Verification strategy; all `tests/unit`, `supabase/tests`, `tests/integration`, `.github/workflows/ci.yml`.
  Acceptance criteria: `pnpm check && pnpm test:unit && pnpm test:db && pnpm test:integration && pnpm test:security` all pass once with retries disabled for race/security; migration digests, ≥5s race JSON, RLS TAP and coverage/JUnit uploaded.
  QA scenarios: happy — clean full suite passes; failure — intentionally run known regression fixtures separately and verify each gate detects its named bug before fixture cleanup. Evidence `<attemptDir>/task-55-lendas-do-dc/release-core/`.
  Commit: N | verification-only; commit fixes atomically under owning scopes if discovered

- [ ] 56. Execute complete public Playwright journeys across browsers and viewports
  What to do / Must NOT do: Against `next build && next start`, run Chromium every gate and Firefox/WebKit release/nightly for card search/sorts/pagination, card detail, anonymous enqueue/queue/countdown/multi-tab/multi-context, Realtime dedup/reconnect, reports, legal pages, 404/error/offline/slow/mobile keyboard/responsiveness. Use real local services and signals, no arbitrary sleeps or class-name assertions.
  Parallelization: Wave 10 | Blocked by: 19–54 | Blocks: 59–60
  References: Todos 19–24, 37–43; target `tests/e2e/public/`, `playwright.config.ts`.
  Acceptance criteria: all projects pass with retries disabled on critical flows; traces prove one enqueue/publication, safe payloads, server-corrected countdown, responsive/a11y states, no console/page/network errors, and no screenshot diff beyond approved design baselines.
  QA scenarios: happy — full anonymous card journey on desktop/mobile; failure — offline/reconnect/removal and duplicate events converge safely. Evidence `<attemptDir>/task-56-lendas-do-dc/public-e2e/`.
  Commit: N | verification-only; commit fixes atomically if discovered

- [ ] 57. Execute complete admin and moderation Playwright/security journeys
  What to do / Must NOT do: Run CLI bootstrap fixture, password/TOTP/session/reauth/recovery, protected routes, cards/images, reports/removal/restoration, queue/security dashboard, blocks, emergency/interval settings, audit/alerts, logout/expiry across desktop/mobile. Drive CSRF/forged/stale/replay/direct-request failures via APIRequestContext. Never expose secrets in trace/video.
  Parallelization: Wave 10 | Blocked by: 16–18, 43–54 | Blocks: 59–60
  References: Todos 16–18, 43–51; target `tests/e2e/admin/`, trace redaction config.
  Acceptance criteria: critical admin flows pass with sanitized traces; every unauthorized/stale/replayed request is 401/403 and leaves state unchanged; every successful mutation has exactly one audit event; image attack fixtures stay private.
  QA scenarios: happy — bootstrap/login/moderate/configure/audit/logout; failure — reused TOTP, expired reauth, CSRF, forged admin state, bad image and audit outage all block safely. Evidence `<attemptDir>/task-57-lendas-do-dc/admin-e2e/`.
  Commit: N | verification-only; commit fixes atomically if discovered

- [ ] 58. Validate real staging QStash, Turnstile, Supabase Realtime, and failure contracts
  What to do / Must NOT do: Deploy staging-only resources and run provider contract tests for QStash signed delayed delivery/current+next keys/duplicate/late/unknown response, Turnstile test keys/hostname/action/replay/outage, Upstash real Lua/TTL, Supabase RLS/Realtime reconnect and Storage derivative. Use disposable IDs/content and clean up. No production account/data or treating local fake as release evidence.
  Parallelization: Wave 10 | Blocked by: 29–36, 51, 53–54 | Blocks: 59–60
  References: provider docs and Todo 53 config; target `tests/contracts/staging/`.
  Acceptance criteria: `STAGING=1 pnpm test:contracts` passes with masked provider/resource IDs, one durable message per duplicate delivery, expected delay/TTL/signatures, challenge semantics, Realtime allowlist, cleanup report and zero secret in artifacts.
  QA scenarios: happy — real delayed publish reaches staging once; failure — signing-key rotation/duplicate/Turnstile replay/provider timeout exercises safe retry/fail-closed behavior. Evidence `<attemptDir>/task-58-lendas-do-dc/staging-contracts/`.
  Commit: N | verification-only; commit provider-contract fixes if discovered

- [ ] 59. Deploy immutable preview and run production-shaped smoke, rollback, and degraded drills
  What to do / Must NOT do: Deploy the exact commit to protected immutable Vercel preview with staging resources; run serial no-retry smoke for public reads, enqueue→publish≥5s, Realtime, report, admin MFA/moderation/audit, CSP/headers, health, alerts; drill Redis outage/emergency and application rollback/forward-compatible migration. Record URL/SHA/regions/migration without secrets. Do not promote on warning or share environment with parallel tests.
  Parallelization: Wave 10 | Blocked by: 42, 50–58 | Blocks: 60
  References: `docs/DEPLOYMENT.md`, `docs/OPERATIONS.md`, deployed-smoke workflow.
  Acceptance criteria: `E2E_BASE_URL=<immutable> pnpm test:smoke --workers=1 --retries=0` passes; published timestamps ≥5s; reads survive Redis outage while enqueue creates zero state; rollback restores previous app without schema/data loss; all alert/degraded evidence captured.
  QA scenarios: happy — complete preview smoke and rollback/restore; failure — Redis disabled and emergency mode produce exact banners/status/no writes, then recovery drains only valid queue items. Evidence `<attemptDir>/task-59-lendas-do-dc/preview-smoke/`.
  Commit: N | verification-only; deployment references existing SHA

- [ ] 60. Perform implementation review and prepare worker-to-PR handoff
  What to do / Must NOT do: Run `/review-work` with plan, test, visual, security, migration, provider, and preview evidence; run `/security-review` when Team Mode is available against the concrete repository; resolve every blocking finding; verify clean Git status, atomic history, delivery inventory, no secret/unrelated `.omo/.codegraph` product artifacts, and produce PR-ready summary/rollback/known-debt record. Do not self-approve findings, implement unrequested scope, or merge without final verification wave/user approval.
  Parallelization: Wave 10 | Blocked by: 1–59 | Blocks: Final verification wave
  References: completed plan; frontend Lane C/review-work contract; security-review skill; `DESIGN.md`, `docs/DECISIONS.md`, all evidence manifests.
  Acceptance criteria: review-work passes all five lanes; security review is PASS/PASS WITH resolved findings or explicitly unavailable with blocking residual risk surfaced; `pnpm release:verify` validates artifact manifest, clean worktree, commit mapping and handoff; no unresolved Critical/Major/High issue.
  QA scenarios: happy — independent reviewers reproduce core evidence and approve; failure — stale/missing evidence, secret scan, scope drift or unresolved security finding blocks handoff. Evidence `<attemptDir>/task-60-lendas-do-dc/review-handoff/`.
  Commit: N | review/handoff only; any fixes use separate atomic commits

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  Verify every Scope/Must-have and every todo acceptance criterion against the exact code, migrations, configuration, documentation, and evidence manifest. Re-run representative commands rather than accepting task summaries. Output `APPROVE` or blocking mismatches to `<attemptDir>/final/F1-plan-compliance.md`.
- [ ] F2. Code quality review
  Review strict types, module/file sizes, server/client and public/private boundaries, SQL locks/RLS/grants, queue state machines, security/privacy, dependency/SBOM, tests and atomic history. Run `pnpm check`, targeted race/RLS/security tests, `/review-work`, and concrete `/security-review` if available. Output unconditional `APPROVE` or findings to `<attemptDir>/final/F2-code-quality.md`.
- [ ] F3. Real browser QA (agent-executed)
  Use Playwright/real Chrome against the immutable preview to manually-style drive every public/admin journey, mobile keyboard, keyboard/screen-reader semantics, Realtime/offline/reconnect, error/degraded/emergency states, visual breakpoints and Lighthouse. Capture traces/screenshots/network/console and output `APPROVE` or defects to `<attemptDir>/final/F3-real-browser-qa.md`; no human intervention is required.
- [ ] F4. Scope fidelity
  Compare delivered behavior to the original request plus confirmed overrides: anonymous visitors, card-first home, global fair queue, no public accounts/moderators/online count, admin-only control, full artifacts and no unapproved service/scope. Reject generic-feed drift, reduced delivery, legal/anonymity overclaims, or extra identity collection. Output `APPROVE` or drift to `<attemptDir>/final/F4-scope-fidelity.md`.

## Commit strategy
- Initialize Git in Todo 1. Each implementation todo marked `Commit: Y` produces exactly one reviewable conventional commit after its own tests pass; split only when a migration and app change cannot be safely reverted together, and document the split in evidence.
- Commit types/scopes follow the lines in each todo. Keep migrations, generated DB types, lockfile changes, snapshots and docs in the commit that owns them. Never combine unrelated wave work or commit secrets/evidence binaries.
- Before each commit: `pnpm exec biome check .`, `pnpm exec tsc --noEmit`, the todo’s focused test, file-size audit, and `git diff --check`. Before handoff: full `pnpm release:verify` and clean status.
- Database changes are expand/contract and forward-fixed; app commits stay compatible with the immediately previous schema for preview rollback. Never hand-edit migrations already applied to staging or lockfiles.
- Todos 55–60 and F1–F4 are verification-only unless they discover a defect; each defect gets its own atomic fix commit under the owning scope and all invalidated evidence is regenerated.

## Success criteria
- A clean checkout can follow `README.md`, start isolated local Supabase/Redis, apply all migrations/RLS, seed only fictional data, bootstrap the administrator, run the production build, and pass the canonical local gate without undocumented steps.
- Home remains a responsive card-first discovery surface with Portuguese search/sorts/cursor pagination and every requested card field/state; card pages render safe anonymous messages, reports and redacted removal placeholders.
- There is no public account/profile/moderator/social-login flow, self-delete, users-online claim, or visitor write path around the guarded backend.
- Every accepted anonymous submission receives one private receipt and at most one active queue row; duplicate clicks/keys/late deliveries/unknown responses reconcile idempotently.
- Independently queried Postgres evidence proves no adjacent committed message timestamps are less than 5000ms at the default setting, no QStash delivery creates two messages, actor-alternating FIFO works, and `SKIP LOCKED` is absent from the authoritative selector.
- Redis/Turnstile/authorization/audit failures fail closed for mutations while public reads remain usable; Redis outage creates no anonymous session, queue, receipt, or outbox state. Emergency mode and recovery are audited and tested.
- Anonymous/publishable/authenticated clients can read only allowlisted public fields and cannot write or reach private schemas/RPCs/Storage; Realtime never emits queue/report/abuse/session/audit/receipt/internal data.
- Admin bootstrap is CLI-only; Argon2id+TOTP, recovery, opaque rotation, CSRF, 15-minute reauth, replay prevention and login limits pass real security journeys. Every admin/moderation mutation is transactional with exactly one immutable redacted audit event.
- Image processing publishes only validated/re-encoded raster derivatives; malicious/oversize/failed files remain private and are cleaned.
- Retention, logs, metrics, alerts, degraded states and regional staging/production configuration match documented policies without raw IPs, tokens, message bodies or secrets.
- Vitest, pgTAP, integration/race/security, Playwright public/admin, staging provider contracts, visual QA, react-doctor/react-scan, Lighthouse 100×4 mobile+desktop, and immutable-preview smoke all pass with reproducible artifacts.
- Required source, migrations, RLS, Redis/QStash config, `.env.example`, seed, CI, design/legal/readme/deploy/admin/operations/decision docs and first-admin instructions exist; no real personal data, copied branding, secret, unresolved blocking review finding or undocumented deployment assumption remains.
