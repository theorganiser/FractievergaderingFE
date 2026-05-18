'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useVergaderingen } from '@/hooks/useVergaderingen'
import { testVerbinding, haalSyncLog } from '@/lib/api'
import Melding from '@/components/Melding'

export default function BeheerPagina() {
  const { isAdmin, geladen } = useAuth()
  const router = useRouter()
  const { vergaderingen } = useVergaderingen()
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
    <div style={{ maxWidth: '600px' }}>
      <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: 'normal', marginBottom: '4px' }}>Beheer</h1>
      <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', marginBottom: '24px' }}>
        Instellingen en API-status
      </p>

      {melding && <Melding type={melding.type} tekst={melding.tekst} onSluit={() => setMelding(null)} />}

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
