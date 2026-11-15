# Implementation plan — AI chat journal

> Updated 2026-11-15. Baseline toolchain repairs and the responsive mock Chat/Journal UI are complete. Checked items record delivered work; unchecked items remain planned. The backend is still scaffold code, and mock UI completion does not complete M0–M3.

## Delivery order

Foundation -> text chat -> push-to-talk -> daily reports/archive. v1 requires all four milestones. Report scheduling, tags, and search follow in v1.5. The schedule/countdown products were removed from this repository on 2026-11-15 for a move to another project; do not split effort across them or production hosting.

## Completed — Mock Chat/Journal UI (2026-11-15)

Delivered and merged in PR #13 (`3fd6cb3`). This is a typed, in-memory demo, not durable chat or generated reports.

- [x] Replace Home/Notes with Chat/Journal/Settings navigation and shared React state.
- [x] Add six synthetic English/Chinese conversations, timestamps, voice-source fixture labeling, canned replies, and static daily summaries.
- [x] Create/select chats, auto-grow the composer, reveal canned assistant replies progressively, and block new turns while the selected chat is streaming. Preserve Chinese IME composition on Enter.
- [x] Render basic chat Markdown as React nodes without raw HTML or executable links.
- [x] Add a Monday-first month calendar, previous/next/Today controls, selected-day details, conversation counts, topic labels, summary coverage metadata, and links back to chats.
- [x] Group eligible messages across conversations by explicit IANA timezone; exclude unfinished assistant messages. Keep `Australia/Melbourne` as a demo default, pending owner confirmation.
- [x] Add 12 calendar helper tests for day keys, timezone/DST conversion, leap years, month arithmetic/grids, cross-chat aggregation, unfinished-assistant exclusion, empty data/months, and labels.
- [x] Add responsive drawer/close controls, safe-area padding, compact mobile calendar with readable topics in day details, 44px minimum-height primary controls, and landscape spacing.
- [x] Check Chat/Journal/Settings in headless Chrome at 320×640, 375×812, 430×932, 768×1024, 1280×800, and 667×375: no document horizontal overflow; composer visible. Check drawer bounds, New chat dismissal, and dark-mode colors.
- [x] Pass full typecheck, lint, all 13 tests (12 calendar tests plus the pre-existing placeholder health test), frontend production build, formatting, and Git whitespace checks.
- [ ] Finish physical-phone keyboard/notch checks and visual acceptance; headless geometry checks do not replace these.

Reloading resets demo state. No provider/API integration, database persistence, recording/transcription, report generation, report revisions, or login is implemented by this UI work. M1/M3 below track the remaining durable feature work.

## M0 — Local runtime and persistence (v1)

- [x] Establish pinned Node 22/pnpm and baseline typecheck/lint/test/build. Fix missing Hono declarations/dependency, NodeNext imports, and TypeScript/Node type compatibility in a focused task.
- [ ] Review better-sqlite3 build-script approval/native compatibility; verify real SQLite read/write with a temporary database.
- [ ] Start a real Hono Node listener; serve built UI/API on one local origin. Bind backend and Vite to loopback; verify a real HTTP health check.
- [ ] Audit migration/data state and choose a safe repair path. Implement migration tracking, repositories, the v1 schema, and backup/restore tests. Never reset data without approval.
- [ ] Finalize Claude integration, chat/report model IDs, STT provider/model/audio limits, owner credential provisioning/hashing, and timezone. Update configuration and .env.example together.
- [ ] Implement local owner login/session, hashed credentials/tokens, private-route protection, origin/CSRF checks, and rate limits. No signup.
- [x] Replace legacy Home/Notes navigation with Chat/Journal/Settings using typed mock data (2026-11-15). This is an in-memory UI only; persistence, provider streaming, and summary generation remain M1/M3 work.
- [x] Retire remaining unrelated scaffold config/dependencies (2026-11-15 tidy-up): notes routes, openai package, eval:ai script, OpenRouter/S3/MCP/Honeycomb env entries, Docker/Caddy/compose files, Pages deploy workflow, and PWA api-response caching. PWA metadata/icon review is still open. Responsive mock UI work and its verified checks are recorded separately above.
- [x] Make CI typecheck/build the server too (2026-11-15 tidy-up). [ ] Real repository/HTTP tests and mocked providers remain open. Do not deploy the local backend via static Pages.

Acceptance: reproducible install, full passing checks, HTTP startup, session protection, migrations/restart persistence, disposable backup/restore, no browser secrets/private API caches. No paid API call required.

