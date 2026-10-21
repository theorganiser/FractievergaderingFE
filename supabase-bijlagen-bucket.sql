-- ============================================================
-- Storage bucket voor bijlagen (PDF/afbeeldingen bij agendapunten)
-- Plak dit in: Supabase Dashboard → SQL Editor → Run
--
-- De bucket is PRIVÉ (public = false). Uploads en downloads gaan
-- via server-side signed URLs (met de service-role key), niet via
-- de anon-key of publieke policies — dus geen losse storage-policies
-- nodig. Alleen ingelogde fractieleden kunnen bij de app-routes die
-- deze signed URLs uitgeven.
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('bijlagen', 'bijlagen', false)
ON CONFLICT (id) DO NOTHING;

SELECT 'Bijlagen-bucket aangemaakt ✓' as status;
