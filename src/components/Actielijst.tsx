'use client'

import { useState } from 'react'
import { ActieItem } from '@/lib/types'
import { formatDatumNL, eersteVolgendeMaandag } from '@/lib/datum'

interface ActielijstProps {
  acties: ActieItem[]
  vergaderingen?: { id: string; titel: string; datum: string }[]
  vergaderingId: string
  onVoegToe: (naam: string, actie: string, deadline: string) => void
  onToggle: (id: string) => void
  onVerwijder: (id: string) => void
  onNeemOver?: (vanId: string) => void
  isLeesweergave?: boolean
}

export default function Actielijst({
  acties, vergaderingen, onVoegToe, onToggle, onVerwijder, onNeemOver, isLeesweergave
}: ActielijstProps) {
  const [naam, setNaam] = useState('')
  const [actie, setActie] = useState('')
  const [deadline, setDeadline] = useState(eersteVolgendeMaandag())
  const [toonOvernemen, setToonOvernemen] = useState(false)

  const handleToevoegen = () => {
    if (!naam.trim() || !actie.trim()) return
    onVoegToe(naam.trim(), actie.trim(), deadline)
    setNaam('')
    setActie('')
    setDeadline(eersteVolgendeMaandag())
  }

  const openActies = acties.filter(a => !a.afgedaan)
  const gedaanActies = acties.filter(a => a.afgedaan)

  return (
    <div style={{ border: '1px solid var(--rand)', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#fff8e8', borderBottom: '1px solid #dfc070', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: 'bold', color: '#8a6820' }}>
          ✓ Actielijst — {openActies.length} open, {gedaanActies.length} afgedaan
        </span>
        {!isLeesweergave && vergaderingen && vergaderingen.length > 0 && onNeemOver && (
          <button onClick={() => setToonOvernemen(!toonOvernemen)}
            style={{ fontSize: '12px', fontFamily: 'Arial', background: 'white', border: '1px solid #dfc070', color: '#8a6820', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer' }}>
            ← Overnemen van vorige FV
          </button>
        )}
      </div>

      {/* Overnemen */}
      {toonOvernemen && vergaderingen && onNeemOver && (
        <div style={{ padding: '12px 16px', background: '#fffdf5', borderBottom: '1px solid var(--rand)' }}>
          <p style={{ fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst-zacht)', marginBottom: '8px' }}>
            Open acties overnemen van:
          </p>
          {vergaderingen.map(v => (
            <button key={v.id} onClick={() => { onNeemOver(v.id); setToonOvernemen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', fontSize: '13px', fontFamily: 'Arial', background: 'white', border: '1px solid var(--rand)', borderRadius: '5px', cursor: 'pointer', color: 'var(--blauw)', marginBottom: '4px' }}>
              {v.titel} {v.datum && `(${v.datum})`}
            </button>
          ))}
        </div>
      )}

      {/* Open acties */}
      {openActies.map(a => (
        <ActieRij key={a.id} actie={a} onToggle={() => onToggle(a.id)} onVerwijder={() => onVerwijder(a.id)} isLeesweergave={isLeesweergave} />
      ))}

      {/* Afgedane acties */}
      {gedaanActies.length > 0 && (
        <>
          <div style={{ padding: '6px 16px', background: '#f5f4f0', borderTop: '1px solid var(--rand)', fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', letterSpacing: '0.5px' }}>
            AFGEDAAN
          </div>
          {gedaanActies.map(a => (
            <ActieRij key={a.id} actie={a} onToggle={() => onToggle(a.id)} onVerwijder={() => onVerwijder(a.id)} isLeesweergave={isLeesweergave} />
          ))}
        </>
      )}

      {acties.length === 0 && (
        <div style={{ padding: '20px', fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic', textAlign: 'center' }}>
          Nog geen acties
        </div>
      )}

      {/* Nieuw toevoegen */}
      {!isLeesweergave && (
        <div style={{ padding: '12px 16px', background: '#fafaf8', borderTop: '1px solid var(--rand)' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 130px' }}>
              <div style={labelStijl}>Naam</div>
              <input style={invoerStijl} value={naam} onChange={e => setNaam(e.target.value)}
                placeholder="Wie?" onKeyDown={e => e.key === 'Enter' && handleToevoegen()} />
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <div style={labelStijl}>Actie</div>
              <input style={invoerStijl} value={actie} onChange={e => setActie(e.target.value)}
                placeholder="Wat te doen?" onKeyDown={e => e.key === 'Enter' && handleToevoegen()} />
            </div>
            <div style={{ flex: '0 0 140px' }}>
              <div style={labelStijl}>Deadline</div>
              <input type="date" style={invoerStijl} value={deadline}
                onChange={e => setDeadline(e.target.value)} />
            </div>
            <button onClick={handleToevoegen} disabled={!naam.trim() || !actie.trim()}
              style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', opacity: (!naam.trim() || !actie.trim()) ? 0.5 : 1, whiteSpace: 'nowrap' as const }}>
              + Toevoegen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ActieRij({ actie: a, onToggle, onVerwijder, isLeesweergave }: {
  actie: ActieItem; onToggle: () => void; onVerwijder: () => void; isLeesweergave?: boolean
}) {
  const heeftDeadline = !!a.deadline
  const isOverDue = heeftDeadline && !a.afgedaan && a.deadline! < new Date().toISOString().split('T')[0]
  const isBinnenkort = heeftDeadline && !a.afgedaan && !isOverDue && a.deadline! <= (() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0]
  })()

  return (
    <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0ede8', display: 'flex', alignItems: 'flex-start', gap: '10px', background: isOverDue ? '#fdf5f5' : 'white' }}>
      {!isLeesweergave ? (
        <input type="checkbox" checked={a.afgedaan} onChange={onToggle}
          style={{ width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0, marginTop: '3px' }} />
      ) : (
        <span style={{ fontSize: '14px', flexShrink: 0 }}>{a.afgedaan ? '✅' : '⬜'}</span>
      )}
      <span style={{ fontSize: '13px', fontFamily: 'Arial', color: 'var(--blauw)', fontWeight: 'bold', minWidth: '80px', textDecoration: a.afgedaan ? 'line-through' : 'none', opacity: a.afgedaan ? 0.5 : 1 }}>
        {a.naam}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontFamily: 'Arial', textDecoration: a.afgedaan ? 'line-through' : 'none', opacity: a.afgedaan ? 0.5 : 1, color: a.afgedaan ? 'var(--tekst-zacht)' : 'var(--tekst)' }}>
          {a.actie}
        </div>
        {heeftDeadline && (
          <div style={{ fontSize: '11px', fontFamily: 'Arial', marginTop: '2px', color: isOverDue ? 'var(--rood)' : isBinnenkort ? 'var(--oranje)' : 'var(--tekst-zacht)', fontWeight: isOverDue ? 'bold' : 'normal' }}>
            {isOverDue ? '⚠️ Verlopen: ' : '📅 Deadline: '}
            {formatDatumNL(a.deadline!)}
          </div>
        )}
      </div>
      {a.datum && (
        <span style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', flexShrink: 0 }}>
          {formatDatumNL(a.datum)}
        </span>
      )}
      {!isLeesweergave && (
        <button onClick={onVerwijder} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '14px', flexShrink: 0, padding: '0 4px' }}>✕</button>
      )}
    </div>
  )
}

const invoerStijl: React.CSSProperties = {
  width: '100%', padding: '7px 10px', border: '1px solid var(--rand)',
  borderRadius: '6px', fontSize: '13px', fontFamily: 'Arial', background: 'white', outline: 'none',
  boxSizing: 'border-box' as const,
}
const labelStijl: React.CSSProperties = {
  fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '3px',
}
