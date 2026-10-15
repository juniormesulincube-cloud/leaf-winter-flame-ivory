-- Signaling rendezvous plus transfer metadata. File bytes never land here.
CREATE TABLE IF NOT EXISTS webrtc_peers (
  room TEXT NOT NULL,
  peer_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room, peer_id)
);

CREATE TABLE IF NOT EXISTS webrtc_signals (
  id BIGSERIAL PRIMARY KEY,
  room TEXT NOT NULL,
  to_peer TEXT NOT NULL,
  from_peer TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webrtc_signals_inbox
  ON webrtc_signals (room, to_peer, id);

CREATE TABLE IF NOT EXISTS file_transfers (
  id TEXT PRIMARY KEY,
  sender_token TEXT NOT NULL,
  sender_peer TEXT NOT NULL,
  sender_name TEXT NOT NULL DEFAULT '',
  files JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS file_transfers_created
  ON file_transfers (created_at);
