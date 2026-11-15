# Architecture — AI chat journal

> Target backend design, 2026-11-15; not implemented by the current server scaffold. The responsive Chat/Journal frontend is an in-memory mock UI, not an integration with the flows below. See the implementation plan for completed work and sequencing.

## One app, one local server

```text
React + Vite browser UI
   | same-origin JSON, multipart audio, streamed events
   v
Local Node.js 22 + TypeScript + Hono (loopback)
   |-- routes: local login, conversations, chat, transcription, reports
   |-- services: durable chat, report snapshots, archive
   |-- ai: Claude streaming/report prompts; speech-to-text adapter
   |-- db: repositories -> better-sqlite3 -> local SQLite file
   |-- built frontend files
   `-- v1.5 in-process scheduler -> report service

External calls: Claude API and a speech-to-text API
```

Keep the existing React/Vite/Hono/Zod/SQLite/Vitest stack. Use direct Claude API access instead of the legacy OpenRouter runtime design. The Claude integration and STT provider/model/limits must be selected in M0 before dependencies or credentials change. No external queue, database server, worker app, or three separate Node services.

Development uses Vite with an /api proxy to the local backend; the built app uses one origin. Both dev and backend listeners should be loopback-only. The existing dev:web command binds all interfaces and must change during M0 before sensitive content is used.

## HTTP surface (planned)

| Route | Responsibility |
|---|---|
| POST /api/login, POST /api/logout, GET /api/session | Single local owner session; no registration |
| GET /api/health | Minimal liveness, no private data |
| POST /api/conversations, GET /api/conversations | Start/list conversations |
| GET /api/conversations/:id/messages | Reload durable ordered history |
| POST /api/chat | Accept conversation ID, client request ID, message; stream typed events |
| POST /api/transcribe | Bounded multipart audio upload; return transcript |
| POST /api/report | Selected local date/timezone; generate or explicitly regenerate |
| GET /api/reports, GET /api/reports/:id | Archive and saved Markdown/revision metadata |

Transport details are proposed contracts, to finalize with tests. Streaming uses fetch POST plus an SSE-formatted response: durable message IDs, text deltas, completion, sanitized error. Do not put message text in URLs. Only login and minimal health are unauthenticated; session inspection returns an unauthenticated status without private data.

## Chat flow

1. Validate session, origin, input, conversation ID, and idempotency key.
2. Persist the user message and create its assistant attempt before contacting Claude. Allow only one active turn per conversation; duplicate submissions must not create duplicate user messages.
3. Load the full current conversation in stable sequence, including the new user message and only complete assistant replies. Failed/interrupted assistant attempts stay visible but are excluded from model history. Never mix other conversations into v1 context.
4. Send history plus a versioned system prompt through the server-side Claude adapter. Model IDs are configurable, not scattered through feature code. No report-memory injection in v1.
5. Stream deltas and checkpoint assistant text with bounded writes. Finalize complete only on a successful provider finish; mark disconnect, cancellation, timeout, or process-recovery interruptions explicitly.
6. Preserve the user message and any partial reply on failure. Retry references the existing turn and adds an assistant attempt, not duplicate user text. Show context-limit errors without silently truncating/summarizing history.

## Push-to-talk flow

Microphone gesture -> record temporary clip -> stop -> upload -> STT -> transcript -> normal chat submission, source=voice. No recording occurs without permission; show recording/transcribing/sending/error states. A denied microphone must not block text chat. Keyboard dictation is ordinary text because the app cannot identify it reliably.

Choose provider-supported browser formats (including the target mobile browser), maximum bytes/duration, timeout, and English/Chinese support in M0. Do not trust MIME labels alone. Dispose of audio buffers/temp files on every exit path; never archive audio. A transcription failure must not create an empty chat message. If chat submission fails after transcription, retain the transcript for retry.

## Report flow

1. Validate selected YYYY-MM-DD and IANA timezone. Compute UTC start/end from consecutive local midnights, including DST changes.
2. Snapshot that day's user messages and complete assistant messages across conversations. Record source IDs, ordering, cutoff, and excluded unfinished reply count. Do not substitute whole conversations just because they started that day.
3. Empty input returns an empty state without a provider call. Otherwise ask Claude for Markdown with a summary and highlights, preserving conversation attribution and uncertainty. User content is evidence, not instructions overriding the report prompt.
4. Include all eligible input. If a day's input exceeds the report context budget, use tested coverage-preserving chunk summaries and synthesis with provenance, or fail clearly without saving a partial report as complete.
5. Validate nonempty Markdown and save report plus source links atomically. Regeneration creates a revision only on success; preserve earlier versions on all failures.
6. Render safely in the archive. Reports are app data, not appended chat messages; they do not feed back into their own source or future chats in v1.

Reports for today are snapshots, including scheduled reports at 21:00. Later messages require regeneration; show generated time and coverage cutoff.

## Scheduling and archive (v1.5)

Use a small in-process scheduler (node-cron is a candidate, not currently installed). Invoke the report service directly, not a self-HTTP call or public cron route. Configure IANA timezone and local run time. Persist a daily job key so restarts/DST/manual generation cannot accidentally duplicate scheduled reports. Explicit regeneration remains possible.

The job cannot run while the computer sleeps or the server is stopped. Missed-run catch-up and duplicate policy must be resolved and tested before scheduling ships. No always-on hosting is implied. Tags/search are independent v1.5 migrations, not prerequisites for manual v1 reports.

## Local security and privacy

- One owner credential, no signup. Select a maintained password-hashing implementation in M0; store only a salted password hash and hashed opaque session tokens. Cookies are HttpOnly and SameSite; use Secure when served over HTTPS. Enforce trusted origins/CSRF protection and rate-limit login and costly calls.
- Bind to loopback and do not expose the scaffold directly. Remote mobile use requires a separate decision on HTTPS, authentication, and networking; browser recording needs a secure context (localhost or HTTPS).
- Keep Claude/STT keys server-side. Only the current conversation goes to Claude for chat; report generation sends selected-day content across conversations; STT receives the temporary audio clip. Document provider data-handling/cost implications before use.
- Escape/sanitize rendered Markdown and links. No raw HTML execution or default caching of private API/stream responses by the PWA service worker.
- Logs contain task/model/prompt version/timing/token counts and safe error categories only. No message bodies, audio, transcripts, reports, prompts, raw provider errors, or credentials. No Honeycomb/OpenTelemetry service required.
- SQLite and reports contain private plaintext; rely on local disk permissions/encryption and keep runtime data outside version control. Markdown is stored in SQLite as source text, not a required duplicate file tree. Use consistent local SQLite snapshots for backup/restore tests; no S3 integration is required.

## Configuration and implementation boundary

Target configuration: loopback host/port, local data directory, owner password hash/session settings, IANA timezone, Claude key and configurable chat/report model IDs, STT key/model/format limits. v1.5 adds report time and schedule enablement. Finalize variable names and update .env.example with the implementation, without putting keys in VITE-prefixed variables.

After the 2026-11-15 tidy-up, .env.example and config cover only loopback port, data directory, database path, and timezone; the OpenRouter/S3/MCP/Honeycomb entries, placeholder notes routes, and the unused openai dependency were removed. Claude/STT key names and owner-credential settings remain open M0 decisions and are added with their implementation.

The old server entry does not start a working Node listener, database initialization is a stub, the migration is incomplete, and the health test is a placeholder. M0 must establish a real listener, SQLite setup, and reproducible checks before feature work.

The Cloudflare Pages deploy workflow and the Docker/Caddy/docker-compose files were removed on 2026-11-15 as legacy scaffolding that cannot run this local backend, persist SQLite, or schedule jobs. CI now typechecks and builds the server but still lacks repository/HTTP tests. Public production deployment, domain assignment, containerization, and API-origin splitting are deferred; the personal-site plan remains independent.
