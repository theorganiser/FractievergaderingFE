CREATE TABLE IF NOT EXISTS login_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naam TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'fractielid',
  ingelogd_op TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE login_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'login_log' AND policyname = 'Iedereen kan login log lezen') THEN
    CREATE POLICY "Iedereen kan login log lezen" ON login_log FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'login_log' AND policyname = 'Iedereen kan login log aanmaken') THEN
    CREATE POLICY "Iedereen kan login log aanmaken" ON login_log FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Index voor snelle queries per gebruiker
CREATE INDEX IF NOT EXISTS idx_login_log_naam ON login_log(naam);
CREATE INDEX IF NOT EXISTS idx_login_log_tijd ON login_log(ingelogd_op DESC);

SELECT 'Login log tabel aangemaakt ✓' as status;
