-- Persberichten tabellen voor GDP
-- Plak dit in Supabase SQL Editor en klik Run

-- System prompt instructies (één rij)
CREATE TABLE IF NOT EXISTS persbericht_instructies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  systeem_prompt TEXT NOT NULL DEFAULT '',
  bijgewerkt_op TIMESTAMPTZ DEFAULT NOW(),
  bijgewerkt_door TEXT DEFAULT ''
);

-- Voeg standaard instructie in als die er nog niet is
INSERT INTO persbericht_instructies (systeem_prompt, bijgewerkt_door)
SELECT
  'Je bent een communicatiemedewerker van GDP – Goois Democratisch Platform, een lokale politieke partij in Gooise Meren. Je schrijft persberichten vanuit het perspectief van GDP. Gebruik een constructieve, betrokken toon die past bij een democratische lokale partij. Vermijd partijpolitieke aanvallen. Focus op de inhoud en de belangen van de inwoners van Gooise Meren.',
  'systeem'
WHERE NOT EXISTS (SELECT 1 FROM persbericht_instructies);

-- Gegenereerde persberichten geschiedenis
CREATE TABLE IF NOT EXISTS persberichten_geschiedenis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gebruiker_naam TEXT NOT NULL DEFAULT '',
  ruwe_tekst TEXT NOT NULL,
  website_tekst TEXT NOT NULL DEFAULT '',
  linkedin_tekst TEXT NOT NULL DEFAULT '',
  facebook_tekst TEXT NOT NULL DEFAULT '',
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

-- Index voor opruimen
CREATE INDEX IF NOT EXISTS idx_persberichten_aangemaakt ON persberichten_geschiedenis(aangemaakt_op);

-- Row Level Security
ALTER TABLE persbericht_instructies ENABLE ROW LEVEL SECURITY;
ALTER TABLE persberichten_geschiedenis ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persbericht_instructies' AND policyname = 'Iedereen kan instructies lezen') THEN
    CREATE POLICY "Iedereen kan instructies lezen" ON persbericht_instructies FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persbericht_instructies' AND policyname = 'Iedereen kan instructies aanpassen') THEN
    CREATE POLICY "Iedereen kan instructies aanpassen" ON persbericht_instructies FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persberichten_geschiedenis' AND policyname = 'Iedereen kan geschiedenis lezen') THEN
    CREATE POLICY "Iedereen kan geschiedenis lezen" ON persberichten_geschiedenis FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persberichten_geschiedenis' AND policyname = 'Iedereen kan geschiedenis aanmaken') THEN
    CREATE POLICY "Iedereen kan geschiedenis aanmaken" ON persberichten_geschiedenis FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persberichten_geschiedenis' AND policyname = 'Iedereen kan geschiedenis verwijderen') THEN
    CREATE POLICY "Iedereen kan geschiedenis verwijderen" ON persberichten_geschiedenis FOR DELETE USING (true);
  END IF;
END $$;

SELECT 'Persberichten tabellen aangemaakt ✓' as status;
