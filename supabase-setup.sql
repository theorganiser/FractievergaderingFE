-- =============================================================
-- Vergaderagenda Gooise Meren – Supabase tabel setup
-- Plak dit in: Supabase Dashboard → SQL Editor → Run
-- =============================================================

-- Vergaderingen tabel
CREATE TABLE IF NOT EXISTS vergaderingen (
  id TEXT PRIMARY KEY,
  titel TEXT NOT NULL DEFAULT 'Nieuwe vergadering',
  datum TEXT DEFAULT '',
  aanvang TEXT DEFAULT '20:00',
  locatie TEXT DEFAULT 'gemeentehuis',
  aanwezig TEXT DEFAULT '',
  online TEXT DEFAULT '',
  afwezig TEXT DEFAULT '',
  punten JSONB NOT NULL DEFAULT '[]',
  deeltoken TEXT NOT NULL UNIQUE,
  aangemaakt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bijgewerkt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index op deeltoken voor snelle lookup via deellink
CREATE INDEX IF NOT EXISTS idx_vergaderingen_deeltoken ON vergaderingen(deeltoken);

-- Index op datum voor sortering
CREATE INDEX IF NOT EXISTS idx_vergaderingen_datum ON vergaderingen(datum DESC);

-- Automatisch bijgewerkt-timestamp updaten
CREATE OR REPLACE FUNCTION update_bijgewerkt()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bijgewerkt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER vergaderingen_bijgewerkt
  BEFORE UPDATE ON vergaderingen
  FOR EACH ROW
  EXECUTE FUNCTION update_bijgewerkt();

-- Row Level Security uitschakelen (simpel voor MVP, beheerder auth via app)
ALTER TABLE vergaderingen ENABLE ROW LEVEL SECURITY;

-- Iedereen mag lezen (voor deellinks)
CREATE POLICY "Iedereen kan vergaderingen lezen"
  ON vergaderingen FOR SELECT
  USING (true);

-- Iedereen mag schrijven (auth zit in de app zelf)
CREATE POLICY "Iedereen kan vergaderingen aanmaken"
  ON vergaderingen FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Iedereen kan vergaderingen bijwerken"
  ON vergaderingen FOR UPDATE
  USING (true);

CREATE POLICY "Iedereen kan vergaderingen verwijderen"
  ON vergaderingen FOR DELETE
  USING (true);

-- Klaar!
SELECT 'Tabel vergaderingen aangemaakt ✓' as status;

-- ============================================================
-- Update v2: nieuwe kolommen voor actielijst, kalender, versie
-- Voer dit uit als je de tabel al hebt aangemaakt
-- ============================================================
ALTER TABLE vergaderingen ADD COLUMN IF NOT EXISTS versie INTEGER DEFAULT 1;
ALTER TABLE vergaderingen ADD COLUMN IF NOT EXISTS actielijst JSONB DEFAULT '[]';
ALTER TABLE vergaderingen ADD COLUMN IF NOT EXISTS kalender JSONB DEFAULT '[]';
ALTER TABLE vergaderingen ADD COLUMN IF NOT EXISTS heeft_politieke_avond BOOLEAN DEFAULT false;
ALTER TABLE vergaderingen ADD COLUMN IF NOT EXISTS politieke_avond_datum TEXT DEFAULT '';
ALTER TABLE vergaderingen ADD COLUMN IF NOT EXISTS politieke_avond_url TEXT DEFAULT '';
ALTER TABLE vergaderingen ADD COLUMN IF NOT EXISTS heeft_raadsvergadering BOOLEAN DEFAULT false;
ALTER TABLE vergaderingen ADD COLUMN IF NOT EXISTS raadsvergadering_datum TEXT DEFAULT '';
ALTER TABLE vergaderingen ADD COLUMN IF NOT EXISTS raadsvergadering_url TEXT DEFAULT '';

SELECT 'Update v2 uitgevoerd ✓' as status;
