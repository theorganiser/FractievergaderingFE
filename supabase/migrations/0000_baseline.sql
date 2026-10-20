-- Baseline van het schema zoals het op 2026-10-20 in productie stond
-- (project "vergaderagenda", bchzfcnxtgiqplwqouhy). Uitgelezen uit de systeemcatalogus.
-- Vervangt de losse supabase-*.sql bestanden. Nieuwe wijzigingen: 0001_..., 0002_..., enz.
--
-- Niet opgenomen: de standaard GRANTs aan anon/authenticated (die zet Supabase zelf
-- bij elke nieuwe tabel in public) en extensies die Supabase standaard al aan heeft.

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ─── Functies ───────────────────────────────────────────────────────────────

create or replace function public.update_bijgewerkt()
returns trigger language plpgsql as $$
begin
  new.bijgewerkt = now();
  return new;
end;
$$;

create or replace function public.update_kalender_bijgewerkt()
returns trigger language plpgsql as $$
begin
  new.bijgewerkt_op = now();
  return new;
end;
$$;

create or replace function public.democracity_max_check()
returns trigger language plpgsql as $$
declare
  max_p int;
  huidig int;
begin
  select max_personen into max_p from democracity_dagen where id = new.dag_id for update;
  select count(*) into huidig from democracity_aanmeldingen where dag_id = new.dag_id;
  if huidig >= max_p then
    raise exception 'DAG_VOL';
  end if;
  return new;
end;
$$;

-- ─── Tabellen ───────────────────────────────────────────────────────────────

create table public.vergaderingen (
  id text not null primary key,
  titel text not null default 'Nieuwe vergadering',
  datum text default '',
  aanvang text default '20:00',
  locatie text default 'gemeentehuis',
  aanwezig text default '',
  online text default '',
  afwezig text default '',
  punten jsonb not null default '[]'::jsonb,
  deeltoken text not null unique,
  aangemaakt timestamptz not null default now(),
  bijgewerkt timestamptz not null default now(),
  versie integer default 1,
  actielijst jsonb default '[]'::jsonb,
  kalender jsonb default '[]'::jsonb,
  heeft_politieke_avond boolean default false,
  politieke_avond_datum text default '',
  politieke_avond_url text default '',
  heeft_raadsvergadering boolean default false,
  raadsvergadering_datum text default '',
  raadsvergadering_url text default '',
  notulen text default ''
);
create index idx_vergaderingen_datum on public.vergaderingen (datum desc);
create index idx_vergaderingen_deeltoken on public.vergaderingen (deeltoken);
create trigger vergaderingen_bijgewerkt before update on public.vergaderingen
  for each row execute function update_bijgewerkt();

create table public.stemlijst_stemmen (
  id uuid not null default gen_random_uuid() primary key,
  vergadering_id text not null,
  item_key text not null,
  stem text not null default '',
  notitie text default '',
  bijgewerkt_op timestamptz default now(),
  unique (vergadering_id, item_key)
);

create table public.gebruikers (
  id uuid not null default gen_random_uuid() primary key,
  naam text not null unique,
  rol text not null default 'fractielid',
  actief boolean default true,
  aangemaakt_op timestamptz default now()
);

create table public.gebruiker_wachtwoorden (
  naam text not null primary key,
  hash text not null,
  gewijzigd timestamptz default now()
);

create table public.login_log (
  id uuid not null default gen_random_uuid() primary key,
  naam text not null,
  rol text not null default 'fractielid',
  ingelogd_op timestamptz default now()
);
create index idx_login_log_naam on public.login_log (naam);
create index idx_login_log_tijd on public.login_log (ingelogd_op desc);

create table public.kalender_items (
  id uuid not null default gen_random_uuid() primary key,
  datum date not null,
  omschrijving text not null,
  locatie text default '',
  personen text default '',
  aangemaakt_op timestamptz default now(),
  bijgewerkt_op timestamptz default now(),
  starttijd text default '',
  categorie text default ''
);
create index idx_kalender_datum on public.kalender_items (datum);
create trigger kalender_bijgewerkt before update on public.kalender_items
  for each row execute function update_kalender_bijgewerkt();

create table public.portefeuilles (
  id uuid not null default gen_random_uuid() primary key,
  volgorde integer not null,
  onderwerp text not null,
  programma text default '',
  woordvoerder_1 text default '',
  woordvoerder_2 text default '',
  woordvoerder_3 text default ''
);
create index idx_portefeuilles_volgorde on public.portefeuilles (volgorde);

