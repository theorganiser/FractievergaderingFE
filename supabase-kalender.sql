-- ============================================================
-- Centrale kalender tabel voor GDP fractie
-- Plak dit in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS kalender_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datum DATE NOT NULL,
  omschrijving TEXT NOT NULL,
  locatie TEXT DEFAULT '',
  personen TEXT DEFAULT '',
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW(),
  bijgewerkt_op TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kalender_datum ON kalender_items(datum ASC);

CREATE OR REPLACE FUNCTION update_kalender_bijgewerkt()
RETURNS TRIGGER AS $$
BEGIN NEW.bijgewerkt_op = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER kalender_bijgewerkt
  BEFORE UPDATE ON kalender_items
  FOR EACH ROW EXECUTE FUNCTION update_kalender_bijgewerkt();

ALTER TABLE kalender_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen kan kalender lezen"
  ON kalender_items FOR SELECT USING (true);
CREATE POLICY "Iedereen kan kalender aanmaken"
  ON kalender_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Iedereen kan kalender bijwerken"
  ON kalender_items FOR UPDATE USING (true);
CREATE POLICY "Iedereen kan kalender verwijderen"
  ON kalender_items FOR DELETE USING (true);

-- Voeg ook deadline toe aan actielijst kolom (al JSONB, geen schema wijziging nodig)
-- deadline wordt opgeslagen in het JSONB veld als onderdeel van ActieItem

SELECT 'Kalender tabel aangemaakt ✓' as status;
