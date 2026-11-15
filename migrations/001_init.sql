-- Migration 001: Initial schema for Starward database
-- Tables created by v0 scaffolding

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  hashed_session_token TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS ai_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_call_id TEXT NOT NULL,
  raw_output TEXT NOT NULL,
  validation_error TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

-- Schedule/countdown product content (calendar events, email event extraction,
-- gcal/gmail sync, Google OAuth, and push reminders) was removed on 2026-11-15;
-- those products moved out of this repository.

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
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



CREATE TABLE IF NOT EXISTS tag_config (
  note_id TEXT REFERENCES notes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL CHECK (tag IN ('diary','idea','todo','side-business','personal')),
  PRIMARY KEY (note_id, tag)
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL CHECK (tag IN ('diary','idea','todo','side-business','personal')),
  PRIMARY KEY (note_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_status_created ON notes(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notes_mentioned_date ON notes(mentioned_date);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag ON note_tags(tag);