create table public.persbericht_instructies (
  id uuid not null default gen_random_uuid() primary key,
  systeem_prompt text not null default '',
  bijgewerkt_op timestamptz default now(),
  bijgewerkt_door text default ''
);

create table public.persberichten_geschiedenis (
  id uuid not null default gen_random_uuid() primary key,
  gebruiker_naam text not null default '',
  ruwe_tekst text not null,
  website_tekst text not null default '',
  linkedin_tekst text not null default '',
  facebook_tekst text not null default '',
  aangemaakt_op timestamptz default now()
);
create index idx_persberichten_aangemaakt on public.persberichten_geschiedenis (aangemaakt_op);

create table public.democracity_dagen (
  id uuid not null default gen_random_uuid() primary key,
  datum date not null,
  tijd text not null default '',
  school text not null,
  max_personen integer not null default 2,
  aangemaakt_op timestamptz default now(),
  unique (datum, tijd, school)
);

create table public.democracity_aanmeldingen (
  id uuid not null default gen_random_uuid() primary key,
  dag_id uuid not null references public.democracity_dagen (id) on delete cascade,
  naam text not null,
  aangemaakt_op timestamptz default now(),
  unique (dag_id, naam)
);
create trigger democracity_max_check_trigger before insert on public.democracity_aanmeldingen
  for each row execute function democracity_max_check();

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- RLS staat op alle tabellen aan. Tabellen zonder policy (gebruiker_wachtwoorden)
-- zijn alleen bereikbaar via de service role.

alter table public.vergaderingen enable row level security;
alter table public.stemlijst_stemmen enable row level security;
alter table public.gebruikers enable row level security;
alter table public.gebruiker_wachtwoorden enable row level security;
alter table public.login_log enable row level security;
alter table public.kalender_items enable row level security;
alter table public.portefeuilles enable row level security;
alter table public.persbericht_instructies enable row level security;
alter table public.persberichten_geschiedenis enable row level security;
alter table public.democracity_dagen enable row level security;
alter table public.democracity_aanmeldingen enable row level security;

create policy "Iedereen kan vergaderingen lezen" on public.vergaderingen for select using (true);
create policy "Iedereen kan vergaderingen aanmaken" on public.vergaderingen for insert with check (true);
create policy "Iedereen kan vergaderingen bijwerken" on public.vergaderingen for update using (true);
create policy "Iedereen kan vergaderingen verwijderen" on public.vergaderingen for delete using (true);

create policy "Iedereen kan stemmen lezen" on public.stemlijst_stemmen for select using (true);
create policy "Iedereen kan stemmen aanmaken" on public.stemlijst_stemmen for insert with check (true);
create policy "Iedereen kan stemmen bijwerken" on public.stemlijst_stemmen for update using (true);
create policy "Iedereen kan stemmen verwijderen" on public.stemlijst_stemmen for delete using (true);

create policy "Iedereen kan gebruikers lezen" on public.gebruikers for select using (true);
create policy "Iedereen kan gebruikers aanpassen" on public.gebruikers for all using (true);

create policy "Iedereen kan login log lezen" on public.login_log for select using (true);
create policy "Iedereen kan login log aanmaken" on public.login_log for insert with check (true);

create policy "Iedereen kan kalender lezen" on public.kalender_items for select using (true);
create policy "Iedereen kan kalender aanmaken" on public.kalender_items for insert with check (true);
create policy "Iedereen kan kalender bijwerken" on public.kalender_items for update using (true);
create policy "Iedereen kan kalender verwijderen" on public.kalender_items for delete using (true);

create policy "Iedereen kan portefeuilles lezen" on public.portefeuilles for select using (true);

create policy "Iedereen kan instructies lezen" on public.persbericht_instructies for select using (true);
create policy "Iedereen kan instructies aanpassen" on public.persbericht_instructies for update using (true);

create policy "Iedereen kan geschiedenis lezen" on public.persberichten_geschiedenis for select using (true);
create policy "Iedereen kan geschiedenis aanmaken" on public.persberichten_geschiedenis for insert with check (true);
create policy "Iedereen kan geschiedenis verwijderen" on public.persberichten_geschiedenis for delete using (true);

create policy "Iedereen kan democracity-dagen lezen" on public.democracity_dagen for select using (true);
create policy "Iedereen kan democracity-aanmeldingen lezen" on public.democracity_aanmeldingen for select using (true);

-- ─── Storage ────────────────────────────────────────────────────────────────
-- Privé bucket; up- en downloads lopen via signed URLs uit de API-routes (service role).

insert into storage.buckets (id, name, public)
values ('bijlagen', 'bijlagen', false)
on conflict (id) do nothing;
