-- ============================================================
-- Notulen kolom voor vergaderingen tabel
-- Plak dit in: Supabase Dashboard → SQL Editor → Run
--
-- Deze kolom ontbrak sinds het begin: de Notulen-editor in de
-- leesweergave leek op te slaan (optimistic UI), maar er was
-- geen kolom om de tekst daadwerkelijk in weg te schrijven.
-- ============================================================

ALTER TABLE vergaderingen ADD COLUMN IF NOT EXISTS notulen TEXT DEFAULT '';

SELECT 'Notulen kolom toegevoegd ✓' as status;
