# Data model — AI chat journal

> Proposed SQLite schema, not implemented migrations. See the implementation plan. Existing migrations/001_init.sql is incomplete legacy SQL; audit whether it has been applied before writing a migration strategy. Do not reset databases or rewrite applied migrations without approval.

## Conventions

- Local SQLite via better-sqlite3 repositories, foreign keys enabled. Store UTF-8 text and UTC ISO-8601 timestamps with consistent precision. UUIDs are generated in application code (Node crypto.randomUUID), not PostgreSQL SQL functions.
- Use stable per-conversation sequence numbers; timestamps alone cannot order simultaneous messages. Server assigns timestamps and IDs, not the model/browser.
- Explicit IANA timezone for date grouping and report boundaries. A report date is YYYY-MM-DD, not a UTC timestamp. Day queries use [start UTC, next local midnight UTC).
- Reports store Markdown TEXT in SQLite. Rendering and any future file/PDF export derive from that source. No audio BLOBs, audio files, calendar tables, or multi-user ownership model required.

## v1 tables

### conversations

| Column | Type / rule |
|---|---|
| id | TEXT primary key, UUID |
| title | TEXT, simple user/default title; AI title generation not required |
| created_at | TEXT NOT NULL, UTC |
| updated_at | TEXT NOT NULL, UTC |

Index updated_at for the conversation list.

### messages

| Column | Type / rule |
|---|---|
| id | TEXT primary key, UUID |
| conversation_id | TEXT NOT NULL, FK conversations.id |
| sequence | INTEGER NOT NULL, increasing within conversation |
| role | TEXT NOT NULL, user or assistant |
| content | TEXT NOT NULL, user text or assistant Markdown; only unfinished/failed assistant attempts may be empty |
| source | TEXT NOT NULL, text / voice / model |
| status | TEXT NOT NULL, pending / streaming / complete / interrupted / failed |
| client_request_id | TEXT, user-turn idempotency key; null for assistant rows |
| reply_to_message_id | TEXT, FK messages.id; user message for assistant attempts |
| attempt | INTEGER, assistant attempt number for that user turn |
| created_at | TEXT NOT NULL, UTC acceptance/attempt-start timestamp |
| updated_at | TEXT NOT NULL, UTC |
| completed_at | TEXT, UTC on successful completion |
| model | TEXT, actual Claude model for assistant reply |
| error_code | TEXT, sanitized category only, no raw provider error |

Unique (conversation_id, sequence), unique (conversation_id, client_request_id) where non-null, unique (reply_to_message_id, attempt) for assistant attempts. Index created_at and (conversation_id, sequence). Enforce role/source/status combinations and same-conversation reply links in the service/schema as appropriate.

User messages are committed complete before an AI call; voice content is the transcript. Assistant attempts transition pending -> streaming -> complete/interrupted/failed. Persist deltas in bounded checkpoints; recover pending/streaming attempts as interrupted after restart. Allow one active turn per conversation. Retries reuse the user message and create an assistant attempt, never duplicate user text.

Model history includes all user messages and complete assistant replies in sequence, not partial attempts. No automatic chat-history truncation or summary. Reports use messages whose created_at is in the selected local day, excluding incomplete assistant attempts. An assistant reply that crosses midnight belongs to its stored creation day; document/test this consistent rule. System prompts are versioned configuration, not user messages. Reports are not chat messages.

### reports

| Column | Type / rule |
|---|---|
| id | TEXT primary key, UUID |
| report_date | TEXT NOT NULL, selected local YYYY-MM-DD |
| timezone | TEXT NOT NULL, IANA |
| revision | INTEGER NOT NULL, starts at 1 per date/timezone |
| markdown | TEXT NOT NULL, validated nonempty report |
| generated_at | TEXT NOT NULL, UTC |
| input_cutoff_at | TEXT NOT NULL, UTC snapshot cutoff |
| period_start_at / period_end_at | TEXT NOT NULL, UTC half-open local-day interval |
| source_message_count | INTEGER NOT NULL |
| excluded_incomplete_count | INTEGER NOT NULL, unfinished assistant messages skipped |
| model / prompt_version | TEXT NOT NULL, provenance |
| trigger | TEXT NOT NULL, manual (scheduled added in v1.5) |

