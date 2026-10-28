'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const MIN_LENGTE = 8

export default function AccountPagina() {
  const router = useRouter()
  const { naam, heeftEigenWachtwoord, wachtwoordVerplicht, rolWacht, geladen } = useAuth()
  const verplicht = (wachtwoordVerplicht || !!rolWacht) && !heeftEigenWachtwoord
  const [huidig, setHuidig] = useState('')
  const [nieuw, setNieuw] = useState('')
  const [herhaal, setHerhaal] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [klaar, setKlaar] = useState(false)

  if (!geladen) return <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>⏳ Laden...</div>

  const opslaan = async () => {
    setFout(null)
    if (nieuw.length < MIN_LENGTE) { setFout(`Kies een wachtwoord van minimaal ${MIN_LENGTE} tekens.`); return }
    if (nieuw !== herhaal) { setFout('De twee nieuwe wachtwoorden zijn niet gelijk.'); return }
    setBezig(true)
    try {
      const resp = await fetch('/api/wachtwoord', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ huidig, nieuw }),
      })
      const data = await resp.json()
      if (!resp.ok) { setFout(data.fout || 'Opslaan mislukt.') }
      else { setKlaar(true); setHuidig(''); setNieuw(''); setHerhaal('') }
    } catch {
      setFout('Verbindingsfout. Probeer opnieuw.')
    }
    setBezig(false)
  }

  return (
    <div style={{ maxWidth: '460px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', color: 'var(--blauw)', fontWeight: 'normal', marginBottom: '6px' }}>🔑 Mijn wachtwoord</h1>
      <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '20px' }}>
        Ingelogd als <strong>{naam || 'onbekend'}</strong>.{' '}
        {heeftEigenWachtwoord
          ? 'Je hebt een eigen wachtwoord. Hieronder kun je het wijzigen.'
          : rolWacht
            ? `Als ${rolWacht} heb je een eigen wachtwoord nodig. Zodra je dat hebt ingesteld, krijg je je ${rolWacht}srechten.`
            : 'Je logt nu in met de gedeelde toegangscode. Stel een eigen wachtwoord in; daarna werkt de gedeelde code voor jou niet meer.'}
      </p>

      {verplicht && !rolWacht && (
        <div style={{ background: '#fff8e0', border: '1px solid #e8c860', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#8a6800', fontFamily: 'Arial' }}>
          Er is een eigen wachtwoord verplicht gesteld. Stel er eerst een in om verder te gaan.
        </div>
      )}

      {klaar ? (
        <div style={{ background: '#e8f5ed', border: '1px solid #a8d8b5', borderRadius: '8px', padding: '14px 16px', fontFamily: 'Arial', fontSize: '14px', color: '#2d7a4f' }}>
          ✓ Je wachtwoord is opgeslagen. Gebruik het vanaf nu om in te loggen.
          <div style={{ marginTop: '12px' }}>
            <button onClick={() => { window.location.href = '/' }}
              style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial' }}>
              Naar de vergaderingen
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '12px', padding: '20px' }}>
          <Veld label={heeftEigenWachtwoord ? 'Huidig wachtwoord' : rolWacht === 'beheerder' ? 'Beheerderswachtwoord' : rolWacht === 'moderator' ? 'Moderatorwachtwoord' : 'Huidige toegangscode'}>
            <input type="password" value={huidig} onChange={e => setHuidig(e.target.value)} autoComplete="current-password" style={invoer} />
          </Veld>
          <Veld label={`Nieuw wachtwoord (minimaal ${MIN_LENGTE} tekens)`}>
            <input type="password" value={nieuw} onChange={e => setNieuw(e.target.value)} autoComplete="new-password" style={invoer} />
          </Veld>
          <Veld label="Nieuw wachtwoord nogmaals">
            <input type="password" value={herhaal} onChange={e => setHerhaal(e.target.value)} autoComplete="new-password"
              onKeyDown={e => e.key === 'Enter' && opslaan()} style={invoer} />
          </Veld>
          {fout && (
            <div style={{ background: '#fdf0ef', border: '1px solid #e8a090', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#c0392b', fontFamily: 'Arial' }}>{fout}</div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={opslaan} disabled={bezig || !huidig || !nieuw}
              style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '7px', cursor: (bezig || !huidig || !nieuw) ? 'not-allowed' : 'pointer', opacity: (bezig || !huidig || !nieuw) ? 0.5 : 1, fontSize: '13px', fontFamily: 'Arial', fontWeight: '600' }}>
              {bezig ? '⏳ Bezig...' : 'Wachtwoord opslaan'}
            </button>
            {!verplicht && (
              <button onClick={() => router.back()}
                style={{ background: 'white', color: 'var(--tekst-zacht)', border: '1px solid var(--rand)', padding: '9px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial' }}>
                Annuleren
              </button>
            )}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginTop: '14px', marginBottom: 0 }}>
            Vergeten? Dan kan de beheerder je wachtwoord resetten; je logt dan weer in met de gedeelde toegangscode.
          </p>
        </div>
      )}
    </div>
  )
}

function Veld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '5px' }}>{label}</label>
      {children}
    </div>
  )
}

const invoer: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' }
