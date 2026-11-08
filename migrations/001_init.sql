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

CREATE TABLE IF NOT EXISTS email_scans (
  message_id TEXT PRIMARY KEY,
  scanned_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  status TEXT NOT NULL DEFAULT 'no_events',
  attempts INTEGER NOT NULL DEFAULT 1,
  prompt_version TEXT,
  model TEXT
);

CREATE TABLE IF NOT EXISTS event_candidate_sources (
  event_id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  thread_id TEXT,
  subject TEXT,
  sender TEXT,
  received_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  provider TEXT PRIMARY KEY,
  account_email TEXT NOT NULL,
  refresh_token_enc BLOB NOT NULL,
  scopes TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  keys_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

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

CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  quiet_hours TEXT NOT NULL DEFAULT '',
  push_enabled TEXT NOT NULL DEFAULT 'true'
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
CREATE INDEX IF NOT EXISTS idx_event_source_source_id ON events(source, source_id);
CREATE INDEX IF NOT EXISTS idx_event_status_start ON events(status, start_at);