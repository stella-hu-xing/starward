# Data Model

SQLite (`/data/hub.db`). All text is UTF-8. All timestamps are UTC ISO-8601 strings (`2026-11-08T10:14:00Z`). Each time-bearing row that depends on a local timezone also stores an IANA timezone string.

Migrations live in `migrations/` as numbered SQL files, applied sequentially at startup. The first migration creates the initial schema (notes, note_tags, notes_fts, ai_calls, ai_failures); subsequent migrations add countdowns, events, sync_state, oauth_accounts, email_scans, event_candidate_sources, push_subscriptions, sessions, and auth_credentials across milestones as specified in `agents/PLAN.md`.

## Tables

### notes

| column | type | notes |
|---|---|---|
| id | TEXT PK | UUIDv7 |
| body | TEXT NOT NULL | Markdown text |
| source | TEXT NOT NULL | `text` default. `voice` only if the client can reliably tell (see open questions) |
| status | TEXT NOT NULL | `draft` (saved, tags not yet confirmed), `active`, `deleted` |
| created_at | TEXT NOT NULL | UTC |
| updated_at | TEXT NOT NULL | UTC |
| deleted_at | TEXT | UTC, soft delete; purge after 30 days |
| timezone | TEXT NOT NULL | IANA, e.g. `Australia/Melbourne` |
| mentioned_date | TEXT | `YYYY-MM-DD`, resolved date phrase, nullable |
| mentioned_date_phrase | TEXT | original phrase the model extracted, nullable |

Indexes: `(created_at)`, `(status, created_at)`, `(mentioned_date)`.

### note_tags

| column | type | notes |
|---|---|---|
| note_id | TEXT NOT NULL | FK → notes.id, ON DELETE CASCADE |
| tag | TEXT NOT NULL | must exist in `config/tags.json` at write time |
| PRIMARY KEY | (note_id, tag) | |

Index: `(tag)`.

### notes_fts (FTS5 virtual table)

Content table mirrors `notes.body`. Keep in sync with triggers on insert, update, and delete.

Chinese tokenization: FTS5's default tokenizer does not segment Chinese well. Evaluate the `trigram` tokenizer first (it works for substring search across CJK characters). Record the decision in `agents/PLAN.md`.

Short-query fallback: FTS5 trigram requires queries of at least 3 characters. For 1–2 character queries (common in Chinese), fall back to a parameterized `LIKE` scan on `notes.body` with an index-assisted date-range filter. This is acceptable at the expected data scale and must be tested explicitly.

### events

| column | type | notes |
|---|---|---|
| id | TEXT PK | UUIDv7 |
| title | TEXT NOT NULL | |
| start_at | TEXT NOT NULL | UTC |
| end_at | TEXT | UTC, nullable for point-in-time |
| timezone | TEXT NOT NULL | IANA |
| all_day | INTEGER NOT NULL | 0 or 1; if 1, `start_date`/`end_date` are the source of truth and `start_at`/`end_at` are set to UTC midnight of the local dates for convenience only |
| start_date | TEXT | `YYYY-MM-DD`, used for all-day |
| end_date | TEXT | `YYYY-MM-DD`, exclusive end for all-day |
| location | TEXT | optional |
| description | TEXT | optional |
| source | TEXT NOT NULL | `manual`, `gcal`, `ics`, `gmail` |
| source_id | TEXT | gcal event id, ICS UID, or gmail message id |
| source_sub_id | TEXT | optional stable discriminator: gmail candidate ordinal, ICS recurrence instance ID, gcal instance identity |
| status | TEXT NOT NULL | `confirmed`, `candidate`, `rejected`, `cancelled` |
| confidence | REAL | from extraction, nullable |
| created_at | TEXT NOT NULL | UTC |
| updated_at | TEXT NOT NULL | UTC |

Unique index: `(source, source_id, source_sub_id)` where `source_id` is not null. Indexes: `(start_at)`, `(status, start_at)`.

Rules:
- Candidates from `gmail` start as `candidate`. Accepting sets `confirmed`. Rejecting sets `rejected` and the same `(source_id, source_sub_id)` will not be re-proposed.
- `gcal` items are written as `confirmed`; upsert by gcal event ID. Cancelled upstream sets `cancelled`.
- `ics` items are written as `confirmed`; upsert by `(source_id=UID, source_sub_id=recurrence_instance_id)`; non-recurring events have empty `source_sub_id`.
- Manual events are `confirmed`; `source_id` is empty.
- Cross-source deduplication (same real event from Gmail and Google Calendar) is a future feature; out of scope for v1.

### event_candidate_sources

For Gmail candidates, the email metadata lives here, not on `events`.

| column | type | notes |
|---|---|---|
| event_id | TEXT PK | FK → events.id |
| message_id | TEXT NOT NULL | Gmail message id |
| thread_id | TEXT | |
| subject | TEXT | |
| sender | TEXT | display name and address |
| received_at | TEXT | UTC |

