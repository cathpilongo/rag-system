CREATE TABLE IF NOT EXISTS drrm_repository (
  id SERIAL PRIMARY KEY,
  chunk_id VARCHAR(128) NOT NULL UNIQUE,
  source VARCHAR(255),
  agency VARCHAR(255),
  topic VARCHAR(255),
  original_text TEXT NOT NULL,
  localized_text TEXT,
  hazard_type VARCHAR(64),
  phase VARCHAR(64),
  validation_status VARCHAR(32) DEFAULT 'Approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drrm_topic ON drrm_repository(topic);
CREATE INDEX IF NOT EXISTS idx_drrm_validation ON drrm_repository(validation_status);

CREATE TABLE IF NOT EXISTS chat_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL,
  user_query TEXT NOT NULL,
  retrieved_chunk_ids TEXT,
  assistant_response TEXT NOT NULL,
  retrieved_topics TEXT,
  is_fallback BOOLEAN DEFAULT FALSE,
  model_name VARCHAR(64),
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_logs(session_id);
