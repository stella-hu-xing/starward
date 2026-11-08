# Architecture

## Overview

One Node.js process serves the API and the built PWA on one origin. A reverse proxy terminates HTTPS. SQLite stores all structured data. Background jobs run in the same process on cron schedules. External calls go to Google APIs, OpenRouter, and S3.

```
Phone (Home Screen PWA)
   │  https://app.stellahu.me
   ▼
Caddy (reverse proxy, automatic HTTPS)
   │
   ▼
App container (Node 22)
   ├── Static PWA (Vite build)
   ├── /api/* (Hono)
   │     ├── auth        session login, passkey or password+TOTP (see open questions)
   │     ├── notes       capture, tag suggest, search, edit, delete
   │     ├── events      manual, ICS import, candidates inbox
   │     ├── countdowns  CRUD and computed display values
   │     ├── sync        manual trigger for Google Calendar sync
   │     └── export      Markdown bundle download
   ├── /mcp (phase M7, read-only, bearer token)
   ├── Jobs (node-cron)
   │     ├── gcal-sync     every 15 min
   │     ├── gmail-scan    every 30 min
   │     ├── digest        daily, morning, user timezone
   │     └── backup        nightly: DB snapshot + Markdown export to S3
   └── SQLite file (/data/hub.db) with FTS5
          │
          └── backups to S3 bucket (configured via env)

External: Google Calendar API, Gmail API, OpenRouter (LLM), S3, Web Push services
DNS: app.stellahu.me → host IP (A record at the DNS provider of the domain)
```

## Deployment

### V0 (completed in `agents/V0.md`)
Static frontend on Cloudflare Pages via GitHub Actions Direct Upload. No VM, Docker, Caddy, GCP, or backend. Deploy workflow documents this path. Domain `app.stellahu.me` attached to Pages; CNAME at Porkbun. Secrets in GitHub Actions secrets only.

### V1 (planned)
Target host: any Linux VPS with Docker. For M0, resolved to Google Cloud Compute Engine `e2-micro` (free-tier eligible), in the region chosen under `agents/PLAN.md` Q11 (default applied: `us-west1`); see `agents/PLAN.md` Q1. Keep deployment identical across hosts. Host choice is now resolved, not pending.

- `docker-compose.yml` defines two services:
  - `app`: built from the `Dockerfile`, exposes port 3000 internally, mounts `./data:/data` for the SQLite file.
  - `caddy`: official Caddy image, ports 80 and 443, reverse-proxies `app.stellahu.me` to `app:3000`, automatic certificates.
- Persistent data: `./data/hub.db` (database) and `./data/backups/` (local snapshot staging). Both are included in host backups.
- Updates: `git pull && docker compose up -d --build`. Migrations run at app startup.

## Dockerfile expectations

- Multi-stage build: install and build in a builder stage, copy only compiled `dist/`, production `node_modules/`, `migrations/`, `config/`, and server-side prompt templates into the runtime image. Runtime secrets come from environment variables; config and prompts are non-secret build inputs.
- Base image: `node:22-slim`.
- Run as a non-root user.
- Health endpoint at `/api/health`.

## Caddyfile (intent)

```
app.stellahu.me {
  encode zstd gzip
  reverse_proxy app:3000
}
```

## Configuration (environment variables)

All variables are listed in `.env.example`.

| Variable | Purpose |
|---|---|
| `APP_BASE_URL` | `https://app.stellahu.me` |
| `SESSION_SECRET` | signs session cookies |
| `OWNER_EMAIL` | the single allowed user identity for login |
| `AUTH_MODE` | `passkey` or `password_totp` (pending decision) |
| `OPENROUTER_API_KEY` | LLM access |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | OAuth |
| `TOKEN_ENCRYPTION_KEY` | 32-byte key, base64, for encrypting refresh tokens |
| `TIMEZONE` | default IANA timezone, e.g. `Australia/Melbourne` |
| `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` (optional) | backups |
| `BACKUP_RETENTION_COUNT` | default `30` |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push |
| `MCP_BEARER_TOKEN` | auth for the MCP endpoint (phase M7) |
| `DATA_DIR` | default `/data` |

Non-secret model choices live in `config/models.json`:

