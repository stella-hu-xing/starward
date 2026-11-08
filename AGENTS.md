# AGENTS.md

Instructions for coding agents working in this repository. Read `README.md`, all files in the `agents/` folder before making changes.

## Stack (fixed unless the owner changes it)

- Language: TypeScript, `strict: true` in all packages.
- Runtime: Node.js 22 LTS.
- Backend: Hono, served from one Node process.
- Frontend: React + Vite, built as a PWA (manifest and service worker via `vite-plugin-pwa`). Built files are served by the same Hono process.
- Database: SQLite via `better-sqlite3`, with FTS5. Access only through the repository layer in `src/db/`.
- Validation: Zod. Every external input and every LLM output is validated with a Zod schema.
- LLM: OpenRouter through the `openai` SDK with `baseURL: https://openrouter.ai/api/v1`. Models are configured by slug in config, never hard-coded in feature code.
- Google: `googleapis` package, OAuth 2.0, scopes `calendar.readonly` and `gmail.readonly`.
- Scheduling: `node-cron`, in-process.
- Tests: Vitest. Frontend component tests optional in v1.
- Packaging: Docker, with `docker-compose.yml` running the app and Caddy as the reverse proxy.
- Package manager: pnpm. Use a monorepo layout only if it stays simple; a single package with `src/server` and `src/web` is the default.

## Repository layout (target)

```
personal-hub/
  AGENTS.md
  README.md
  agents/
  config/
    tags.json               # fixed tag vocabulary
    models.json             # OpenRouter model slugs per task
    gmail-filter.json       # Gmail query for event extraction
  src/
    server/
      index.ts              # app entry, mounts routes and static files
      routes/               # notes, events, countdowns, inbox, auth, sync, export
      services/             # business logic, no HTTP types here
      ai/                   # ALL LLM calls live here
      integrations/         # google.ts, ics.ts, s3.ts
      jobs/                 # cron jobs: gcal-sync, gmail-scan, backup, digest
      db/                   # connection, migrations, repositories
      lib/                  # dates.ts, timezone helpers, errors, logger
    web/                    # React PWA
  migrations/               # numbered SQL files, applied at startup
  tests/
  Dockerfile
  docker-compose.yml
  Caddyfile
  .env.example
```

## Commands

- `pnpm install`
- `pnpm dev`: runs the server and the Vite dev server with hot reload
- `pnpm build`: builds the web app and compiles the server
- `pnpm test`: runs Vitest
- `pnpm typecheck`: `tsc --noEmit` for all code
- `pnpm lint`: must pass before a task is considered done
- `pnpm db:migrate`: applies pending migrations
- `pnpm eval:ai`: runs extraction fixtures in `tests/fixtures/ai/` against configured models

Do not mark a task complete unless `typecheck`, `lint`, and `test` pass.

## Conventions

- Put business logic in `services/`. Route handlers only parse input, call a service, and return output.
- Put every LLM call in `src/server/ai/`. Each call has: a prompt template file with a version string, an input builder, a Zod output schema, and a function that returns a typed result or a typed error. No LLM calls from routes or jobs directly.
- LLM output that fails Zod validation must not be written to domain tables. Store it in an `ai_failures` table for review, and surface a readable error.
- All timestamps are stored as UTC ISO-8601 strings with the user's IANA timezone stored alongside when relevant. Convert to local time only in the UI or in `lib/dates.ts`.
- Date phrases from the LLM ("next Tuesday") are resolved by deterministic code in `lib/dates.ts` using an explicit anchor date and timezone. Never let the model compute absolute dates.
- Never store Gmail message bodies. Store only the metadata listed in `agents/DATA_MODEL.md`.
- Secrets come from environment variables only. Never commit `.env`. Add any new variable to `.env.example` with a comment.
- Log through `lib/logger.ts`. Never log email bodies, OAuth tokens, or full prompts containing personal content.
- Migrations are append-only. Never edit an applied migration; add a new one.
- Prefer small, explicit functions over clever abstractions. No generic "repository framework".
- Chinese text must work everywhere: UTF-8 in the database, FTS search tested with Chinese input, UI fonts that render Chinese.

## Rules for changes

- Do not add new services, databases, or hosted dependencies without asking the owner first. Free-tier-first applies.
- Do not change the stack in this file without asking.
- Do not implement Outlook, audio storage, multi-user support, billing, or vector search. They are out of scope for v1.
- If a requirement is ambiguous, check `agents/V0.md` for the defined v0 boundary. If the request falls inside v0, apply the documented scope; if it requires backend work, it is v1+ and goes to `agents/PLAN.md` open questions.
- Do not add backend code, Dockerfile, docker-compose.yml, Caddyfile, VM infra, database migrations, auth, API routes, or feature integrations in v0. Those are deferred to later milestones.
- Record any default taken for an open question in `agents/PLAN.md` under "Decisions made during build" with the date and reason.
- Keep commits focused: one milestone task per commit, with a message that names the milestone (for example `M1: add FTS search for notes`).

## Security rules

- Single-user auth. Every `/api` route requires an authenticated session except the login and health endpoints.
- Google refresh tokens are encrypted with AES-256-GCM using `TOKEN_ENCRYPTION_KEY` from the environment. Never store them in plain text.
- Webhook-style or cron endpoints must not be publicly callable. Cron runs in-process.
- Validate all uploaded `.ics` files for size (max 2 MB) and content type before parsing.

## Rules for automated agents (CI and phone-triggered)

These rules apply when an agent runs from `agent.yml` on an issue, in addition to everything above.

- In build mode, work only on the branch `agent/<issue-number>`. Never push to `main`, never force-push, never modify branch protection.
- Do not change `.github/workflows/`, `Dockerfile`, `docker-compose.yml`, `Caddyfile`, or anything that reads or writes secrets, unless the issue explicitly asks for it and the PR is labelled `needs-laptop-review`.
- Do not add or read `.env` values, tokens, or keys. Use environment variable names from `.env.example` only.
- Do not add telemetry that includes personal content. Follow the privacy rules in `agents/ARCHITECTURE.md`.
- Keep each change to one milestone task. If the issue spans several tasks, do the first and note the rest in the PR description.
- Run `pnpm typecheck && pnpm lint && pnpm test` before opening the PR. If tests fail after one retry, stop and comment on the issue with the failure summary.
- Open a draft PR. Do not mark it ready for review.
- Record the model slug and approximate token usage in the PR description.
- Each run is a new session. Before changing anything, read the full issue thread, the PR review comments, and the PR description's "Decisions" section. Treat those as the source of truth for what was agreed.
- In discuss mode, you may only read the repo and comment on the issue. Do not create branches, commit, or open PRs. Propose a plan, state trade-offs, and ask questions as needed. Do not guess the owner's intent.
- Move to build mode only when the owner has commented `/go`. Never start building on your own judgement.
- When an owner comment changes a decision, update the PR description's "Decisions" section in the same run.

## Done means

- The feature works in the browser on a mobile viewport (375px wide).
- It is covered by tests at the service level.
- It is listed in the milestone's acceptance checklist in `agents/PLAN.md`, and that checklist is ticked.
