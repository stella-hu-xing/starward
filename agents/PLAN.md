# Implementation plan — AI chat journal

> Reset 2026-11-15. Implementation checks below are unchecked until their milestone work is done, except the M0 baseline toolchain fixed on 2026-11-15. The repository contains the older combined-app scaffold; docs do not prove features work.

## Delivery order

Foundation -> text chat -> push-to-talk -> daily reports/archive. v1 requires all four milestones. Report scheduling, tags, and search follow in v1.5. The schedule/countdown products were removed from this repository on 2026-11-15 for a move to another project; do not split effort across them or production hosting.

## M0 — Local runtime and persistence (v1)

- [x] Establish pinned Node 22/pnpm and baseline typecheck/lint/test/build. Fix missing Hono declarations/dependency, NodeNext imports, and TypeScript/Node type compatibility in a focused task.
- [ ] Review better-sqlite3 build-script approval/native compatibility; verify real SQLite read/write with a temporary database.
- [ ] Start a real Hono Node listener; serve built UI/API on one local origin. Bind backend and Vite to loopback; verify a real HTTP health check.
- [ ] Audit migration/data state and choose a safe repair path. Implement migration tracking, repositories, the v1 schema, and backup/restore tests. Never reset data without approval.
- [ ] Finalize Claude integration, chat/report model IDs, STT provider/model/audio limits, owner credential provisioning/hashing, and timezone. Update configuration and .env.example together.
- [ ] Implement local owner login/session, hashed credentials/tokens, private-route protection, origin/CSRF checks, and rate limits. No signup.
- [ ] Replace the legacy three-screen shell (Home/Notes/Settings; the Schedule and Countdowns screens were removed on 2026-11-15) with minimal chat/conversations/reports navigation. Review legacy PWA metadata/caching and retire remaining unrelated config/dependencies as implementation work.
- [ ] Make CI typecheck/build the server too, with real repository/HTTP tests and mocked providers. Do not deploy the local backend via static Pages.

Acceptance: reproducible install, full passing checks, HTTP startup, session protection, migrations/restart persistence, disposable backup/restore, no browser secrets/private API caches. No paid API call required.

## M1 — Durable streaming text chat (v1)

- [ ] Create/list/reopen conversations, with a quiet Claude-like conversation view/composer, readable Markdown, and timestamps.
- [ ] Save user messages with conversation ID/timestamp before AI calls. Persist assistant attempts, stable sequence, and reloadable history.
- [ ] Send full current-conversation history including the new user turn. No unrelated chats, report memory, silent truncation, or history summarization.
- [ ] Stream typed deltas/completion/errors; persist checkpoints/status. Handle stop/disconnect/error/restart without presenting partial replies as complete.
- [ ] Prevent concurrent turns/duplicate submissions; retry without duplicating user text. Show context-limit/provider errors without losing content.
- [ ] Test payload order, conversation isolation, persistence, idempotent retries, interrupted attempts, safe Markdown, and 375px UI.

Acceptance: two independent chats survive reload/restart; mocked replies stream incrementally; AI failure preserves user text; tests assert full history. Live smoke tests are opt-in, synthetic, and budgeted.

## M2 — Push-to-talk (v1)

- [ ] Implement microphone gesture/permission/recording/stop/upload using target-browser-supported formats.
- [ ] Validate size/type/duration/timeout limits; transcribe with the selected STT adapter and dispose of audio on every exit path.
- [ ] Send nonempty transcript through normal chat, source=voice. Retain transcript for retry if chat fails; no empty messages after STT failure.
- [ ] Test denied microphone, unsupported formats, upload limits, cancellation, STT failure, cleanup, and typing fallback.
- [ ] Verify English/Chinese/mixed recordings and target browser/device using non-sensitive samples. Live API tests are opt-in.

Acceptance: a spoken turn becomes a durable timestamped message and streaming reply; no permanent audio. Continuous transcription is not required.

## M3 — Daily reports/archive (v1)

- [ ] Add date picker/Generate report action with progress, errors, and empty-day states.
- [ ] Snapshot selected-day messages across conversations using IANA local-day UTC bounds; test DST, midnight, cross-midnight replies, and ordering.
- [ ] Produce Markdown summary/highlights, distinguishing user facts from AI suggestions. Exclude unfinished replies/report outputs; retain source links/cutoff.
- [ ] Never silently omit inputs. Define/test context budgets and coverage-preserving chunk/synthesis if needed; otherwise fail clearly without saving partial coverage as complete.
- [ ] Atomically save validated reports/source metadata. Explicit regeneration creates a revision; failures preserve saved versions. Empty days make no AI call.
- [ ] Add safe Markdown reading, date-ordered archive, generated time/cutoff, and reloadable revisions.
- [ ] Add deterministic service/prompt tests and synthetic multi-chat fixtures for English/Chinese, coverage, and fabricated-fact avoidance.

