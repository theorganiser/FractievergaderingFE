'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../hooks/useAuth'
import { useVergaderingen } from '../../hooks/useVergaderingen'
import { testVerbinding, haalSyncLog } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import Melding from '../../components/Melding'
import ExcelUpload from '../../components/ExcelUpload'

type BeheerTab = 'algemeen' | 'excel' | 'gebruikers'

export default function BeheerPagina() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>⏳ Laden...</div>}>
      <BeheerInhoud />
    </Suspense>
  )
}

function BeheerInhoud() {
  const { isAdmin, geladen } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { vergaderingen } = useVergaderingen()
  const [actieveTab, setActieveTab] = useState<BeheerTab>(() =>
    searchParams.get('tab') === 'excel' ? 'excel' :
    searchParams.get('tab') === 'gebruikers' ? 'gebruikers' : 'algemeen'
  )
  const [apiStatus, setApiStatus] = useState<'idle' | 'laden' | 'ok' | 'fout'>('idle')
  const [syncLog, setSyncLog] = useState<unknown[]>([])
  const [melding, setMelding] = useState<{ type: 'succes' | 'fout'; tekst: string } | null>(null)

  if (geladen && !isAdmin) {
    router.push('/login')
    return null
  }

  const testApi = async () => {
    setApiStatus('laden')
    const ok = await testVerbinding()
    setApiStatus(ok ? 'ok' : 'fout')
  }

  const laadSyncLog = async () => {
    try {
      const log = await haalSyncLog()
      setSyncLog(log)
    } catch {
      setSyncLog([])
      setMelding({ type: 'fout', tekst: 'Sync log niet ophaalbaar (API niet bereikbaar).' })
    }
  }

  const wisAllesOp = () => {
    if (confirm('Weet je zeker dat je ALLE vergaderingen wilt verwijderen? Dit is niet ongedaan te maken.')) {
      localStorage.clear()
      router.push('/')
    }
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://datascraperraad.onrender.com'

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: 'normal', marginBottom: '4px' }}>Beheer</h1>
      <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', marginBottom: '16px' }}>
        Instellingen en API-status
      </p>

      {melding && <Melding type={melding.type} tekst={melding.tekst} onSluit={() => setMelding(null)} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f5f0fa', borderRadius: '10px', padding: '4px', border: '1px solid #e0d0f0' }}>
        {([
          { key: 'algemeen', label: '⚙️ Algemeen' },
          { key: 'excel', label: '📊 Excel upload' },
          { key: 'gebruikers', label: '👥 Gebruikers' },
        ] as { key: BeheerTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setActieveTab(t.key)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: actieveTab === t.key ? '700' : '400', background: actieveTab === t.key ? '#4a1a5c' : 'transparent', color: actieveTab === t.key ? 'white' : 'var(--tekst-zacht)', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Algemeen */}
      {actieveTab === 'algemeen' && (
        <div>
      {/* API */}
      <Kaart titel="API-verbinding">
        <p style={tekststijl}>
          Backend: <code style={{ background: '#f0ede8', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{apiUrl}</code>
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          <Knop onClick={testApi} disabled={apiStatus === 'laden'}>
            {apiStatus === 'laden' ? '⏳ Testen...' : '🔌 Test verbinding'}
          </Knop>
          <Knop onClick={laadSyncLog}>📋 Bekijk sync log</Knop>
        </div>
        {apiStatus === 'ok' && (
          <p style={{ marginTop: '10px', fontSize: '13px', color: '#2d7a4f', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ✅ Verbinding geslaagd
          </p>
        )}
        {apiStatus === 'fout' && (
          <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--rood)', fontFamily: 'Arial' }}>
            ❌ Niet bereikbaar (controleer CORS of netwerk)
          </p>
        )}
        {syncLog.length > 0 && (
          <div style={{ marginTop: '14px', background: '#f5f4f0', borderRadius: '6px', padding: '12px', fontSize: '12px', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto' }}>
            {JSON.stringify(syncLog, null, 2)}
          </div>
        )}
      </Kaart>

      {/* Gegevens */}
      <Kaart titel="Opgeslagen gegevens">
        <p style={tekststijl}>{vergaderingen.length} vergadering(en) opgeslagen in localStorage.</p>
        <div style={{ marginTop: '14px' }}>
          <button
            onClick={wisAllesOp}
            style={{
              background: 'white',
              color: 'var(--rood)',
              border: '1px solid var(--rood)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            🗑 Alle gegevens wissen
          </button>
        </div>
      </Kaart>

      {/* Over */}
      <Kaart titel="Over deze applicatie">
        <p style={tekststijl}>
          <strong>MVP versie</strong> — data wordt opgeslagen in de browser (localStorage).
          Vergaderingen zijn beschikbaar op alle apparaten via de deellink.
        </p>
        <p style={{ ...tekststijl, marginTop: '8px' }}>
          Wachtwoord instellen via de omgevingsvariabelen <code style={{ background: '#f0ede8', padding: '1px 5px', borderRadius: '3px', fontSize: '12px' }}>READER_PASSWORD</code> en <code style={{ background: '#f0ede8', padding: '1px 5px', borderRadius: '3px', fontSize: '12px' }}>ADMIN_PASSWORD</code> in Vercel (zonder NEXT_PUBLIC_ prefix).
        </p>
        <p style={{ ...tekststijl, marginTop: '8px', color: 'var(--rood)' }}>
          ⚠️ Let op: NEXT_PUBLIC_ variabelen zijn zichtbaar in de browser. Gebruik een sterk wachtwoord.
        </p>
      </Kaart>

      {/* Endpoints */}
      <Kaart titel="API endpoints">
        {[
          ['GET', '/documenten', 'Alle documenten'],
          ['GET', '/documenten?type=raadsmededelingen', 'Filter op type'],
          ['GET', '/documenten/nieuw?sinds_vergadering=YYYY-MM-DD', 'Nieuw sinds datum'],
          ['GET', '/documenten/per-type', 'Samenvatting per type'],
          ['GET', '/sync/log', 'Sync geschiedenis'],
          ['POST', '/sync/nu', 'Scraper handmatig starten'],
        ].map(([methode, pad, omschrijving]) => (
          <div key={pad} style={{ display: 'flex', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--rand)', alignItems: 'baseline' }}>
            <span style={{ fontSize: '10px', background: methode === 'POST' ? '#e8f5ed' : '#e8f0f8', color: methode === 'POST' ? '#2d7a4f' : 'var(--blauw)', border: `1px solid ${methode === 'POST' ? '#a8d8b5' : '#a0c0e0'}`, padding: '1px 6px', borderRadius: '3px', fontFamily: 'monospace', flexShrink: 0 }}>
              {methode}
            </span>
            <code style={{ fontSize: '12px', color: 'var(--blauw-mid)', flex: 1 }}>{pad}</code>
            <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', flexShrink: 0 }}>{omschrijving}</span>
          </div>
        ))}
      </Kaart>
        </div>
      )}

      {/* Tab: Excel upload */}
      {actieveTab === 'excel' && (
        <Kaart titel="📊 Excel bestanden uploaden">
          <ExcelUpload />
        </Kaart>
      )}

      {/* Tab: Gebruikers */}
      {actieveTab === 'gebruikers' && (
        <GebruikersBeheer />
      )}

    </div>
  )
}

function GebruikersBeheer() {
  const [gebruikers, setGebruikers] = useState<{id: string; naam: string; rol: string; actief: boolean}[]>([])
  const [laden, setLaden] = useState(true)
  const [nieuwNaam, setNieuwNaam] = useState('')
  const [nieuwRol, setNieuwRol] = useState('fractielid')
  const [opslaan, setOpslaan] = useState(false)

  const laad = async () => {
    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('gebruikers').select('*').order('naam')
    setGebruikers(data || [])
    setLaden(false)
  }

  useEffect(() => { laad() }, [])

  const voegToe = async () => {
    if (!nieuwNaam.trim()) return
    setOpslaan(true)
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('gebruikers').insert({ naam: nieuwNaam.trim(), rol: nieuwRol })
    setNieuwNaam('')
    setNieuwRol('fractielid')
    await laad()
    setOpslaan(false)
  }

  const updateRol = async (id: string, rol: string) => {
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('gebruikers').update({ rol }).eq('id', id)
    setGebruikers(prev => prev.map(g => g.id === id ? { ...g, rol } : g))
  }

  const toggleActief = async (id: string, actief: boolean) => {
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('gebruikers').update({ actief: !actief }).eq('id', id)
    setGebruikers(prev => prev.map(g => g.id === id ? { ...g, actief: !actief } : g))
  }

  const verwijder = async (id: string) => {
    if (!confirm('Gebruiker verwijderen?')) return
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('gebruikers').delete().eq('id', id)
    setGebruikers(prev => prev.filter(g => g.id !== id))
  }

  const rolKleur = (rol: string) => ({
    beheerder: { bg: '#f0e8ff', kleur: '#4a1a5c', rand: '#c0a0d8', label: '⚙️ Beheerder' },
    moderator:  { bg: '#e8f0f8', kleur: '#1a4a7a', rand: '#a0c0e0', label: '✏️ Moderator' },
    fractielid: { bg: '#f0f8f0', kleur: '#1a5c2a', rand: '#a0d8b0', label: '👤 Fractielid' },
  }[rol] || { bg: '#f5f5f5', kleur: '#888', rand: '#ddd', label: rol })

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', border: '1px solid var(--rand)', marginTop: '20px' }}>
      <h2 style={{ fontSize: '16px', color: 'var(--blauw)', fontFamily: 'Arial', fontWeight: '600', margin: '0 0 16px' }}>
        👥 Gebruikersbeheer
      </h2>

      {laden ? (
        <div style={{ color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontSize: '13px' }}>Laden...</div>
      ) : (
        <>
          <div style={{ border: '1px solid var(--rand)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
            {gebruikers.map((g, idx) => {
              const rk = rolKleur(g.rol)
              return (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: idx < gebruikers.length - 1 ? '1px solid #f0ede8' : 'none', background: g.actief ? 'white' : '#f5f5f5', opacity: g.actief ? 1 : 0.6 }}>
                  <span style={{ flex: 1, fontSize: '14px', fontFamily: 'Arial', fontWeight: '600', color: 'var(--blauw)' }}>{g.naam}</span>
                  <select value={g.rol} onChange={e => updateRol(g.id, e.target.value)}
                    style={{ padding: '4px 8px', border: `1px solid ${rk.rand}`, borderRadius: '5px', fontSize: '12px', fontFamily: 'Arial', background: rk.bg, color: rk.kleur, cursor: 'pointer' }}>
                    <option value="fractielid">👤 Fractielid</option>
                    <option value="moderator">✏️ Moderator</option>
                    <option value="beheerder">⚙️ Beheerder</option>
                  </select>
                  <button onClick={() => toggleActief(g.id, g.actief)}
                    style={{ background: g.actief ? '#e8f5ed' : '#f5f5f5', color: g.actief ? '#2d7a4f' : '#888', border: '1px solid #ddd', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Arial' }}>
                    {g.actief ? '✓ Actief' : '✗ Inactief'}
                  </button>
                  <button onClick={() => verwijder(g.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rood)', fontSize: '14px', padding: '0 4px' }}>✕</button>
                </div>
              )
            })}
          </div>

          {/* Nieuwe gebruiker */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={nieuwNaam} onChange={e => setNieuwNaam(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && voegToe()}
              placeholder="Voornaam nieuw fractielid..."
              style={{ flex: 1, minWidth: '150px', padding: '7px 10px', border: '1px solid var(--rand)', borderRadius: '6px', fontSize: '13px', fontFamily: 'Arial', outline: 'none' }} />
            <select value={nieuwRol} onChange={e => setNieuwRol(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid var(--rand)', borderRadius: '6px', fontSize: '13px', fontFamily: 'Arial' }}>
              <option value="fractielid">👤 Fractielid</option>
              <option value="moderator">✏️ Moderator</option>
              <option value="beheerder">⚙️ Beheerder</option>
            </select>
            <button onClick={voegToe} disabled={!nieuwNaam.trim() || opslaan}
              style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600', opacity: !nieuwNaam.trim() ? 0.5 : 1 }}>
              + Toevoegen
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Kaart({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '16px', color: 'var(--blauw)', fontWeight: 'normal', marginBottom: '12px', fontFamily: 'Georgia, serif' }}>{titel}</h3>
      {children}
    </div>
  )
}


function Knop({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'white',
        color: 'var(--blauw)',
        border: '1px solid var(--blauw)',
        padding: '8px 14px',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '13px',
        fontFamily: 'Arial, sans-serif',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}

const tekststijl: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--tekst-zacht)',
  fontFamily: 'Arial, sans-serif',
  lineHeight: 1.6,
}
