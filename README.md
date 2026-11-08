# Starward

**a PA just for Stella. Personal Assistant, Perfect Aligned**

A single-user, mobile-first web app (installable PWA) that combines three tools:

1. **Notes**: capture spoken-style diary entries and sudden ideas, auto-tagged and dated, searchable by keyword and tag.
2. **Schedule**: a personal calendar for planning weekends and holidays. Imports events from Google Calendar, from `.ics` files or subscription URLs, and from candidate events extracted out of Gmail.
3. **Countdowns**: track how long since, or how long until, a date (anniversaries, special events). Yearly repeat supported.

Hosted at `https://app.stellahu.me` (domain already owned: `stellahu.me`).

## Users

One user: the owner. Multi-user is out of scope for v1, but do not hard-code single-user assumptions into data access. Subscription is a possible future feature; do not build billing.

## Primary use cases

- **Spoken diary and idea capture.** The user dictates with the iPhone keyboard microphone (English and Chinese, mixed is common). Text lands in a note. Audio is never stored.
- **Weekend and holiday planning.** View upcoming events, add manual events, see imported calendar items.
- **Gmail event extraction.** Flight confirmations, bookings, appointments are turned into candidate events that wait in a review inbox. Nothing from email enters the schedule without explicit confirmation.
- **Anniversary and event countdowns.** "Days since X" and "days until Y", shown on the home screen.
- **Chat-based recall (later milestone).** From Claude chat, the user can search their own notes through an MCP server.

## Principles

- **Own the data.** Plain, exportable data. The database is a SQLite file. Notes can be exported to Markdown with frontmatter. Nightly backups go to S3.
- **Keep the stack portable.** One container, one origin, no vendor-specific services except external APIs (Google, OpenRouter) and S3 for backups.
- **Free or cheap first.** Prefer free tiers. Paid services only when no reasonable free alternative exists, and flag them before adding.
- **AI is a helper, never the authority.** LLM output is untrusted: validated with Zod, stored as a candidate or suggestion, and confirmed by the user before it becomes truth.
- **Deterministic date handling.** Models may extract a date phrase; deterministic code resolves it to an absolute date in the user's timezone.

## Functional requirements (v1)

### Notes

- Create a note by typing or dictating into a single large input on the home screen.
- Each note has: body (Markdown text), created timestamp, tags, source (`text` or `voice` — the client cannot tell voice from keyboard dictation, so default to `text`; see open questions).
- Tag suggestion: on save, an LLM proposes 0–3 tags from a fixed tag list in config. User can accept, edit, or dismiss. Only confirmed tags are saved.
- Fixed tag vocabulary lives in a config file (initial set: `diary`, `idea`, `todo`, `side-business`, `personal`). Adding a tag is a config change.
- Date extraction: if the note mentions a date ("next Tuesday", "3 May"), the LLM returns a phrase; the server resolves it and shows the result for confirmation. Otherwise the note's created date is the date.
- Search: full-text (SQLite FTS5) plus filters by tag and date range.
- List view grouped by day, newest first.
- Edit and delete notes. Deletes are soft (flag, purge after 30 days).
- Language: notes can be in English, Chinese, or mixed. Search must handle Chinese text; test FTS tokenization for Chinese early (FTS5 `trigram` tokenizer is a candidate; verify).

### Schedule

- Event fields: title, start, end, timezone, all-day flag, location (optional), notes (optional), source, status.
- Sources: `manual`, `gcal` (Google Calendar sync), `ics` (uploaded file or subscription), `gmail` (extracted candidate).
- Status: `confirmed` or `candidate`. Gmail-extracted and any auto-imported items that need review start as `candidate`.
- Review inbox: a list of candidates with accept, edit, and reject actions. Show the source email subject and sender, not the body.
- Views: today, next 7 days, and a month/agenda view. Mobile-first agenda is the default.
- ICS: upload `.ics` file (v1). Subscription URL sync is an open question.
- Gmail: scan messages matching a configured filter (label or query), extract candidate events with the LLM, write to the review inbox. Read-only scope. Do not store email bodies; store only the extraction result and source metadata (message id, subject, sender, date).

### Countdowns

- Fields: label, date, timezone, direction (`since` or `until`), repeat yearly (boolean).
- Display: home screen card per countdown with the number of days, plus a secondary detail (years, months, days for "since"). Granularity of hours/minutes is an open question.
- Yearly repeat: next occurrence is computed from the current date, in the stored timezone.
- All countdown arithmetic is deterministic code with unit tests. No LLM involved.

### Notifications

- Web Push to the installed PWA, for: daily morning summary (today's events, countdowns reaching a milestone), and reminders for confirmed events if the user enables them.
- iOS requires the PWA to be added to the home screen and the notification permission granted.

### Backup and export

- Nightly job: snapshot the SQLite database (`sqlite3 .backup` equivalent), upload to S3 with a date-stamped key, keep the last N snapshots (N configurable, default 30).
- Nightly job: export notes as Markdown files with frontmatter (`created`, `tags`, `source`) to S3 under a separate prefix.
- Manual export endpoint for the same Markdown bundle.

### Chat access (later milestone)

- Read-only MCP server exposing: `search_notes`, `read_note`, `list_tags`, `recent_notes`. Auth via bearer token. Details in `docs/PLAN.md`, milestone M7.

## Non-functional requirements

- **Mobile-first.** Designed for an iPhone in portrait. Tap targets at least 44px. Safe-area insets respected. Works offline for reading recent data (cache), writes queue until online (simple retry queue is acceptable for v1).
- **Security.** Single-user login. Secrets only in environment variables. OAuth refresh tokens encrypted at rest with a key from the environment. Never log email bodies, tokens, or full LLM prompts containing personal data. Rate-limit the login endpoint.
- **Privacy of AI calls.** Only send what the task needs. For email extraction, send the subject, sender, date, and body text of filtered messages only.
- **Observability.** Structured logs. Each LLM call logs: model slug, prompt version, latency, token usage, cost if returned, success or validation failure. No raw personal content in logs.
- **Reliability.** Background jobs are idempotent (re-running a sync does not duplicate events). Google sync uses stored `syncToken` and handles `410 Gone` by doing a full resync.
- **Testing.** Unit tests for date resolution, countdown math, tag validation, ICS parsing, and dedupe logic. Integration test for the notes API with a real SQLite file. Eval fixtures for extraction (see `docs/PLAN.md`).

## Out of scope for v1

- Outlook or Microsoft Graph
- Audio storage or in-app speech recognition
- Multi-user, sharing, billing, or subscriptions
- Native iOS or Android apps
- Vector search (added only after keyword search proves insufficient)
- Write access from chat (MCP is read-only in v1)

## Related docs

- `AGENTS.md`: instructions for the coding agent (conventions, commands, rules)
- `docs/ARCHITECTURE.md`: components, deployment, configuration
- `docs/DATA_MODEL.md`: tables, fields, indexes
- `docs/PLAN.md`: milestones, acceptance criteria, open questions
