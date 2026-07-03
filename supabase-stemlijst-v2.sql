-- Voeg unieke stemlijst_key toe aan subpunten via Supabase migratie
-- Dit script hoef je alleen te runnen als je bestaande stemmen wilt migreren

-- De stemlijst_stemmen tabel gebruikt nu item_key gebaseerd op een unieke ID
-- per subpunt. Nieuwe subpunten krijgen automatisch een UUID als stemlijst_key.

-- Geen schema wijzigingen nodig - de app genereert de keys zelf.
SELECT 'Stemlijst v2 - keys worden in de app gegenereerd' as status;
