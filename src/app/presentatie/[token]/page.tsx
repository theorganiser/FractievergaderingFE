'use client'

import { useState } from 'react'
import { useVergaderingOpToken } from '@/hooks/useVergaderingen'
import { formatDatum } from '@/lib/datum'
import { Vergadering } from '@/lib/types'

interface Props { params: { token: string } }

export default function PresentatiePagina({ params }: Props) {
  const { token } = params
  const { vergadering, geladen } = useVergaderingOpToken(token)

  if (!geladen) return <div style={{ background: '#0d2b4e', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontFamily: 'Arial' }}>Laden...</div>
  if (!vergadering) return <div style={{ background: '#0d2b4e', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial' }}>Vergadering niet gevonden</div>

  return <PresentatieScherm vergadering={vergadering} />
}

function PresentatieScherm({ vergadering: v }: { vergadering: Vergadering }) {
  const [ingeklapt, setIngeklapt] = useState<Set<number>>(new Set())
  const [afgehandeld, setAfgehandeld] = useState<Set<number>>(new Set())
  const [huidig, setHuidig] = useState<number | null>(null)
  const [grootLettertype, setGrootLettertype] = useState(false)
  const [donkerModus, setDonkerModus] = useState(false)

  const toggleIngeklapt = (id: number) => setIngeklapt(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAfgehandeld = (id: number) => { setAfgehandeld(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }); setHuidig(id) }

  const bg = donkerModus ? '#0d2b4e' : '#f4f6f9'
  const kaartBg = donkerModus ? '#1a3a5c' : 'white'
  const kaartRand = donkerModus ? '#2a5a8c' : '#dde3ed'
  const basisFs = grootLettertype ? '20px' : '16px'
  const voortgang = Math.round((afgehandeld.size / Math.max(v.punten.length, 1)) * 100)

  return (
    <div style={{ minHeight: '100vh', background: bg, transition: 'all 0.3s' }}>
      <div style={{ background: '#0d2b4e', color: 'white', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 50, borderBottom: '3px solid #e8c84a' }} className="no-print">
        <div style={{ background: '#e8c84a', color: '#0d2b4e', fontWeight: '900', fontSize: '13px', padding: '3px 8px', borderRadius: '3px' }}>GDP</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '600' }}>{v.titel}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>{v.datum ? formatDatum(v.datum) : ''} — {v.aanvang} uur</div>
        </div>
        <div style={{ width: '140px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${voortgang}%`, height: '100%', background: '#e8c84a', borderRadius: '3px', transition: 'width 0.4s' }} />
        </div>
        <span style={{ fontSize: '12px', color: '#e8c84a', fontFamily: 'Arial', minWidth: '36px' }}>{voortgang}%</span>
        <button onClick={() => setGrootLettertype(!grootLettertype)} style={pk}>{grootLettertype ? 'A−' : 'A+'}</button>
        <button onClick={() => setDonkerModus(!donkerModus)} style={pk}>{donkerModus ? '☀️' : '🌙'}</button>
        <button onClick={() => window.print()} style={pk}>⎙</button>
        <a href="javascript:history.back()" style={{ ...pk, textDecoration: 'none', fontSize: '12px' }}>← Terug</a>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '20px' }}>
        <div style={{ background: kaartBg, border: `1px solid ${kaartRand}`, borderRadius: '10px', padding: '12px 20px', marginBottom: '16px', fontSize: '13px', fontFamily: 'Arial', color: donkerModus ? '#a0c0e0' : 'var(--tekst-zacht)', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {v.aanwezig && <span><strong style={{ color: donkerModus ? 'white' : 'var(--tekst)' }}>Aanwezig:</strong> {v.aanwezig}</span>}
          {v.online && <span><strong style={{ color: donkerModus ? 'white' : 'var(--tekst)' }}>Online:</strong> {v.online}</span>}
          {v.afwezig && <span><strong style={{ color: donkerModus ? 'white' : 'var(--tekst)' }}>Afwezig:</strong> {v.afwezig}</span>}
        </div>

        {v.punten.map((punt) => {
          const isDone = afgehandeld.has(punt.id)
          const isActive = huidig === punt.id && !isDone
          const isKlapt = ingeklapt.has(punt.id)
          return (
            <div key={punt.id} style={{ background: isDone ? (donkerModus ? '#0a200a' : '#f0faf2') : isActive ? (donkerModus ? '#162e4a' : '#fffbea') : kaartBg, border: `2px solid ${isActive ? '#e8c84a' : isDone ? (donkerModus ? '#1a4a1a' : '#a8d8b5') : kaartRand}`, borderRadius: '10px', marginBottom: '8px', overflow: 'hidden', opacity: isDone ? 0.55 : 1, transition: 'all 0.2s' }}>
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setHuidig(isActive ? null : punt.id)}>
                <span style={{ fontSize: basisFs, fontWeight: '700', color: isDone ? '#6dbb80' : '#e8c84a', minWidth: '36px', fontFamily: 'Arial' }}>{isDone ? '✓' : `${punt.id}.`}</span>
                <span style={{ flex: 1, fontSize: basisFs, fontWeight: isActive ? '700' : '500', textDecoration: isDone ? 'line-through' : 'none', fontFamily: 'Arial', color: donkerModus ? (isDone ? '#6dbb80' : 'white') : (isDone ? '#3a8a50' : '#0d2b4e') }}>{punt.titel}</span>
                {punt.toelichting && <span style={{ fontSize: '13px', color: donkerModus ? 'rgba(255,255,255,0.4)' : '#888', fontStyle: 'italic', fontFamily: 'Arial' }}>{punt.toelichting}</span>}
                <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                  {punt.subpunten.length > 0 && <button onClick={() => toggleIngeklapt(punt.id)} style={{ ...pk2, background: donkerModus ? 'rgba(255,255,255,0.1)' : '#eee' }}>{isKlapt ? '▸' : '▾'}</button>}
                  <button onClick={() => toggleAfgehandeld(punt.id)} style={{ ...pk2, background: isDone ? '#6dbb80' : (donkerModus ? 'rgba(255,255,255,0.1)' : '#eee'), color: isDone ? 'white' : 'inherit' }}>{isDone ? '↩' : '✓'}</button>
                </div>
              </div>
              {!isKlapt && punt.subpunten.length > 0 && (
                <div style={{ borderTop: `1px solid ${kaartRand}` }}>
                  {punt.subpunten.map((sub, si) => (
                    <div key={sub.id} style={{ padding: '9px 16px 9px 56px', borderBottom: si < punt.subpunten.length - 1 ? `1px solid ${donkerModus ? 'rgba(255,255,255,0.06)' : '#f0ede8'}` : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '13px', color: donkerModus ? 'rgba(255,255,255,0.35)' : '#999', fontStyle: 'italic', minWidth: '18px', fontFamily: 'Arial' }}>{String.fromCharCode(97 + si)}.</span>
                      {sub.url ? <a href={sub.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: `calc(${basisFs} - 2px)`, color: '#5a9fd4', fontFamily: 'Arial', flex: 1 }}>{sub.titel}</a>
                        : <span style={{ fontSize: `calc(${basisFs} - 2px)`, fontFamily: 'Arial', flex: 1, color: donkerModus ? '#c0d8f0' : '#1a1a2e' }}>{sub.titel}</span>}
                      {sub.afgedaan && <span style={{ fontSize: '10px', background: '#d4f5dd', color: '#1a5c2a', border: '1px solid #6dbb80', padding: '1px 5px', borderRadius: '3px' }}>Afgedaan</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        <div style={{ height: '40px' }} />
      </div>
    </div>
  )
}

const pk: React.CSSProperties = { background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial' }
const pk2: React.CSSProperties = { padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', border: '1px solid rgba(0,0,0,0.12)', fontFamily: 'Arial' }