Do not store the message body.

### email_scans

| column | type | notes |
|---|---|---|
| message_id | TEXT PK | Gmail message id |
| scanned_at | TEXT NOT NULL | UTC |
| status | TEXT NOT NULL | `ok`, `no_events`, `failed` |
| attempts | INTEGER NOT NULL | default 1, max 3 |
| prompt_version | TEXT | |
| model | TEXT | OpenRouter slug used |

### countdowns

| column | type | notes |
|---|---|---|
| id | TEXT PK | UUIDv7 |
| label | TEXT NOT NULL | |
| target_date | TEXT NOT NULL | `YYYY-MM-DD` in the countdown's timezone |
| timezone | TEXT NOT NULL | IANA |
| direction | TEXT NOT NULL | `since` or `until` |
| repeat_yearly | INTEGER NOT NULL | 0 or 1 |
| archived | INTEGER NOT NULL | default 0 |
| created_at | TEXT NOT NULL | UTC |
| updated_at | TEXT NOT NULL | UTC |

### sync_state

| column | type | notes |
|---|---|---|
| key | TEXT PK | e.g. `gcal:primary`, `gmail:scan` |
| value | TEXT NOT NULL | JSON: syncToken, cursor, last run time |
| updated_at | TEXT NOT NULL | UTC |

### oauth_accounts

| column | type | notes |
|---|---|---|
| provider | TEXT PK | `google` |
| account_email | TEXT NOT NULL | |
| refresh_token_enc | BLOB NOT NULL | AES-256-GCM, nonce prepended |
| scopes | TEXT NOT NULL | space-separated |
| created_at | TEXT NOT NULL | UTC |
| updated_at | TEXT NOT NULL | UTC |

### ai_calls

Log of every LLM call, used for debugging and cost tracking. No raw personal content.

| column | type | notes |
|---|---|---|
| id | TEXT PK | UUIDv7 |
| task | TEXT NOT NULL | `tags`, `date_phrase`, `email_extract` |
| model | TEXT NOT NULL | OpenRouter slug |
| prompt_version | TEXT NOT NULL | |
| input_hash | TEXT NOT NULL | SHA-256 of the input |
| status | TEXT NOT NULL | `ok`, `validation_failed`, `error` |
| latency_ms | INTEGER | |
| prompt_tokens | INTEGER | |
| completion_tokens | INTEGER | |
| cost_usd | REAL | if returned by OpenRouter, else null |
| created_at | TEXT NOT NULL | UTC |

### ai_failures

Stores diagnostic information for LLM calls that failed validation, for manual review. Keep for 14 days.

| column | type | notes |
|---|---|---|
| id | TEXT PK | UUIDv7 |
| ai_call_id | TEXT NOT NULL | FK → ai_calls.id |
| error_category | TEXT NOT NULL | `validation_failed`, `schema_mismatch`, `empty_output`, `timeout` |
| validation_paths | TEXT | JSON array of failed Zod path strings (bounded length) |
| validation_error_summary | TEXT NOT NULL | short human-readable summary, no personal content |
| model | TEXT NOT NULL | OpenRouter slug |
| prompt_version | TEXT NOT NULL | |
| latency_ms | INTEGER | |
| created_at | TEXT NOT NULL | UTC |

Privacy rule: never persist raw model output, error objects that may embed it, or any input containing personal content. Only structured diagnostics are stored.

### sessions

| column | type | notes |
|---|---|---|
| id | TEXT PK | hashed session token |
| created_at | TEXT NOT NULL | UTC |
| expires_at | TEXT NOT NULL | UTC |
| last_seen_at | TEXT NOT NULL | UTC |

### auth_credentials

| column | type | notes |
|---|---|---|
| id | TEXT PK | |
| kind | TEXT NOT NULL | `passkey` or `password` or `totp` (depending on decided auth mode) |
| data_enc | BLOB NOT NULL | encrypted secret material or public key |
| created_at | TEXT NOT NULL | UTC |

### push_subscriptions

| column | type | notes |
|---|---|---|
| endpoint | TEXT PK | Web Push endpoint |
| keys_json | TEXT NOT NULL | p256dh and auth keys |
| created_at | TEXT NOT NULL | UTC |

## Derived values (not stored)

- Countdown elapsed or remaining values: computed in `lib/dates.ts`.
- "Today" and day grouping: computed in the owner's timezone at request time.
- Upcoming-events views: query `events` with `status = confirmed` and a date window.

## Export format (Markdown)

Each note exports to one file:

```markdown
---
id: 0190f2a4-...
created: 2026-11-08T21:14:00+11:00
tags: [diary, idea]
source: text
mentioned_date: 2026-11-10
---

Note body here.
```

Times in frontmatter use the note's own timezone offset so the file reads naturally.
