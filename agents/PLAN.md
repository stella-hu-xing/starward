# Build Plan

Work through milestones in order. Each milestone ends with a checklist. Tick items only when they are verified (tests pass and the feature works on a 375px viewport).

## Open questions (resolve before the milestone that depends on them)

| # | Question | Needed by | Recommended default if owner does not answer | Status |
|---|---|---|---|---|
| Q1 | Hosting: Oracle Cloud Always Free, cheap VPS, or home machine | M0 | GCP Compute Engine e2-micro (see ARCHITECTURE.md) | resolved |
| Q2 | Auth: passkey or password + TOTP | M0 | Passkey, with a printed recovery code | open |
| Q3 | Source of truth: SQLite primary with Markdown export, or Markdown files primary with SQLite as index | M1 | SQLite primary, Markdown export as archive | open |
| Q4 | ICS: file upload only, or also subscription URL sync | M3 | File upload in M3, subscription in a later milestone | open |
| Q5 | Chinese output: summaries and tags in Chinese, English, or match source | M1 | Match the language of the source note | open |
| Q6 | Countdown granularity: days only, or also hours and minutes | M2 | Days only, with years/months/days for "since" | open |
| Q7 | Voice: the client cannot reliably tell keyboard dictation from typing, so should `source` be recorded at all | M1 | Drop the `voice` value; keep `source = text` for all notes | open |
| Q8 | Gmail filter: which label or query identifies event-bearing emails | M5 | Owner provides a Gmail label name; default config is empty and the job does nothing until set | open |
| Q9 | Chinese search: FTS5 trigram tokenizer vs other approach | M1 | Trigram tokenizer, verified with Chinese test cases | open |
| Q10 | Model slugs for tags, date phrases, email extraction | M1 | Owner picks from OpenRouter after testing a few examples | open |
| Q11 | GCP region for the e2-micro: `us-west1`, `us-central1`, or `us-east1` (all free-eligible) | M0 | `us-west1`, then measure latency from the phone | open, default applied |
| Q12 | Backup target: S3 (AWS) or Cloud Storage (GCP) | M6 | S3, as planned in the README | open, default applied |

Anything not on this list that feels unclear: stop and ask the owner.

## Milestone M0: Project scaffold and deployment

Goal: an empty app runs in Docker behind Caddy on `app.stellahu.me` with HTTPS, and the health endpoint responds.

Tasks:
- Initialize pnpm, TypeScript (strict), Vitest, ESLint.
- Hono server serving `/api/health` and static files from `dist/web`.
- React + Vite PWA shell with manifest and service worker, showing an empty home screen.
- SQLite connection, migrations runner, first empty migration.
- Auth skeleton (login screen and session cookie) according to Q2.
- `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `.env.example`.
- OpenTelemetry Node SDK wired to Honeycomb (`HONEYCOMB_API_KEY`, see `ARCHITECTURE.md` Observability). HTTP auto-instrumentation on; a `/api/health` span visible in Honeycomb.
- `.github/workflows/ci.yml` (typecheck, lint, test on every PR), `deploy.yml` (manual, `production` environment with owner approval), and `agent.yml` (label-triggered, per `docs/DEV_ENVIRONMENT.md`). Agent workflow may be disabled until the Aider trial in M1.
- Repo `main` branch protection enabled.
- Deploy to GCP Compute Engine `e2-micro` following the "GCP setup" section of `docs/ARCHITECTURE.md`: billing budget alert, VM, static IP, firewall rules, DNS A record, Docker Compose run.

Acceptance:
- [ ] `pnpm build && pnpm test && pnpm typecheck && pnpm lint` all pass
- [ ] `docker compose up -d --build` starts both services
- [ ] `https://app.stellahu.me/api/health` returns 200 with valid TLS
- [ ] Home screen can be added to the iPhone home screen and opens full-screen
- [ ] Unauthenticated `/api/notes` returns 401
- [ ] Budget alert exists in GCP billing at $5/month
- [ ] VM is `e2-micro` in the region confirmed under Q11, with a static IP attached
- [ ] SSH (22) is not open to the internet; admin access works via Tailscale or IAP; 80 and 443 are open
- [ ] Honeycomb shows a trace for `/api/health` and a deploy marker with the git SHA
- [ ] Deploy workflow runs from GitHub Mobile and requires owner approval
- [ ] The first test run in `docs/DEV_ENVIRONMENT.md` passes: discuss mode makes no branch, `/go` produces a draft PR, and nothing reaches `main` without a merge

