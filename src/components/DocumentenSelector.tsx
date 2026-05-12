'use client'

import { useState } from 'react'
import { ApiDocument } from '@/lib/types'

interface DocumentenSelectorProps {
  documenten: ApiDocument[]
  onToevoegen: (geselecteerd: ApiDocument[]) => void
  onSyncNu: () => void
  laden: boolean
}

const TYPE_LABEL: Record<string, { label: string; bg: string; kleur: string; rand: string }> = {
  raadsmededelingen: { label: 'RM', bg: '#e8f0f8', kleur: '#1a3a5c', rand: '#a0c0e0' },
  technische_vragen: { label: 'TQ', bg: '#f0e8f8', kleur: '#5a3a8a', rand: '#c0a0d8' },
  schriftelijke_vragen: { label: 'SQ', bg: '#f8f0e8', kleur: '#8a6020', rand: '#d8c0a0' },
}

export default function DocumentenSelector({ documenten, onToevoegen, onSyncNu, laden }: DocumentenSelectorProps) {
  const [geselecteerd, setGeselecteerd] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    const nieuw = new Set(geselecteerd)
    if (nieuw.has(id)) nieuw.delete(id)
    else nieuw.add(id)
    setGeselecteerd(nieuw)
  }

  const alles = () => setGeselecteerd(new Set(documenten.map(d => d.id)))
  const niets = () => setGeselecteerd(new Set())

  const voegToe = () => {
    const sel = documenten.filter(d => geselecteerd.has(d.id))
    onToevoegen(sel)
    setGeselecteerd(new Set())
  }

  if (documenten.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
        <p style={{ marginBottom: '16px' }}>Klik op &quot;Documenten vernieuwen&quot; op het agenda-tabblad om nieuwe documenten op te halen.</p>
        <button
          onClick={onSyncNu}
          disabled={laden}
          style={{
            background: 'var(--blauw)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {laden ? '↻ Bezig...' : '↻ Documenten ophalen'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', marginBottom: '16px' }}>
        {documenten.length} document(en) gevonden. Selecteer welke toe te voegen aan de agenda.
      </p>

      {documenten.map(doc => {
        const badge = TYPE_LABEL[doc.type] || TYPE_LABEL.raadsmededelingen
        const sel = geselecteerd.has(doc.id)
        return (
          <div
            key={doc.id}
            onClick={() => toggle(doc.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '10px',
              border: `1px solid ${sel ? 'var(--blauw)' : 'var(--rand)'}`,
              borderRadius: '8px',
              marginBottom: '8px',
              background: sel ? 'var(--blauw-licht)' : 'white',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={sel}
              onChange={() => toggle(doc.id)}
              onClick={e => e.stopPropagation()}
              style={{ marginTop: '2px' }}
            />
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'Arial, sans-serif',
              whiteSpace: 'nowrap',
              background: badge.bg,
              color: badge.kleur,
              border: `1px solid ${badge.rand}`,
              flexShrink: 0,
            }}>
              {badge.label}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px' }}>{doc.titel}</div>
              <div style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', marginTop: '2px' }}>
                {(doc.publicatiedatum || doc.gevonden_op) && (
                  <span style={{ background: '#f0ede8', padding: '1px 5px', borderRadius: '3px', marginRight: '6px' }}>
                    {doc.publicatiedatum || doc.gevonden_op?.split('T')[0]}
                  </span>
                )}
                {doc.indieners}
                {doc.fracties && ` (${doc.fracties})`}
                {doc.afgedaan === 'Afgedaan' && (
                  <span style={{
                    fontSize: '10px',
                    background: '#e8f5ed',
                    color: '#2d7a4f',
                    border: '1px solid #a8d8b5',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    marginLeft: '6px',
                  }}>
                    Afgedaan
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={voegToe}
          disabled={geselecteerd.size === 0}
          style={{
            background: 'var(--blauw)',
            color: 'white',
            border: 'none',
            padding: '9px 18px',
            borderRadius: '8px',
            cursor: geselecteerd.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontFamily: 'Arial, sans-serif',
            opacity: geselecteerd.size === 0 ? 0.5 : 1,
          }}
        >
          + {geselecteerd.size} geselecteerd toevoegen
        </button>
        <button onClick={alles} style={btnStijl}>Alles selecteren</button>
        <button onClick={niets} style={btnStijl}>Niets</button>
      </div>
    </div>
  )
}

const btnStijl: React.CSSProperties = {
  background: 'white',
  color: 'var(--blauw)',
  border: '1px solid var(--blauw)',
  padding: '9px 14px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontFamily: 'Arial, sans-serif',
}
