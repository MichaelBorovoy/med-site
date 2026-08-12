-- Assistance workplace: incoming queue + phone/chat contact logs

CREATE TABLE IF NOT EXISTS assistance_queue (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('phone', 'chat', 'walk_in', 'other')),
  subject TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'in_progress', 'done', 'cancelled')),
  claimed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS patient_contact_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('phone', 'chat')),
  direction TEXT NOT NULL DEFAULT 'inbound'
    CHECK (direction IN ('inbound', 'outbound')),
  summary TEXT NOT NULL,
  reference_code TEXT,
  queue_item_id BIGINT REFERENCES assistance_queue(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistance_queue_status ON assistance_queue(status);
CREATE INDEX IF NOT EXISTS idx_assistance_queue_patient_id ON assistance_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_contact_logs_patient_id ON patient_contact_logs(patient_id);