## M1 — Durable streaming text chat (v1)

- [x] Build the conversation view/composer, basic Markdown rendering, and timestamps (mock UI; see completed section).
- [ ] Connect create/list/reopen conversations to durable backend storage; restore history after reload/restart.
- [ ] Save user messages with conversation ID/timestamp before AI calls. Persist assistant attempts, stable sequence, and reloadable history.
- [ ] Send full current-conversation history including the new user turn. No unrelated chats, report memory, silent truncation, or history summarization.
- [ ] Stream typed deltas/completion/errors; persist checkpoints/status. Handle stop/disconnect/error/restart without presenting partial replies as complete.
- [ ] Prevent concurrent turns/duplicate submissions; retry without duplicating user text. Show context-limit/provider errors without losing content.
- [x] Check mock UI layout at 375px and other phone/tablet/desktop sizes (headless Chrome; scope above).
- [ ] Test payload order, conversation isolation, persistence, idempotent retries, interrupted attempts, and safe Markdown; repeat responsive acceptance with the integrated backend.

Acceptance: two independent chats survive reload/restart; mocked replies stream incrementally; AI failure preserves user text; tests assert full history. Live smoke tests are opt-in, synthetic, and budgeted.

## M2 — Push-to-talk (v1)

- [ ] Implement microphone gesture/permission/recording/stop/upload using target-browser-supported formats.
- [ ] Validate size/type/duration/timeout limits; transcribe with the selected STT adapter and dispose of audio on every exit path.
- [ ] Send nonempty transcript through normal chat, source=voice. Retain transcript for retry if chat fails; no empty messages after STT failure.
- [ ] Test denied microphone, unsupported formats, upload limits, cancellation, STT failure, cleanup, and typing fallback.
- [ ] Verify English/Chinese/mixed recordings and target browser/device using non-sensitive samples. Live API tests are opt-in.

Acceptance: a spoken turn becomes a durable timestamped message and streaming reply; no permanent audio. Continuous transcription is not required.

## M3 — Daily reports/archive (v1)

- [x] Add calendar date selection, selected-day activity/empty states, and static summary metadata in the Journal mock UI.
- [ ] Add Generate report action with progress, errors, and backend empty-day handling.
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
## Validation record — scaffold tidy-up before real chat (2026-11-15)

Goal: remove legacy out-of-scope scaffold so M1 chat work starts from a clean, consistent main. The pending README/router edits on `update-doc` were committed and the branch was fast-forward merged into main; nothing was pushed. Removed: placeholder notes routes and their mounts, the unused openai dependency (via `pnpm remove`, lockfile updated), the eval:ai script and scripts/eval-ai.ts, the Cloudflare Pages deploy workflow, Dockerfile/Caddyfile/docker-compose.yml, and the OpenRouter/S3/MCP/Honeycomb environment entries. config.ts and .env.example now cover only port, data directory, database path, and timezone; the database default filename changed hub.db -> starward.db (no database file exists yet). Owner-credential and provider-key variables are deliberately not pre-declared; they return with their M0 implementation. migrations/001_init.sql (never applied; scripts/migrate.ts runs no SQL) was repaired: the duplicate sessions table and duplicated expires_at column were removed, gen_random_uuid() UUID columns became app-generated TEXT keys, and the notes/tag tables plus indexes referencing a nonexistent notes table were removed; it remains a scaffold pending the M0 v1-schema audit against DATA_MODEL.md. vite.config.ts no longer runtime-caches api.* responses (AGENTS privacy rule) and lost the /mcp proxy; dev:web now binds 127.0.0.1 instead of 0.0.0.0. CI now typechecks and builds the server and no longer uploads a web artifact. Stale dist/server notes orphans were cleaned before rebuild. No feature was added and no provider was called.

| Check | Result |
|---|---|
| pnpm install --frozen-lockfile | Passed |
| pnpm typecheck:server / typecheck:web | Passed |
| pnpm lint | Passed, exit 0 |
| pnpm test | Passed; 12 calendar tests plus the pre-existing placeholder health test |
| pnpm build:web / build:server (clean dist/server) | Passed; dist/server/routes contains only health/index |
| git diff --check | Passed |

Checks ran on 2026-11-15 with the available Node 26.8.1 and pinned pnpm 12.18.0; CI pins Node 22 with the same lockfile. Real HTTP/repository tests, the M0 listener/database, and provider selection remain open milestones.
