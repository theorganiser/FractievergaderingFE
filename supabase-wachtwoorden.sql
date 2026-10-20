-- Persoonlijke wachtwoorden voor fractieleden (optioneel).
-- Plak dit in de Supabase SQL Editor en voer uit.
--
-- BELANGRIJK: RLS staat aan en er zijn bewust GEEN policies. Daardoor kan de publieke
-- (anon) key deze tabel niet lezen of schrijven; alleen de server (service-role key) kan er bij.
-- Het wachtwoord zelf wordt nooit opgeslagen, alleen een scrypt-hash.

CREATE TABLE IF NOT EXISTS gebruiker_wachtwoorden (
  naam TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  gewijzigd TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gebruiker_wachtwoorden ENABLE ROW LEVEL SECURITY;

SELECT 'gebruiker_wachtwoorden aangemaakt ✓' AS status;
