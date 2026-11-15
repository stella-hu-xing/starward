# Starward — AI chat journal

> Documentation reset: 2026-11-15. This repository hosts only the AI chat journal. Schedule and countdown content was removed from the code on 2026-11-15 and will be moved to a separate project. The remaining code is an older scaffold, not an implementation of the requirements below. The repository name is unchanged; the final app name is undecided.

## Goal

A personal chat app where I talk to an AI model by typing or speaking, then generate a daily report. The report summarizes the day's conversations, lists the highlights, and is saved for later reading.

The chat should feel like Claude's chat window: a quiet conversation view, readable streaming replies, and a straightforward composer. **The daily report is the distinctive part.**

Schedules and countdowns are separate products and were removed from this repository on 2026-11-15; they will be rebuilt in another place. This repository contains only the chat journal, and the other apps stay outside this roadmap.

## Scope

### v1 — must have

- Text chat with streaming replies. Send the full history of the current conversation on every request, including the new message. Do not mix unrelated conversations or silently truncate history.
- Push-to-talk voice input. Record a clip, transcribe it through a speech-to-text API, and send the transcript as a normal user message. Continuous transcription is not required.
- Store every user and assistant message with a timestamp and conversation ID. Reloading restores conversations. Save user text before contacting the model; distinguish interrupted and failed replies.
- A **Generate daily report** button and date picker, covering the selected local day's messages across all conversations.
- Save successful reports as Markdown in SQLite, with a summary and highlights. Render them safely in the app and provide an archive for later reading.
- Responsive web UI, including a 375px-wide viewport. English, Chinese, and mixed-language content must work.
- Single-owner local login only; no registration or account management.

### v1.5 — should have

- Automatic daily report at a configurable local time, for example 21:00. The server must be running; jobs cannot execute while the computer sleeps or is off.
- Tags on messages and reports, aligned with the notebook/archive idea in the separate personal agent project. No integration with that project is required.
- Search past messages by date, tag, or keyword, including Chinese queries.

### Later — nice to have

- Live voice with continuous transcription while speaking.
- PDF export or email delivery of reports.
- Explicitly selected key facts from past reports as context for future chats.
- Gmail or Outlook schedule import belongs to the separate personal agent project, not this chat journal.

### Out of scope for now

- Schedule/countdown features and calendar/email integrations entirely: that content was removed from this repository on 2026-11-15 and will be moved to another project. No combined assistant dashboard here.
- Multi-user accounts, sharing, billing, or auth beyond one local login.
- Native mobile apps; a responsive web app is enough.
- Model training/fine-tuning, vector search, MCP, and autonomous tools.
- Permanent audio storage, text-to-speech, push notifications, cloud backups, and production infrastructure provisioning.

## Architecture

```text
Browser: React + Vite
   | text or temporary audio clip
   v
One local Node.js + TypeScript server (Hono)
   |-- /api/chat        -> Claude API, streaming replies
   |-- /api/transcribe  -> speech-to-text API (provider undecided)
   |-- /api/report      -> Claude API, daily Markdown summary
   |-- conversations / report archive / local login
   v
SQLite: conversations, messages, reports
        tags and search indexes in v1.5

v1.5 scheduler -> same report service used by /api/report
```

Keep React, Vite, Hono, Zod, better-sqlite3, pnpm, and Vitest. Direct Claude API access replaces the old runtime OpenRouter design; provider adapter and dependency changes are future implementation work. API keys stay on the server. The editor's AI provider is independent of the app's runtime provider.

Start with one server serving the built UI and API on one origin, bound to loopback. Static Cloudflare Pages hosting alone cannot run the backend or store SQLite data. Public deployment and phone access need a separate security/hosting decision.

## Daily report rules

- Use an explicit IANA timezone. Convert local midnight and the next local midnight into a UTC half-open interval; daylight-saving days are not always 24 hours.
- Include that day's user messages and complete assistant messages across conversations, in stable timestamp order. Exclude unfinished assistant text and report-generation output. Attribute AI suggestions as suggestions, not facts about the user.
- Snapshot inputs when generation begins. A report for today covers messages available then; later messages require regeneration.
- Empty days show an empty state without an AI call. Failed generation must not replace a saved report. Explicit regeneration creates a new saved revision.
- Never silently omit messages to fit a report prompt. Long days need coverage-preserving chunked summarization or a clear failure, not a misleading partial report.

## Current implementation status

The legacy Home/Notes shell has been replaced with a typed, in-memory Chat/Journal/Settings demo. Chat supports conversation selection, new chats, a growing composer, and progressively revealed canned replies. Journal browses chat history by month, with topic chips, cross-chat daily summaries, and links back to conversations. This is a history calendar, not a scheduling feature. English/Chinese and a voice-source fixture are included. Reloading resets all demo changes; no API or real AI is called, and summaries are static fixtures rather than generated results. Calendar helper tests are real unit tests; the health test remains a placeholder. Durable chat, transcription, report generation, local login, and scheduling remain unimplemented.

The current deployment workflow uploads a static build to Cloudflare Pages, not the planned backend. Environment examples, migrations, PWA metadata, and deployment files still reflect the older scaffold and need a reviewed implementation pass. On 2026-11-15 the schedule/countdown routes and screens, calendar/gmail sync and OAuth settings, and the googleapis/ical.js dependencies were removed from this scaffold ahead of the move to another project; no feature was added.

## Documentation

- [Agent instructions](AGENTS.md)
- [Architecture](agents/ARCHITECTURE.md)
- [Data model](agents/DATA_MODEL.md)
- [Milestones and open decisions](agents/PLAN.md)
- [Development setup and limitations](agents/DEV_ENVIRONMENT.md)
- [Separate personal-site plan](agents/SITE_PLAN.md)
