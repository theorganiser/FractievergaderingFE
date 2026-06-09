-- Stemlijst stemmen opslaan per vergadering
-- Plak dit in Supabase SQL Editor en klik Run

CREATE TABLE IF NOT EXISTS stemlijst_stemmen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vergadering_id TEXT NOT NULL,
  item_key TEXT NOT NULL,
  stem TEXT NOT NULL DEFAULT '',  -- 'voor', 'tegen', 'onthouding', ''
  notitie TEXT DEFAULT '',
  bijgewerkt_op TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vergadering_id, item_key)
);

ALTER TABLE stemlijst_stemmen ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Iedereen kan stemmen lezen" ON stemlijst_stemmen FOR SELECT USING (true);
CREATE POLICY "Iedereen kan stemmen aanmaken" ON stemlijst_stemmen FOR INSERT WITH CHECK (true);
CREATE POLICY "Iedereen kan stemmen bijwerken" ON stemlijst_stemmen FOR UPDATE USING (true);
CREATE POLICY "Iedereen kan stemmen verwijderen" ON stemlijst_stemmen FOR DELETE USING (true);

SELECT 'Stemlijst tabel aangemaakt ✓' as status;
