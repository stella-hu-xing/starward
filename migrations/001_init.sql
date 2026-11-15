-- Migration 001: scaffold schema inherited from the v0 static shell.
-- Never applied: scripts/migrate.ts runs no SQL and no database file exists.
-- M0 must audit this file against agents/DATA_MODEL.md (conversations,
-- messages, reports) before implementing migration tracking; the v1 schema
-- replaces these tables. IDs are UUIDs generated in application code
-- (crypto.randomUUID), never PostgreSQL SQL functions.

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  hashed_session_token TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_calls (
  id TEXT PRIMARY KEY,
  task TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ok',
  latency_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost_usd REAL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- DATA_MODEL.md replaces raw_output persistence with sanitized error
-- categories; M0 decides this table's final shape or removal.

CREATE TABLE IF NOT EXISTS ai_failures (
  id TEXT PRIMARY KEY,
  ai_call_id TEXT NOT NULL,
  raw_output TEXT NOT NULL,
  validation_error TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS auth_credentials (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  data_enc BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS backup_log (
  id TEXT PRIMARY KEY,
  snapshot_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success'
);

-- Schedule/countdown product content (calendar events, email event
-- extraction, gcal/gmail sync, Google OAuth, and push reminders) was removed
-- on 2026-11-15; those products moved out of this repository. The legacy
-- notes/tag tables and notes indexes were removed with the notes scaffold on
-- 2026-11-15.