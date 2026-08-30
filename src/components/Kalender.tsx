'use client'

import { useState } from 'react'
import { KalenderItem } from '../lib/types'

interface KalenderProps {
  items: KalenderItem[]
  onVoegToe: (item: Omit<KalenderItem, 'id'>) => void
  onVerwijder: (id: string) => void
  onUpdate: (id: string, w: Partial<KalenderItem>) => void
  isLeesweergave?: boolean
}

export default function Kalender({ items, onVoegToe, onVerwijder, onUpdate, isLeesweergave }: KalenderProps) {
  const [datum, setDatum] = useState('')
  const [omschrijving, setOmschrijving] = useState('')
  const [personen, setPersonen] = useState('')

  const handleToevoegen = () => {
    if (!datum || !omschrijving.trim()) return
    onVoegToe({ datum, omschrijving: omschrijving.trim(), personen: personen.trim() })
    setDatum(''); setOmschrijving(''); setPersonen('')
  }

  const gesorteerd = [...items].sort((a, b) => a.datum.localeCompare(b.datum))

  return (
    <div style={{ border: '1px solid var(--rand)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ background: '#e8f5ed', borderBottom: '1px solid #a8d8b5', padding: '10px 16px' }}>
        <span style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: 'bold', color: '#2d7a4f' }}>
          📅 Algemene agendapunten
        </span>
      </div>

      {gesorteerd.length === 0 && (
        <div style={{ padding: '16px', fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic', textAlign: 'center' }}>
          Nog geen kalenderitems
        </div>
      )}

      {gesorteerd.map(item => (
        <div key={item.id} style={{ padding: '8px 16px', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'center', gap: '12px', background: 'white' }}>
          <span style={{ fontSize: '12px', fontFamily: 'Arial', color: 'var(--blauw)', fontWeight: 'bold', minWidth: '90px', flexShrink: 0 }}>
            {formatKalenderDatum(item.datum)}
          </span>
          {isLeesweergave ? (
            <>
              <span style={{ fontSize: '13px', fontFamily: 'Arial', flex: 1 }}>{item.omschrijving}</span>
              {item.personen && <span style={{ fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst-zacht)', fontStyle: 'italic' }}>{item.personen}</span>}
            </>
          ) : (
            <>
              <input
                style={{ ...invoerStijl, flex: 1, fontSize: '13px' }}
                value={item.omschrijving}
                onChange={e => onUpdate(item.id, { omschrijving: e.target.value })}
              />
              <input
                style={{ ...invoerStijl, width: '120px', fontSize: '12px' }}
                value={item.personen || ''}
                onChange={e => onUpdate(item.id, { personen: e.target.value })}
                placeholder="Wie?"
              />
              <button onClick={() => onVerwijder(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '14px' }}>✕</button>
            </>
          )}
        </div>
      ))}

      {!isLeesweergave && (
        <div style={{ padding: '12px 16px', background: '#fafaf8', borderTop: '1px solid var(--rand)', display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div style={labelStijl}>Datum</div>
            <input type="date" style={{ ...invoerStijl, width: '140px' }} value={datum} onChange={e => setDatum(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <div style={labelStijl}>Omschrijving</div>
            <input style={invoerStijl} value={omschrijving} onChange={e => setOmschrijving(e.target.value)} placeholder="Wat?" onKeyDown={e => e.key === 'Enter' && handleToevoegen()} />
          </div>
          <div style={{ width: '120px' }}>
            <div style={labelStijl}>Wie (optioneel)</div>
            <input style={invoerStijl} value={personen} onChange={e => setPersonen(e.target.value)} placeholder="Namen" />
          </div>
          <button onClick={handleToevoegen} disabled={!datum || !omschrijving.trim()}
            style={{ background: '#2d7a4f', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', opacity: (!datum || !omschrijving.trim()) ? 0.5 : 1, whiteSpace: 'nowrap' }}>
            + Toevoegen
          </button>
        </div>
      )}
    </div>
  )
}

function formatKalenderDatum(datum: string): string {
  if (!datum) return ''
  try {
    const d = new Date(datum + 'T12:00:00')
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return datum }
}

const invoerStijl: React.CSSProperties = { width: '100%', padding: '6px 8px', border: '1px solid var(--rand)', borderRadius: '5px', fontSize: '13px', fontFamily: 'Arial', background: 'white', outline: 'none' }
const labelStijl: React.CSSProperties = { fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '3px' }