Acceptance: a chosen day across chats yields a saved summary/highlights, excludes other dates, and survives reload. Test empty day, context overflow, and provider failure; review at 375px. v1 ends here.

## M4 — Scheduled reports (v1.5)

- [ ] Choose a small in-process scheduler, local run time, and IANA timezone configuration (for example 21:00).
- [ ] Call the report service directly, with persisted daily job keys, duplicate prevention, and safe retries.
- [ ] Decide missed-run/catch-up policy and interaction with manual reports/regeneration. Make it clear the server must be awake/running; a 21:00 report is a snapshot, not the entire future day.
- [ ] Test restarts, DST, repeated ticks, manual/scheduled overlap, and provider failures with a fake clock.

## M5 — Notebook tags and message search (v1.5)

- [ ] Define manual message/report tagging and vocabulary compatible with the notebook/archive concept, without requiring another project's backend.
- [ ] Add tag/join tables and UI; no compulsory AI auto-tagging.
- [ ] Add date/tag/keyword message search, bounded inputs, FTS5 evaluation, and parameterized short-query fallback.
- [ ] Test combined filters, literal wildcard handling, English/Chinese/mixed text, and one/two-character Chinese queries.

## Later / separate projects

Continuous voice, PDF export, email delivery, and explicit report-derived chat memory need separate proposals. Calendar/schedule import from Gmail or Outlook belongs to the personal agent/schedule project, not this app. Countdowns are another focused app. No multi-user, native app, model training, vector database, MCP, or hosted infrastructure work is implied.

## Open decisions (resolve at the relevant milestone)

1. M0: direct Claude SDK vs a small direct HTTP adapter, exact chat/report model IDs, context limits, and spending budget. The old openai package is not an Anthropic SDK.
2. M0/M2: STT provider/model, price/privacy, English/Chinese support, accepted browser audio formats, byte/duration limits, and timeout. Do not pick a paid provider silently.
3. M0: owner password-hashing/provisioning/recovery, session lifetime, and required crypto/security libraries. Only one local login, not passkey/TOTP account machinery.
4. M0: migration repair after inspecting actual data/application state. No destructive reset is authorized by the documentation rewrite.
5. M0/M3: confirm the owner's IANA timezone (legacy default Australia/Melbourne is not fresh confirmation); choose the report prompt language policy and supported context budget/chunk strategy.
6. M4: missed-run catch-up, schedule retry, and manual/scheduled duplicate behavior.
7. M5: tag vocabulary/archive presentation. Final app name, public URL/hosting, and cross-app backend sharing can wait.

## Decisions made during documentation reset

| Date | Decision / proposed default | Reason |
|---|---|---|
| 2026-11-15 | Replace the combined assistant with a notes-first AI chat journal; keep the repository name temporarily | Owner chose separate small apps and supplied chat/report requirements |
| 2026-11-15 | React/Vite + one local Hono Node/TypeScript server + SQLite | Reuse the confirmed stack and follow the requested local architecture |
| 2026-11-15 | Direct Claude API for chat/report; STT selection unresolved | Owner's new architecture supersedes the old runtime OpenRouter plan |
| 2026-11-15 | Full current-conversation history for chat; all selected-day conversations for reports | Keep chat threads isolated while the report summarizes the whole day |
| 2026-11-15 | Proposed: persist partial reply attempts but exclude unfinished replies from model history/reports | Preserve content without presenting incomplete AI text as complete |
| 2026-11-15 | Proposed: Markdown in SQLite, successful regeneration as a revision, explicit coverage cutoff | Avoid dual-write storage and preserve previous reports on failure |
| 2026-11-15 | Proposed: message creation time assigns its report day, even for cross-midnight replies | Deterministic message/day membership, to verify in M3 tests |
| 2026-11-15 | Scheduling/tags/search stay v1.5; no always-on server implied | Owner's release boundary; a local process cannot run while stopped |
| 2026-11-15 | Remove obsolete static-only v0 milestone; retain the independent personal-site plan | Old no-backend/five-screen rules conflict with the new app; site decisions remain useful |
| 2026-11-15 | Documentation only; no runtime/dependency/config/migration/workflow changes or deployments | Owner requested a documentation reset first |
| 2026-11-15 | Repository hosts only the AI chat journal; schedule/countdown routes, screens, calendar/gmail sync + OAuth settings, web-push reminder config, related legacy SQL tables, and the googleapis/ical.js dependencies removed | Owner decision: the schedule and countdown products move to another place |
| 2026-11-15 | Add hono as a direct dependency, drop the default DOM lib from the server tsconfig, add .js extensions for NodeNext relative imports, repair routes/index.ts to the existing routers, and pin engines.node >=22 | Fix the failing backend typecheck/build recorded as an M0 blocker |

