-- Add active column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Update session table to use token column correctly
ALTER TABLE sessions DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS id VARCHAR(255) PRIMARY KEY;

-- Recreate sessions table with correct schema
DROP TABLE IF EXISTS sessions CASCADE;
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Update default admin with proper bcrypt hash for 'admin123'
UPDATE users SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.O7u.eG7qHxhe2G', active = true WHERE email = 'admin@trakora.com';
