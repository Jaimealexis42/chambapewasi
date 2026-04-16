-- Create pres_usuarios table for freemium tracking
-- Stores user device IDs, pro status, and analysis count

CREATE TABLE IF NOT EXISTS pres_usuarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text UNIQUE,
  user_id uuid UNIQUE,
  es_pro boolean DEFAULT false,
  analisis_gratis_usados integer DEFAULT 0,
  subscription_expires_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pres_usuarios_device_id ON pres_usuarios(device_id);
CREATE INDEX IF NOT EXISTS idx_pres_usuarios_user_id ON pres_usuarios(user_id);

-- Enable Row Level Security
ALTER TABLE pres_usuarios ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own record
CREATE POLICY "Users can read own record" ON pres_usuarios
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR device_id IS NOT NULL
  );

-- Service role (Edge Functions) can do everything via SERVICE_ROLE_KEY
-- No explicit policy needed - service role has full access by default

-- Add comment to explain the table
COMMENT ON TABLE pres_usuarios IS 'Tracks user device IDs and free analysis usage for freemium model';
COMMENT ON COLUMN pres_usuarios.device_id IS 'Unique device identifier for non-authenticated users';
COMMENT ON COLUMN pres_usuarios.user_id IS 'Auth user ID for authenticated users';
COMMENT ON COLUMN pres_usuarios.es_pro IS 'Whether user has Pro subscription';
COMMENT ON COLUMN pres_usuarios.analisis_gratis_usados IS 'Number of free analyses consumed (max 3)';
COMMENT ON COLUMN pres_usuarios.subscription_expires_at IS 'When Pro subscription expires (if applicable)';