## Validation record — documentation reset

Run on 2026-11-15 using the available Node v26.8.1 and pnpm 12.18.0, not the target CI Node 22. No dependencies were installed or changed, no providers called, and no deployment triggered.

| Check | Result |
|---|---|
| Documentation integrity | Passed: all 7 current Markdown files read/reviewed, 6 local links resolve, code fences balanced, no obsolete milestone links or temporary docs |
| git diff --check | Passed |
| pnpm typecheck:web | Passed |
| pnpm lint | Passed, exit 0 |
| pnpm test | Passed, exit 0; only the existing single placeholder test, not feature validation |
| pnpm build:web (as part of pnpm build) | Passed; legacy PWA/frontend artifact generated, with Vite __dirname config warning |
| pnpm typecheck | Failed, exit 2 in server checking before web check: unresolved Hono imports, NodeNext relative import extensions, implicit-any fallout, TypeScript DOM/Node type conflicts |
| pnpm build | Failed, exit 2 in server compilation after successful web build, with the same existing backend errors |

These are baseline scaffold blockers, left unchanged in this documentation-only task and assigned to M0. No live/browser feature validation was performed because no app functionality changed. Unchecked milestones above remain unimplemented regardless of the placeholder test result.

## Validation record — schedule/countdown removal (2026-11-15)

Follow-up to the documentation reset, executed on the owner's decision that this repository hosts only the AI chat journal. Removed: `src/server/routes/countdowns.ts`, `src/server/routes/events.ts`, `src/web/screens/ScheduleScreen.tsx`, `src/web/screens/CountdownsScreen.tsx`, their imports/nav/stats/settings references, the gcal/gmail sync and Google OAuth route lines, the Google/web-push/gmail-test `.env.example` entries with matching docker-compose variables, the calendar/email/OAuth/sync/push tables and events indexes in the never-executed `migrations/001_init.sql` (a scaffold file; `scripts/migrate.ts` does not run SQL), and the `googleapis`/`ical.js` dependencies via `pnpm remove` (lockfile updated). No feature was added and no provider was called.

| Check | Result |
|---|---|
| git diff --check | Passed |
| Straggler grep (countdown/calendar/gmail/gcal/vapid/google) | Only intentional documentation notes and the migration comment remain; no code references |
| pnpm install --frozen-lockfile | Passed; lockfile in sync with the trimmed package.json |
| pnpm typecheck:web | Passed |
| pnpm lint | Passed, exit 0 |
| pnpm test | Passed; only the pre-existing placeholder test |
| pnpm build:web | Passed |
| pnpm typecheck:server | Failed as before on pre-existing scaffold errors (unresolved hono imports, NodeNext relative-import extensions, DOM/Node type conflicts) — unchanged M0 blockers; no new errors from this removal |

Checks ran on 2026-11-15 with the available Node 26.8.1 and pinned pnpm 12.18.0, not the target CI Node 22. No deployment was triggered.

## Validation record — backend build fix (2026-11-15)

Fixed the failing server typecheck/build recorded as an M0 blocker. The failure was not the Node runtime version: `tsc` does not depend on the runtime, and CI already pinned Node 22. Root causes: (1) `hono` was missing from `dependencies` — only the `@hono/node-server`/`@hono/zod-validator` peer entries pulled it into the pnpm store, so TS2307 could not resolve it from `node_modules`; (2) `tsconfig.server.json` set no `lib`, so the default full lib loaded DOM types that conflict with `@types/node` 26 (`TS2430` TextDecoder/TextEncoder); (3) NodeNext module resolution requires explicit `.js` extensions on relative imports (`TS2835`); (4) `src/server/routes/index.ts` imported non-existent inbox/export/auth/mcp routers and composed with `Router` instead of `Hono`.

Changes: `pnpm add hono@^4.13.17` (matches the already-locked peer version; no other package versions changed), `"lib": ["ES2024"]` in `tsconfig.server.json`, `.js` extensions in `src/server/index.ts`, `src/server/db/index.ts`, and `src/server/routes/notes.ts`, `routes/index.ts` rewritten to mount only the existing health/notes routers, `engines.node >=22` in `package.json`, and stale `dist/server` orphans (countdowns/events artifacts from the pre-removal build) cleaned before rebuild.

| Check | Result |
|---|---|
| pnpm install --frozen-lockfile | Passed |
| pnpm typecheck:server | Passed (previously failed) |
| pnpm build:server, clean outDir | Passed (previously failed); dist/server/routes contains only health/index/notes |
| pnpm typecheck:web / lint / test / build:web | Passed |
| git diff --check | Passed |

Checks ran on 2026-11-15 with the available Node 26.8.1 and pinned pnpm 12.18.0; CI pins Node 22 with the same lockfile. No provider was called, no data or deployment was touched, and CI still does not typecheck/build the server (separate M0 item).
