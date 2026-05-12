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
3. Voeg deze omgevingsvariabelen toe in Vercel:

| Variabele | Waarde |
|-----------|--------|
| `NEXT_PUBLIC_ADMIN_PASSWORD` | jouw wachtwoord |
| `NEXT_PUBLIC_SUPABASE_URL` | https://bchzfcnxtgiqplwqouhy.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | jouw anon key |
| `NEXT_PUBLIC_API_URL` | https://datascraperraad.onrender.com |

## 📁 Projectstructuur

```
src/
├── app/
│   ├── page.tsx                  # Overzicht vergaderingen
│   ├── login/page.tsx            # Beheerder inloggen
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

Beheerders loggen in met het wachtwoord uit `NEXT_PUBLIC_ADMIN_PASSWORD`.  
De inlogstatus wordt bewaard in `sessionStorage` (verdwijnt bij sluiten browser).  
Lezers hebben geen account nodig — zij openen de unieke deellink.

---

Gemeente Gooise Meren — bestuur.gooisemeren.nl