Unique (report_date, timezone, revision); index (report_date, generated_at). Save only successful reports; failures must not overwrite a revision. Allocate revisions transactionally. Read the latest revision by default; previous successful versions remain available.

### report_messages

| Column | Type / rule |
|---|---|
| report_id | TEXT NOT NULL, FK reports.id |
| message_id | TEXT NOT NULL, FK messages.id |
| position | INTEGER NOT NULL, source order in snapshot |
| Primary key | (report_id, message_id) |

Unique (report_id, position). Snapshot eligible input in a short read transaction; release it before network calls. Sort sources by created_at then conversation_id then sequence. Save report/source links atomically after generation. v1 has no message-edit/delete feature; any future mutation must preserve report provenance explicitly. No cascading deletion of report sources by accident.

### sessions and local credential

Sessions store a hash of an opaque token (primary key), created_at, expires_at, and last_seen_at, all UTC. Never store the plaintext session token. Store the single owner's salted password hash in protected local configuration; no users/signup/roles tables. Finalize credential provisioning, hashing library, cookie lifetime, and recovery in M0. Do not reuse the scaffold's passkey/TOTP multi-mode design by default.

### Operational diagnostics

Structured logs suffice for v1: task (chat/transcribe/report), model/provider, prompt version, timing, token usage if supplied, safe status/error category. A separate analytics/failure database is not a prerequisite. Do not preserve raw failed model output in diagnostic tables. Sensitive assistant text belongs only in its private message row; successful reports belong only in reports. Legacy ai_failures.raw_output is not the target design.

## v1.5 additions (not v1 migrations)

### tags, message_tags, report_tags

- tags: id TEXT PK, name TEXT NOT NULL UNIQUE, created_at UTC.
- message_tags: message_id FK messages.id, tag_id FK tags.id, composite primary key.
- report_tags: report_id FK reports.id, tag_id FK tags.id, composite primary key.
- Index join tables by tag_id for filtering. Tag assignment is explicit; automatic AI tagging is not required. Decide a shared notebook vocabulary before implementation; the legacy fixed tag config is not automatically authoritative. Tags apply to a specific saved report revision unless a later decision says otherwise.

### messages_fts

FTS5 mirrors complete searchable message content, kept consistent with inserts, assistant updates/status changes, and any future deletes. Test trigram tokenization with Chinese/mixed text before committing to it. Trigram queries shorter than three characters need a parameterized substring fallback; escape literal LIKE wildcards. Combine with date/tag filters, bound query length, and test 1–2 character Chinese queries explicitly.

### report_schedule and report_job_runs

One settings row stores enabled, local_time (HH:mm), timezone, updated_at. A run record has a unique job key for report_date/timezone, status, timestamps, safe error code, and optional report_id FK. Use this state to prevent duplicate scheduled reports after restarts/DST and coordinate with manual reports. Exact missed-run/retry/manual interaction policy is an open v1.5 decision, not an implemented guarantee.

## Storage and migration safety

Use transactions for user-turn creation/idempotency, stream finalization, and report/revision saves. Enable and test required SQLite pragmas, native binding, and schema version tracking in M0. Network calls never hold open a database transaction. Use online SQLite backups and test restore; do not require an S3 account.

The old SQL contains unsupported UUID defaults, duplicate session definitions, and references to undefined notes tables; its calendar-event/email-integration, Google OAuth, sync-state, and push-reminder tables were removed on 2026-11-15 with the schedule/countdown content, so the scaffold SQL file was edited but has never been executed. Decide an additive repair or an explicitly approved clean development baseline only after checking actual migration/data state.