## Milestone M1: Notes capture, tags, search

Goal: capture a note on the phone, get tag suggestions, confirm tags, and find the note again by keyword and tag.

Tasks:
- Migration 001: `notes`, `note_tags`, `notes_fts` with triggers, `ai_calls`, `ai_failures`.
- `config/tags.json` with the initial vocabulary.
- `ai/suggestTags` with a prompt file (versioned), Zod output schema, and OpenRouter call through the `openai` SDK.
- `ai/extractDatePhrase` with the same structure. Resolution in `lib/dates.ts`.
- Notes API: create (returns draft), confirm tags, edit, soft delete, list by day, search (`q`, `tag`, `from`, `to`).
- Home screen: large input field, keyboard dictation works, tag chips to accept or dismiss, notes list grouped by day.
- Search screen with filters.
- Eval fixtures in `tests/fixtures/ai/tags/` with at least 30 cases including English, Chinese, and mixed.
- Resolve Q3, Q5, Q7, Q9, Q10 and record decisions in this file.

Acceptance:
- [ ] Creating a note with the phone keyboard microphone works in English and Chinese
- [ ] Note is saved even when the LLM call fails
- [ ] Suggested tags are always from `config/tags.json`
- [ ] "next Tuesday" is resolved to an absolute date using the note's timezone, with a unit test
- [ ] Keyword search finds a Chinese word in the middle of a sentence (test case in suite)
- [ ] `pnpm eval:ai` tag accuracy reported and recorded in this file

## Milestone M2: Countdowns

Goal: create countdowns and see them on the home screen.

Tasks:
- Migration 002: `countdowns`.
- `lib/dates.ts`: elapsed and remaining computation, yearly repeat, timezone handling.
- Countdowns API: CRUD, archive.
- UI: countdown cards on home, create and edit form.

Acceptance:
- [ ] Unit tests cover: day boundary in Australia/Melbourne across DST change, leap day target date, yearly repeat on Feb 29 (defined behavior: falls on Feb 28 in non-leap years, record this rule), "since" with a future date (show as "in X days", no negative numbers)
- [ ] Countdown values match an independent calculation for 20 sample dates

## Milestone M3: Schedule, manual events, ICS import

Goal: see agenda views, add events manually, import an `.ics` file.

Tasks:
- Migration 003: `events`, `event_candidate_sources` (empty for now).
- Events API: CRUD, list by date range.
- Views: today, next 7 days, agenda.
- Manual event form with all-day support.
- ICS upload endpoint (2 MB limit) and parser. Choose library (`node-icalendar` or `ical.js`) and record in this file.
- Re-import upserts by UID.

Acceptance:
- [ ] Creating an all-day event shows on the correct local date in Melbourne
- [ ] Importing the same `.ics` twice does not duplicate events
- [ ] Recurring events in ICS expand correctly for the next 60 days (test with an RRULE sample)

## Milestone M4: Google Calendar sync

Goal: confirmed Google Calendar events appear in the schedule and stay in sync.

Tasks:
- Google OAuth flow (`/api/auth/google/start` and `/callback`), tokens encrypted.
- Migration 004: `oauth_accounts`, `sync_state`.
- `integrations/google.ts`: calendar client with `syncToken` handling and 410 full resync.
- `gcal-sync` cron every 15 minutes and manual trigger from the UI.
- Settings screen showing last sync time and any error.

