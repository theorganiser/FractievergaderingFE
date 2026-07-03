-- Gebruikers tabel voor GDP fractie
-- Plak dit in Supabase SQL Editor en klik Run

CREATE TABLE IF NOT EXISTS gebruikers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naam TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL DEFAULT 'fractielid', -- 'fractielid', 'moderator', 'beheerder'
  actief BOOLEAN DEFAULT true,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gebruikers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gebruikers' AND policyname = 'Iedereen kan gebruikers lezen') THEN
    CREATE POLICY "Iedereen kan gebruikers lezen" ON gebruikers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gebruikers' AND policyname = 'Iedereen kan gebruikers aanpassen') THEN
    CREATE POLICY "Iedereen kan gebruikers aanpassen" ON gebruikers FOR ALL USING (true);
  END IF;
END $$;

-- Voeg standaard fractieleden toe
INSERT INTO gebruikers (naam, rol) VALUES
  ('Vera', 'fractielid'),
  ('Pieter', 'beheerder'),
  ('Claudia', 'fractielid'),
  ('Bianca', 'fractielid'),
  ('Ralph', 'fractielid'),
  ('Marga', 'fractielid'),
  ('Robin', 'fractielid'),
  ('Jan', 'fractielid')
ON CONFLICT (naam) DO NOTHING;

SELECT 'Gebruikers tabel aangemaakt ✓' as status;
