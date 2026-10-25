'use client'

import { useEffect, useState } from 'react'
import { apiJson } from '@/lib/dataApi'
import { statusVan, alleGenoemdeNamen, zelfdeNaam, AanwezigheidStatus } from '@/lib/aanwezigheid'

interface AanwezigheidChecklistProps {
  aanwezig: string
  afwezig: string
  online: string
  // Zet de status van één persoon (null = weghalen, voor gasten). true = gelukt.
  onZet: (naam: string, status: AanwezigheidStatus | null) => Promise<boolean>
}

// Beheerder/moderator: overzicht en correctie van de aanwezigheid.
// De ledenlijst komt uit de gebruikers-tabel (actieve leden); namen die in de lijsten staan maar
// geen lid zijn, worden als gast getoond. Elke klik verandert alleen die ene persoon op de server,
// zodat antwoorden die fractieleden ondertussen via de pop-up geven nooit worden gewist.
export default function AanwezigheidChecklist({ aanwezig, afwezig, online, onZet }: AanwezigheidChecklistProps) {
  const [gast, setGast] = useState('')
  const [leden, setLeden] = useState<string[]>([])
  const [bezig, setBezig] = useState<string | null>(null)

  useEffect(() => {
    apiJson<string[]>('/api/gebruikers/namen').then(setLeden).catch(() => setLeden([]))
  }, [])

  const lijsten = { aanwezig, online, afwezig }
  const gasten = alleGenoemdeNamen(lijsten).filter(n => !leden.some(l => zelfdeNaam(l, n)))
  const alleNamen = [...leden, ...gasten]
  const getStatus = (naam: string) => statusVan(lijsten, naam)

  const zet = async (naam: string, status: AanwezigheidStatus | null) => {
    setBezig(naam)
    await onZet(naam, status)
    setBezig(null)
  }

  const voegGastToe = async () => {
    const naam = gast.trim().replace(/,/g, ' ')
    if (!naam || alleNamen.some(n => zelfdeNaam(n, naam))) return
    await zet(naam, 'aanwezig')
    setGast('')
  }

  const aantal = (s: AanwezigheidStatus | null) => alleNamen.filter(n => getStatus(n) === s).length

  return (
    <div>
      {/* Samenvatting */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Pill kleur="#2d7a4f" bg="#e8f5ed">✓ {aantal('aanwezig')} aanwezig</Pill>
        {aantal('online') > 0 && <Pill kleur="#1a5c8a" bg="#e8f0f8">💻 {aantal('online')} online</Pill>}
        {aantal('afwezig') > 0 && <Pill kleur="#c0392b" bg="#fdf0ef">✗ {aantal('afwezig')} afwezig</Pill>}
        {aantal(null) > 0 && <Pill kleur="#888" bg="#f0ede8">❔ {aantal(null)} nog niet gereageerd</Pill>}
      </div>

      {/* Checklijst */}
      <div style={{ border: '1px solid var(--rand)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
        {alleNamen.map((naam, idx) => {
          const status = getStatus(naam)
          const isGast = gasten.includes(naam)
          const uit = bezig !== null
          return (
            <div key={naam} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px',
              borderBottom: idx < alleNamen.length - 1 ? '1px solid #f0ede8' : 'none',
              background: status === 'aanwezig' ? '#f0faf2' : status === 'online' ? '#f0f8ff' : status === 'afwezig' ? '#fdf5f5' : '#fafafa',
              opacity: bezig === naam ? 0.6 : 1,
            }}>
              <span style={{ flex: 1, fontSize: '14px', fontFamily: 'Arial', color: 'var(--tekst)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {naam}
                {isGast && <span style={{ fontSize: '10px', background: '#f5eeff', color: '#4a1a5c', border: '1px solid #c0a0d8', padding: '1px 5px', borderRadius: '3px' }}>Gast</span>}
                {status === null && <span style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>nog niet gereageerd</span>}
              </span>

              {/* Status knoppen */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <StatusKnop label="✓" title="Aanwezig" actief={status === 'aanwezig'} uit={uit} kleur="#2d7a4f" bg="#e8f5ed"
                  onClick={() => zet(naam, 'aanwezig')} />
                <StatusKnop label="💻" title="Online" actief={status === 'online'} uit={uit} kleur="#1a5c8a" bg="#e8f0f8"
                  onClick={() => zet(naam, 'online')} />
                <StatusKnop label="✗" title="Afwezig" actief={status === 'afwezig'} uit={uit} kleur="#c0392b" bg="#fdf0ef"
                  onClick={() => zet(naam, 'afwezig')} />
              </div>

              {isGast && (
                <button onClick={() => zet(naam, null)} disabled={uit} title="Gast verwijderen"
                  style={{ background: 'none', border: 'none', cursor: uit ? 'not-allowed' : 'pointer', color: 'var(--tekst-zacht)', fontSize: '14px', padding: '0 4px' }}>
                  ✕
                </button>
              )}
            </div>
          )
        })}
        {alleNamen.length === 0 && (
          <div style={{ padding: '12px 14px', fontSize: '13px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>Ledenlijst laden…</div>
        )}
      </div>

      {/* Gast toevoegen */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={gast}
          onChange={e => setGast(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && voegGastToe()}
          placeholder="Gast toevoegen..."
          style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--rand)', borderRadius: '7px', fontSize: '13px', fontFamily: 'Arial', outline: 'none' }}
        />
        <button onClick={voegGastToe} disabled={!gast.trim() || bezig !== null}
          style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '7px', cursor: gast.trim() ? 'pointer' : 'not-allowed', fontSize: '13px', fontFamily: 'Arial', opacity: gast.trim() ? 1 : 0.5 }}>
          + Toevoegen
        </button>
      </div>
    </div>
  )
}

function StatusKnop({ label, title, actief, uit, kleur, bg, onClick }: {
  label: string; title: string; actief: boolean; uit: boolean; kleur: string; bg: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} title={title} disabled={uit} style={{
      background: actief ? bg : 'white',
      border: `1.5px solid ${actief ? kleur : '#ddd'}`,
      color: actief ? kleur : '#ccc',
      padding: '4px 10px', borderRadius: '5px',
      cursor: uit ? 'wait' : 'pointer', fontSize: '13px',
      fontWeight: actief ? 'bold' : 'normal',
      transition: 'all 0.15s',
      minWidth: '36px',
    }}>
      {label}
    </button>
  )
}

function Pill({ children, kleur, bg }: { children: React.ReactNode; kleur: string; bg: string }) {
  return (
    <span style={{ background: bg, color: kleur, border: `1px solid ${kleur}40`, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600' }}>
      {children}
    </span>
  )
}