Acceptance:
- [ ] Connecting Google account works from the phone
- [ ] Creating an event in Google Calendar appears in the app within 15 minutes or after manual sync
- [ ] Deleting an event upstream marks it `cancelled` locally
- [ ] Re-running sync with no changes writes nothing (verified by row counts)
- [ ] Refresh token is stored encrypted (verified by inspecting the database)
- [ ] OAuth app is published to production in Google Cloud, not left in Testing (see README risks)

## Milestone M5: Gmail event extraction and review inbox

Goal: event-bearing emails produce candidate events the owner can accept or reject.

Tasks:
- Migration 005: `email_scans`, `event_candidate_sources`.
- `config/gmail-filter.json` (empty until Q8 is answered).
- `integrations/gmail.ts`: list messages by query, fetch metadata and plain-text body, never persist body.
- `ai/extractEvents` with prompt file, Zod schema, and candidate confidence.
- `gmail-scan` cron every 30 minutes, plus manual trigger.
- Review inbox screen: list candidates with subject and sender, accept (opens edit form), edit, reject.
- Retry policy: failed extraction retried at most twice, then marked failed and visible in the inbox as "could not read".

Acceptance:
- [ ] Gmail scope is `gmail.readonly` only (verified in OAuth consent screen)
- [ ] A test email (flight confirmation fixture) produces one candidate with correct departure time and timezone
- [ ] The same message is never processed twice (verified via `email_scans`)
- [ ] Rejecting a candidate prevents it from reappearing after the next scan
- [ ] Email bodies are absent from the database and logs (automated test scans for a sentinel string)
- [ ] Eval fixtures in `tests/fixtures/ai/email/` (at least 20, mixed English and Chinese) with recorded accuracy

## Milestone M6: Backup and export

Goal: nightly backups to S3 and a Markdown archive of notes.

Tasks:
- Backup target per Q12 (S3 by default). If Cloud Storage is chosen, add `integrations/gcs.ts` with the same interface as `integrations/s3.ts`.
- `integrations/s3.ts` with configurable endpoint.
- `backup` job: DB snapshot, upload, Markdown export, pruning.
- Manual export endpoint returning a zip of Markdown files.
- Visible warning in the UI when the last backup failed or is older than 36 hours.

Acceptance:
- [ ] Backup job uploads a DB snapshot that opens in SQLite and contains all rows (checked by row counts)
- [ ] Markdown export restores notes with tags and dates in frontmatter
- [ ] Pruning keeps exactly `BACKUP_RETENTION_COUNT` snapshots
- [ ] Simulated S3 failure produces a visible warning and a log entry

## Milestone M7: Read-only MCP server

Goal: from Claude chat, the owner can search and read notes.

Tasks:
- `/mcp` endpoint implementing MCP over HTTP with bearer token auth (`MCP_BEARER_TOKEN`).
- Read-only tools: `search_notes(query, tags?, from?, to?)`, `read_note(id)`, `list_tags()`, `recent_notes(limit)`.
- Results limited in size. Return snippets, not full note bodies, from search.
- Use the official MCP TypeScript SDK.
- Document how to add the connector in Claude settings.

Acceptance:
- [ ] Tools are callable from an MCP client test harness
- [ ] Requests without the bearer token are rejected
- [ ] Write operations are not exposed
- [ ] Owner confirms the connector works from the Claude app

## Milestone M8: Notifications and polish

Goal: morning digest and reminders, and a pass over mobile UX.

Tasks:
- Web Push subscription flow (after home-screen install).
- `digest` cron: morning summary with today's confirmed events and countdown milestones (e.g. 100 days, 1 year).
- Settings for quiet hours.
- Mobile UX pass: safe-area insets, keyboard overlap, dark mode.

Acceptance:
- [ ] Push notification arrives on the iPhone after home-screen install
- [ ] Digest respects the owner's timezone
- [ ] Layout passes manual check on iPhone Safari at 375px and 430px widths

## Decisions made during build

Record any default taken for an open question, with date and reason. Empty until the build starts.

| Date | Decision | Reason |
|---|---|---|
| | | |
