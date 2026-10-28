# Vergaderagenda – Gooise Meren

Een webapplicatie voor het aanmaken en delen van vergaderagenda's. Data wordt opgeslagen in Supabase.

## 🗄 Stap 1 – Supabase database instellen

1. Ga naar [supabase.com](https://supabase.com) → jouw project **vergaderagenda**
2. Klik op **SQL Editor** in het linkermenu
3. Plak de inhoud van `supabase-setup.sql` en klik **Run**
4. Je ziet: `Tabel vergaderingen aangemaakt ✓`

## 🚀 Stap 2 – Lokaal starten

```bash
npm install
cp .env.local.example .env.local
# Vul .env.local in (of gebruik het meegeleverde .env.local)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ☁️ Stap 3 – Deployen op Vercel

1. Push naar GitHub
2. Importeer op [vercel.com](https://vercel.com)
3. Voeg de omgevingsvariabelen uit `.env.local.example` toe in Vercel (minimaal `JWT_SECRET`,
   `READER_PASSWORD`, `ADMIN_PASSWORD`, `MODERATOR_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`).

Vereist Node.js 20.9 of nieuwer (Next.js 16).

## 📁 Projectstructuur

```
src/
├── app/
│   ├── page.tsx                  # Overzicht vergaderingen
│   ├── inloggen/page.tsx         # Inloggen (iedereen)
│   ├── lees/[token]/page.tsx     # Openbare leesweergave
│   ├── vergadering/[id]/page.tsx # Editor
│   └── beheer/page.tsx           # Beheer & API-status
├── components/
│   ├── Topbalk.tsx
│   ├── Leesweergave.tsx
│   ├── AgendaEditor.tsx
│   ├── DocumentenSelector.tsx
│   └── Melding.tsx
├── hooks/
│   ├── useVergaderingen.ts       # State + Supabase calls
│   └── useAuth.ts
└── lib/
    ├── supabase.ts               # Supabase client
    ├── storage.ts                # CRUD functies (Supabase)
    ├── api.ts                    # Backend scraper API
    ├── types.ts
    ├── datum.ts
    └── template.ts
```

## 🔐 Authenticatie

Iedereen logt in op `/inloggen` met **naam + wachtwoord**. De rol (fractielid, moderator,
beheerder) komt alleen uit de tabel `gebruikers`.

- **Fractielid**: eigen wachtwoord, of zolang dat er niet is de gedeelde toegangscode (`READER_PASSWORD`).
- **Beheerder / moderator**: altijd een eigen wachtwoord. Wie die rol heeft maar nog geen eigen
  wachtwoord, logt eenmalig in met `ADMIN_PASSWORD` (beheerder) of `MODERATOR_PASSWORD`
  (moderator), wordt naar `/account` gestuurd en krijgt de extra rechten pas na het instellen
  van een eigen wachtwoord. De gedeelde toegangscode geeft nooit beheerders- of moderatorrechten.
- Sessies zijn JWT-cookies van 24 uur; de rol-cookies zijn aan de naam gekoppeld.
- Alle data loopt via de API-routes in `src/app/api`, die de login zelf controleren.

## 🕐 Tijdzone

Alle datums en tijden worden in Nederlandse tijd berekend (`Europe/Amsterdam`), ongeacht waar
de server of het apparaat staat. Gebruik de helpers uit `src/lib/tijd.ts`
(`vandaagNL`, `plusDagen`, `formatTijdstipTijd`, …) in plaats van `toISOString().split('T')[0]`.

## 👥 Gelijktijdig bewerken

- Opslaan gebeurt met versiecontrole op `bijgewerkt`: als iemand anders er net iets aan
  veranderde, haalt de browser de verse versie op en probeert het opnieuw.
- Aanwezigheid gaat via `/api/vergaderingen/[id]/aanwezigheid`, die per keer maar één naam verandert.
- De editor voegt bij opslaan de agenda samen met wat fractieleden ondertussen toevoegden
  (notities, bijlagen, eigen punten, bespreekverzoeken) — zie `src/lib/samenvoegen.ts`.

---

Gemeente Gooise Meren — bestuur.gooisemeren.nl
