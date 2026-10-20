-- Fase 2 van het afschermen van de database.
-- Alle data loopt nu via de API-routes (service role, die RLS omzeilt). De anon-key in de
-- browser hoeft niet meer bij de tabellen, dus de open "Iedereen kan …"-policies gaan weg.
-- RLS blijft aan zonder policies = anon/authenticated mogen niets.
--
-- PAS UITVOEREN als de versie met API-routes in productie staat en minstens een dag gebruikt is
-- (oude, nog openstaande tabbladen gebruiken anders nog de anon-key).
-- Terugdraaien: het RLS-blok uit 0000_baseline.sql opnieuw uitvoeren.

drop policy if exists "Iedereen kan vergaderingen lezen" on public.vergaderingen;
drop policy if exists "Iedereen kan vergaderingen aanmaken" on public.vergaderingen;
drop policy if exists "Iedereen kan vergaderingen bijwerken" on public.vergaderingen;
drop policy if exists "Iedereen kan vergaderingen verwijderen" on public.vergaderingen;

drop policy if exists "Iedereen kan stemmen lezen" on public.stemlijst_stemmen;
drop policy if exists "Iedereen kan stemmen aanmaken" on public.stemlijst_stemmen;
drop policy if exists "Iedereen kan stemmen bijwerken" on public.stemlijst_stemmen;
drop policy if exists "Iedereen kan stemmen verwijderen" on public.stemlijst_stemmen;

drop policy if exists "Iedereen kan gebruikers lezen" on public.gebruikers;
drop policy if exists "Iedereen kan gebruikers aanpassen" on public.gebruikers;

drop policy if exists "Iedereen kan login log lezen" on public.login_log;
drop policy if exists "Iedereen kan login log aanmaken" on public.login_log;

drop policy if exists "Iedereen kan kalender lezen" on public.kalender_items;
drop policy if exists "Iedereen kan kalender aanmaken" on public.kalender_items;
drop policy if exists "Iedereen kan kalender bijwerken" on public.kalender_items;
drop policy if exists "Iedereen kan kalender verwijderen" on public.kalender_items;

drop policy if exists "Iedereen kan portefeuilles lezen" on public.portefeuilles;

drop policy if exists "Iedereen kan instructies lezen" on public.persbericht_instructies;
drop policy if exists "Iedereen kan instructies aanpassen" on public.persbericht_instructies;

drop policy if exists "Iedereen kan geschiedenis lezen" on public.persberichten_geschiedenis;
drop policy if exists "Iedereen kan geschiedenis aanmaken" on public.persberichten_geschiedenis;
drop policy if exists "Iedereen kan geschiedenis verwijderen" on public.persberichten_geschiedenis;

drop policy if exists "Iedereen kan democracity-dagen lezen" on public.democracity_dagen;
drop policy if exists "Iedereen kan democracity-aanmeldingen lezen" on public.democracity_aanmeldingen;
