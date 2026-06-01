'use client'

import { useState } from 'react'

const VASTE_LEDEN = ['Vera', 'Pieter', 'Claudia', 'Bianca', 'Ralph', 'Marga', 'Robin', 'Jan']

interface AanwezigheidChecklistProps {
  aanwezig: string
  afwezig: string
  online: string
  onUpdate: (w: { aanwezig?: string; afwezig?: string; online?: string }) => void
}

type Status = 'aanwezig' | 'online' | 'afwezig'

export default function AanwezigheidChecklist({ aanwezig, afwezig, online, onUpdate }: AanwezigheidChecklistProps) {
  const [gast, setGast] = useState('')
  const [gasten, setGasten] = useState<string[]>([])

  // Parse huidige aanwezigheid
  const parseNamen = (str: string) => str.split(',').map(n => n.trim()).filter(Boolean)

  const getStatus = (naam: string): Status => {
    if (parseNamen(aanwezig).includes(naam)) return 'aanwezig'
    if (parseNamen(online).includes(naam)) return 'online'
    return 'afwezig'
  }

  const setStatus = (naam: string, status: Status) => {
    const alleNamen = [...VASTE_LEDEN, ...gasten]
    const nieuweAanwezig = alleNamen.filter(n => n === naam ? status === 'aanwezig' : getStatus(n) === 'aanwezig')
    const nieuweOnline = alleNamen.filter(n => n === naam ? status === 'online' : getStatus(n) === 'online')
    const nieuweAfwezig = alleNamen.filter(n => n === naam ? status === 'afwezig' : getStatus(n) === 'afwezig')

    onUpdate({
      aanwezig: nieuweAanwezig.join(', '),
      online: nieuweOnline.join(', '),
      afwezig: nieuweAfwezig.join(', '),
    })
  }

  const voegGastToe = () => {
    if (!gast.trim() || gasten.includes(gast.trim())) return
    const nieuweGasten = [...gasten, gast.trim()]
    setGasten(nieuweGasten)
    // Zet gast standaard op aanwezig
    const huidigAanwezig = parseNamen(aanwezig)
    onUpdate({ aanwezig: [...huidigAanwezig, gast.trim()].join(', ') })
    setGast('')
  }

  const verwijderGast = (naam: string) => {
    setGasten(gasten.filter(g => g !== naam))
    // Verwijder uit alle lijsten
    onUpdate({
      aanwezig: parseNamen(aanwezig).filter(n => n !== naam).join(', '),
      online: parseNamen(online).filter(n => n !== naam).join(', '),
      afwezig: parseNamen(afwezig).filter(n => n !== naam).join(', '),
    })
  }

  const alleNamen = [...VASTE_LEDEN, ...gasten]
  const aantalAanwezig = alleNamen.filter(n => getStatus(n) === 'aanwezig').length
  const aantalOnline = alleNamen.filter(n => getStatus(n) === 'online').length
  const aantalAfwezig = alleNamen.filter(n => getStatus(n) === 'afwezig').length

  return (
    <div>
      {/* Samenvatting */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Pill kleur="#2d7a4f" bg="#e8f5ed">✓ {aantalAanwezig} aanwezig</Pill>
        {aantalOnline > 0 && <Pill kleur="#1a5c8a" bg="#e8f0f8">💻 {aantalOnline} online</Pill>}
        {aantalAfwezig > 0 && <Pill kleur="#c0392b" bg="#fdf0ef">✗ {aantalAfwezig} afwezig</Pill>}
      </div>

      {/* Checklijst */}
      <div style={{ border: '1px solid var(--rand)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
        {alleNamen.map((naam, idx) => {
          const status = getStatus(naam)
          const isGast = gasten.includes(naam)
          return (
            <div key={naam} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px',
              borderBottom: idx < alleNamen.length - 1 ? '1px solid #f0ede8' : 'none',
              background: status === 'aanwezig' ? '#f0faf2' : status === 'online' ? '#f0f8ff' : '#fdf5f5',
            }}>
              <span style={{ flex: 1, fontSize: '14px', fontFamily: 'Arial', color: 'var(--tekst)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {naam}
                {isGast && <span style={{ fontSize: '10px', background: '#f5eeff', color: '#4a1a5c', border: '1px solid #c0a0d8', padding: '1px 5px', borderRadius: '3px' }}>Gast</span>}
              </span>

              {/* Status knoppen */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <StatusKnop label="✓" title="Aanwezig" actief={status === 'aanwezig'} kleur="#2d7a4f" bg="#e8f5ed"
                  onClick={() => setStatus(naam, 'aanwezig')} />
                <StatusKnop label="💻" title="Online" actief={status === 'online'} kleur="#1a5c8a" bg="#e8f0f8"
                  onClick={() => setStatus(naam, 'online')} />
                <StatusKnop label="✗" title="Afwezig" actief={status === 'afwezig'} kleur="#c0392b" bg="#fdf0ef"
                  onClick={() => setStatus(naam, 'afwezig')} />
              </div>

              {isGast && (
                <button onClick={() => verwijderGast(naam)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '14px', padding: '0 4px' }}>
                  ✕
                </button>
              )}
            </div>
          )
        })}
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
        <button onClick={voegGastToe} disabled={!gast.trim()}
          style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '7px', cursor: gast.trim() ? 'pointer' : 'not-allowed', fontSize: '13px', fontFamily: 'Arial', opacity: gast.trim() ? 1 : 0.5 }}>
          + Toevoegen
        </button>
      </div>
    </div>
  )
}

function StatusKnop({ label, title, actief, kleur, bg, onClick }: {
  label: string; title: string; actief: boolean; kleur: string; bg: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} title={title} style={{
      background: actief ? bg : 'white',
      border: `1.5px solid ${actief ? kleur : '#ddd'}`,
      color: actief ? kleur : '#ccc',
      padding: '4px 10px', borderRadius: '5px',
      cursor: 'pointer', fontSize: '13px',
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
