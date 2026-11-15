# Agent instructions

Read the README and every document in the agents directory before changes. The README defines scope; the implementation plan defines milestones and open decisions.

## Current-state-only policy

Project files (code, comments, READMEs, specs, config) describe what the
system is now. Do not write history into them.

Do not add:
- dates or timelines ("as of 2026-11-15", "recently", "was changed to")
- references to removed or replaced components ("the legacy X was removed")
- migration notes, changelogs, or "previously" / "no longer" language
- comments explaining what code used to do

When a decision changes, update the affected files so they state the new
truth directly, and delete the outdated content. Do not leave a trace of
the old version.

Do not create decision logs, changelogs, or ADR-style files in the project until explicitly asked.

If a change makes existing text inaccurate, fix the text. If you're unsure
what the current truth is, ask rather than guessing.

## Product boundary

- Build one personal AI chat journal: text or push-to-talk conversation, followed by saved daily Markdown reports.
- v1: streaming chat, durable history, clip transcription, on-demand reports, report archive, one local login, responsive UI.
- v1.5: scheduled reports, tags, message search. Later: continuous voice, PDF/email, explicit report-derived memory.
- Schedule/countdown products are outside this repository's scope; do not add schedule/countdown features, calendar/email/ICS integrations, or a combined dashboard here. Also do not implement MCP, vector search, multi-user, billing, or model training.
- These docs describe a target, not completed functionality. Do not describe scaffold placeholders as working features.

## Stack and layout

- Strict TypeScript; Node.js 22 LTS; pnpm pinned by package.json.
- React + Vite. Existing PWA setup may be reused; offline AI/PWA polish are not v1 requirements.
- One local Hono Node server serves API and built UI. No three-server split or separate worker service.
- SQLite through better-sqlite3; database access only through repositories in src/server/db/.
- Zod validates external input, provider event envelopes, and structured output. Streamed chat and Markdown reports are text, not JSON extraction output.
- Target runtime chat/report provider: direct Claude API. Select the Anthropic integration and speech-to-text provider in M0; do not claim their SDKs are installed.
- Vitest tests. Check dependencies and the plan before adding libraries; ask before introducing additional services. Scheduling belongs to v1.5.

Server folders: routes/ for HTTP/streaming transport; services/ for business logic; ai/ for all provider calls and versioned prompts; db/ for connection/migrations/repositories; lib/ for dates/errors/logging; jobs/ only for v1.5. UI stays in src/web/, SQL in migrations/. Prefer explicit functions over generic frameworks.

## Required behavior

- Reconstruct full current-conversation history from SQLite. Browser-supplied history is not authoritative. No silent truncation, chat summarization, unrelated conversations, or report-memory injection in v1.
- Save user messages before provider calls. Record assistant completion/interruption/failure; preserve partial text and make retries idempotent. Interrupted text is not complete model history.
- Push-to-talk uses a temporary audio clip. Validate configured size/type/duration limits; release buffers/temp files on success, failure, or cancellation. No permanent audio archive or audio logging.
- Report boundaries use an explicit IANA timezone and [local midnight, next local midnight), converted to UTC. Never assume 24 hours or the host's implicit timezone.
- Reports cover all eligible messages that day across conversations from a fixed snapshot. Summary/highlights distinguish owner statements from AI suggestions. Do not invent facts.
- Never truncate report inputs silently. Validate nonempty Markdown before saving. Regeneration creates a revision; failure preserves saved reports. Empty days need no AI call.
- A future scheduler calls the report service, not a public cron endpoint. It needs an awake, running server; define duplicate prevention and missed runs before v1.5.

## Privacy and security

- Bind to loopback by default. Public hosting or LAN exposure needs a reviewed security decision.
- One local login; no registration. Protect private APIs, streams, and uploads. Only login/minimal health endpoints are exempt. Use password hashing, hashed session tokens, HttpOnly/SameSite cookies, origin/CSRF checks, and rate limits; never invent cryptography.
- Keys stay server-side, never in bundles or VITE-prefixed variables. Do not read/commit .env secrets; use .env.example for names only.
- Log operational metadata only: model, prompt version, timing, usage, sanitized error category. Never log chat/transcripts/audio/reports, raw prompts/provider errors, credentials, or session tokens.
- Render Markdown safely: no unsanitized HTML or unsafe URLs. No private API service-worker caching by default.
- UTF-8 throughout. Test English, Chinese, and mixed text; test short Chinese searches in v1.5.

## Workflow and completion

- Keep choices and assumptions current in the implementation plan without dated decision records. Ask about unresolved material product/provider decisions; do not invent infrastructure requirements.
- Preserve data. Never edit applied migrations or reset databases without approval. Audit migration state before implementing schema changes.
- Keep changes focused. No push, deploy, secret change, or protection change without instruction. Plan/read-only interactions do not authorize edits.
- Review the diff; run pnpm typecheck, pnpm lint, pnpm test, and the relevant build. Report failures honestly, including pre-existing blockers; do not silently expand scope to fix them.
- Test service logic with temporary real SQLite databases and mocked providers. No paid/live API calls in ordinary tests.
- Feature completion requires acceptance checks, failure-path tests, and a browser check at 375px. Check off only verified items. Documentation-only work requires link/scope checks and does not imply features work.