```json
{
  "tags": "<openrouter model slug, cheap>",
  "dateResolution": "<openrouter model slug, cheap>",
  "emailExtraction": "<openrouter model slug, stronger>"
}
```

Fill in the slugs during M1 after testing against the owner's examples.

## Key flows

### Note capture
1. Client POSTs text to `/api/notes`.
2. Service stores the note immediately (untagged, status `draft`).
3. Service calls `ai/suggestTags`. On success, returns suggestions in the response; client shows them.
4. Client POSTs confirmed tags to `/api/notes/:id/tags`. Only tags in `config/tags.json` are accepted.
5. If the note contains a date phrase, `ai/extractDatePhrase` returns it; `lib/dates.ts` resolves it; client confirms.

Note: the note is saved before AI runs, so an AI outage never loses content.

### Gmail event extraction
1. `gmail-scan` job lists messages matching `config/gmail-filter.json` newer than the last scan cursor.
2. For each new message id not already in `email_scans`, fetch subject, sender, date, and plain-text body.
3. Call `ai/extractEvents` with the fields above. Output validated against the event candidate schema.
4. Each candidate becomes an `events` row with `status = candidate`, `source = gmail`, and `source_id` pointing at the message id.
5. Record the message id in `email_scans` regardless of result, so messages are not reprocessed. Failed extractions are recorded with `status = failed` and retried at most twice.
6. Discard the body from memory after the call. Do not persist it.

### Google Calendar sync
1. `gcal-sync` loads the stored `syncToken` (if any) and calls `events.list` with `singleEvents=true`.
2. Upserts events by `(source='gcal', source_id)`. Cancelled events are soft-deleted.
3. On HTTP 410, clears the token and does a full sync.
4. Stores the new `syncToken`.

### ICS import
1. User uploads `.ics` (max 2 MB).
2. Parse with an ICS library (`ical.js` or `node-ical`; pick one and record the choice in `agents/PLAN.md`).
3. Each VEVENT becomes an event with `source = ics`, `status = confirmed`, `source_id = UID`. Re-import upserts by UID.

### Countdown display
Computed on the server for the card (days, and years/months/days for "since"), using the stored timezone. Client renders. Logic lives in `lib/dates.ts` and is unit-tested.

### Nightly backup
1. Create a consistent snapshot of `hub.db` with SQLite's online backup API.
2. Upload snapshot to `s3://<bucket>/db/YYYY-MM-DD.db`.
3. Export all non-deleted notes as Markdown with frontmatter to `s3://<bucket>/notes/` (one file per note, filename from creation timestamp and id).
4. Prune snapshots older than `BACKUP_RETENTION_COUNT`.
5. Log success or failure. A failed backup must surface on the next app load as a visible warning.

## Authentication

Single owner. Two candidate modes (decision pending):

- **Passkey (WebAuthn)**: registered once on the owner's iPhone, works with Face ID. No passwords stored. Requires a recovery path, such as a second registered device or a one-time recovery code printed at setup.
- **Password + TOTP**: a password hash (argon2id) and a TOTP secret for an authenticator app.

Either way: session cookie `HttpOnly`, `Secure`, `SameSite=Lax`, with sliding expiry of 30 days. CSRF protection on state-changing routes.

## Observability

- OpenTelemetry Node SDK wired to Honeycomb (`HONEYCOMB_API_KEY`).
- HTTP auto-instrumentation on; a `/api/health` span visible in Honeycomb.
- Custom spans/metrics for LLM calls: model slug, prompt version, latency, token usage, cost if returned, success or validation failure.
- No personal content in logs or traces; structured logs only through `src/server/lib/logger.ts`.

## Security and isolation notes

- Shared single VM: if the app and any process share the host, isolate credentials and limit process scope; do not treat a single user as a multi-tenant boundary.

## Deployment safety

- Migrations are append-only; never edit an applied migration, add a new one.
- Rollback procedure for an older application version is a code checkout plus redeploy; database rollback is not automatic and requires a tested restore path.

## Non-goals for architecture

- No Kubernetes, no message queue, no separate worker process in v1. Cron in-process is enough.
- No Redis. Session storage in SQLite.
- No CDN. Static files are small and served from the same origin.
