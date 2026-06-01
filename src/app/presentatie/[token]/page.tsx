'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useVergaderingOpToken } from '@/hooks/useVergaderingen'
import { formatDatum, formatDatumNL } from '@/lib/datum'
import { Vergadering } from '@/lib/types'

interface Props { params: { token: string } }

export default function PresentatiePagina({ params }: Props) {
  const { token } = params
  const { vergadering, geladen } = useVergaderingOpToken(token)

  if (!geladen) return (
    <div style={{ background: '#2d0a40', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontFamily: 'Arial' }}>
      Laden...
    </div>
  )
  if (!vergadering) return (
    <div style={{ background: '#2d0a40', color: 'white', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial' }}>
      Vergadering niet gevonden
    </div>
  )
  return <PresentatieScherm vergadering={vergadering} />
}

function PresentatieScherm({ vergadering: v }: { vergadering: Vergadering }) {
  const [ingeklapt, setIngeklapt] = useState<Set<number>>(new Set())
  const [afgehandeld, setAfgehandeld] = useState<Set<number>>(new Set())
  const [afgehandeldeSubs, setAfgehandeldeSubs] = useState<Set<string>>(new Set())
  const [huidig, setHuidig] = useState<number | null>(null)

  const toggleSub = (puntId: number, subIdx: number) => {
    const key = `${puntId}-${subIdx}`
    setAfgehandeldeSubs(prev => {
      const n = new Set(prev)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }
  const [grootLettertype, setGrootLettertype] = useState(false)
  const [donkerModus, setDonkerModus] = useState(true) // standaard donker voor presentatie

  const toggleIngeklapt = (id: number) => setIngeklapt(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAfgehandeld = (id: number) => { setAfgehandeld(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }); setHuidig(id) }

  // Normaliseer arrays zodat Supabase data nooit undefined geeft
  const punten = (v.punten || []).map(p => ({ ...p, subpunten: Array.isArray(p.subpunten) ? p.subpunten : [] }))
  const actielijst = Array.isArray(v.actielijst) ? v.actielijst : []
  const kalender = Array.isArray(v.kalender) ? v.kalender : []

  // GDP kleuren
  const PAARS = '#4a1a5c'
  const PAARS_DONKER = '#2d0a40'
  const GOUD = '#a89060'
  const GOUD_LICHT = '#d4b880'

  const bg = donkerModus ? PAARS_DONKER : '#f4f6f9'
  const kaartBg = donkerModus ? '#3a1050' : 'white'
  const kaartRand = donkerModus ? '#6a2a8a' : '#dde3ed'
  const tekstKleur = donkerModus ? '#f0e8f8' : '#1a0a2e'
  const basisFs = grootLettertype ? '21px' : '17px'
  const voortgang = Math.round((afgehandeld.size / Math.max(v.punten.length, 1)) * 100)

  return (
    <div style={{ minHeight: '100vh', background: bg, transition: 'all 0.3s', color: tekstKleur }}>
      {/* Topbalk */}
      <div style={{ background: PAARS, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 50, borderBottom: `3px solid ${GOUD}`, boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }} className="no-print">
        <div style={{ background: GOUD, color: PAARS, fontWeight: '900', fontSize: '13px', padding: '3px 9px', borderRadius: '4px', letterSpacing: '1px', fontFamily: 'Arial Black, Arial' }}>GDP</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{v.titel}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{v.datum ? formatDatum(v.datum) : ''}{v.aanvang ? ` — ${v.aanvang} uur` : ''}</div>
        </div>

        {/* Voortgangsbalk */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '160px', height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${voortgang}%`, height: '100%', background: GOUD, borderRadius: '3px', transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: '12px', color: GOUD_LICHT, minWidth: '36px', fontFamily: 'Arial' }}>{voortgang}%</span>
        </div>

        {/* Knoppen */}
        <button onClick={() => setGrootLettertype(!grootLettertype)} style={pk(PAARS)} title="Lettergrootte wisselen">{grootLettertype ? 'A−' : 'A+'}</button>
        <button onClick={() => setDonkerModus(!donkerModus)} style={pk(PAARS)} title="Donker/licht">{donkerModus ? '☀️' : '🌙'}</button>
        <button onClick={() => window.print()} style={pk(PAARS)} title="Afdrukken">⎙</button>
        <button onClick={() => window.close()} style={pk(PAARS)} title="Sluiten">✕</button>
      </div>

      {/* Aanwezigen */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px 20px 0' }}>
        <div style={{ background: kaartBg, border: `1px solid ${kaartRand}`, borderRadius: '10px', padding: '12px 20px', marginBottom: '16px', fontSize: '13px', fontFamily: 'Arial', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {v.aanwezig && <span><strong style={{ color: GOUD }}>Aanwezig:</strong> {v.aanwezig}</span>}
          {v.online && <span><strong style={{ color: GOUD }}>Online:</strong> {v.online}</span>}
          {v.afwezig && <span><strong style={{ color: GOUD }}>Afwezig:</strong> {v.afwezig}</span>}
        </div>

        {/* Agendapunten */}
        {punten.map((punt) => {
          const isDone = afgehandeld.has(punt.id)
          const isActive = huidig === punt.id && !isDone
          const isKlapt = ingeklapt.has(punt.id)
          const puntUrl = (punt as { url?: string }).url

          return (
            <div key={punt.id} style={{
              background: isDone
                ? (donkerModus ? '#0a1a0a' : '#f0faf2')
                : isActive
                  ? (donkerModus ? '#4a1a6a' : '#fff8e8')
                  : kaartBg,
              border: `2px solid ${isActive ? GOUD : isDone ? (donkerModus ? '#1a4a1a' : '#a8d8b5') : kaartRand}`,
              borderRadius: '10px', marginBottom: '8px', overflow: 'hidden',
              opacity: isDone ? 0.5 : 1,
              transition: 'all 0.2s',
              boxShadow: isActive ? `0 0 0 3px ${GOUD}40` : 'none',
            }}>
              {/* Punt header */}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onClick={() => setHuidig(isActive ? null : punt.id)}>
                <span style={{ fontSize: basisFs, fontWeight: '800', color: isDone ? '#6dbb80' : GOUD, minWidth: '36px', fontFamily: 'Arial' }}>
                  {isDone ? '✓' : `${punt.id}.`}
                </span>
                <div style={{ flex: 1 }}>
                  {puntUrl && !isDone ? (
                    <a href={puntUrl} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: basisFs, fontWeight: isActive ? '700' : '500', fontFamily: 'Arial', color: GOUD_LICHT, textDecoration: 'underline' }}>
                      {punt.titel} ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: basisFs, fontWeight: isActive ? '700' : '500', textDecoration: isDone ? 'line-through' : 'none', fontFamily: 'Arial', color: isDone ? '#6dbb80' : tekstKleur }}>
                      {punt.titel}
                    </span>
                  )}
                  {punt.toelichting && (
                    <span style={{ fontSize: '13px', color: donkerModus ? 'rgba(255,255,255,0.4)' : '#888', fontStyle: 'italic', fontFamily: 'Arial', marginLeft: '8px' }}>
                      {punt.toelichting}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                  {punt.subpunten.length > 0 && (
                    <button onClick={() => toggleIngeklapt(punt.id)} style={pk2(donkerModus)}>
                      {isKlapt ? '▸' : '▾'}
                    </button>
                  )}
                  <button onClick={() => toggleAfgehandeld(punt.id)}
                    style={{ ...pk2(donkerModus), background: isDone ? '#6dbb80' : undefined, color: isDone ? 'white' : undefined }}>
                    {isDone ? '↩' : '✓'}
                  </button>
                </div>
              </div>

              {/* Subpunten */}
              {!isKlapt && punt.subpunten.length > 0 && (
                <div style={{ borderTop: `1px solid ${kaartRand}` }}>
                  {punt.subpunten.map((sub, si) => {
                    const isPA = punt.puntType === 'politieke_avond'
                    const isRV = punt.puntType === 'raadsvergadering'
                    const isMotie = sub.subtype === 'motie'
                    const isAmendement = sub.subtype === 'amendement'
                    return (
                      <div key={sub.id || si} onClick={() => toggleSub(punt.id, si)} style={{ padding: '9px 16px 9px 60px', borderBottom: si < punt.subpunten.length - 1 ? `1px solid ${donkerModus ? 'rgba(255,255,255,0.06)' : '#f0ede8'}` : 'none', display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: (isMotie || isAmendement) ? '80px' : '60px', background: afgehandeldeSubs.has(`${punt.id}-${si}`) ? (donkerModus ? 'rgba(0,50,0,0.3)' : 'rgba(0,100,0,0.06)') : (isMotie || isAmendement) ? (donkerModus ? 'rgba(0,0,0,0.15)' : 'rgba(90,26,138,0.04)') : 'transparent', cursor: 'pointer', opacity: afgehandeldeSubs.has(`${punt.id}-${si}`) ? 0.6 : 1, transition: 'all 0.2s' }}>
                        {/* PA: toon starttijd */}
                        {isPA && sub.starttijd && (
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: GOUD, fontFamily: 'Arial', flexShrink: 0, minWidth: '50px' }}>
                            {sub.starttijd}
                          </span>
                        )}
                        {/* RV: toon rvNummer badge */}
                        {isRV && (isMotie || isAmendement) && (
                          <span style={{ fontSize: '10px', background: isMotie ? '#fff0e8' : '#f0e8ff', color: isMotie ? '#8a4000' : '#5a1a8a', border: `1px solid ${isMotie ? '#e8a060' : '#c0a0d8'}`, padding: '1px 5px', borderRadius: '3px', flexShrink: 0, fontFamily: 'Arial' }}>
                            {isMotie ? 'M' : 'A'}
                          </span>
                        )}
                        {isRV && sub.rvNummer && (
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: GOUD_LICHT, fontFamily: 'Arial', flexShrink: 0, minWidth: '60px' }}>
                            {sub.rvNummer}
                          </span>
                        )}
                        {!isRV && !isPA && (
                          <span style={{ fontSize: '13px', color: donkerModus ? 'rgba(255,255,255,0.35)' : '#999', fontStyle: 'italic', minWidth: '18px', fontFamily: 'Arial' }}>
                            {String.fromCharCode(97 + si)}.
                          </span>
                        )}
                        {/* Vinkje voor afgehandelde subs */}
                        <span style={{ fontSize: '14px', flexShrink: 0, color: afgehandeldeSubs.has(`${punt.id}-${si}`) ? '#6dbb80' : 'transparent' }}>✓</span>
                        {sub.url ? (
                          <a href={sub.url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ fontSize: `calc(${basisFs} - 3px)`, color: donkerModus ? GOUD_LICHT : '#5a1a8a', fontFamily: 'Arial', flex: 1, textDecoration: afgehandeldeSubs.has(`${punt.id}-${si}`) ? 'line-through' : 'underline' }}>
                            {sub.titel}
                          </a>
                        ) : (
                          <span style={{ fontSize: `calc(${basisFs} - 3px)`, fontFamily: 'Arial', flex: 1, color: donkerModus ? '#e0d0f0' : '#1a0a2e', textDecoration: afgehandeldeSubs.has(`${punt.id}-${si}`) ? 'line-through' : 'none' }}>
                            {sub.titel}
                          </span>
                        )}
                        {/* PA: toon woordvoerder */}
                        {isPA && sub.woordvoerder && (
                          <span style={{ fontSize: '12px', color: donkerModus ? 'rgba(255,255,255,0.5)' : '#888', fontStyle: 'italic', fontFamily: 'Arial', flexShrink: 0 }}>
                            {sub.woordvoerder}
                          </span>
                        )}
                        {sub.afgedaan && (
                          <span style={{ fontSize: '10px', background: '#d4f5dd', color: '#1a5c2a', border: '1px solid #6dbb80', padding: '1px 5px', borderRadius: '3px' }}>
                            Afgedaan
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        <div style={{ height: '40px' }} />

        {/* Actielijst */}
        {actielijst.length > 0 && (
          <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 20px 20px' }}>
            <div style={{ borderTop: `1px solid ${kaartRand}`, paddingTop: '20px', marginTop: '8px' }}>
              <h2 style={{ fontSize: '15px', color: GOUD, fontFamily: 'Arial', fontWeight: 'bold', marginBottom: '12px' }}>
                ✓ Actielijst
              </h2>
              {actielijst.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: `1px solid ${donkerModus ? 'rgba(255,255,255,0.06)' : '#f0ede8'}`, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{a.afgedaan ? '✅' : '⬜'}</span>
                  <span style={{ fontWeight: 'bold', minWidth: '100px', maxWidth: '120px', fontSize: basisFs, fontFamily: 'Arial', color: a.afgedaan ? '#6dbb80' : GOUD_LICHT, textDecoration: a.afgedaan ? 'line-through' : 'none', opacity: a.afgedaan ? 0.6 : 1, flexShrink: 0 }}>
                    {a.naam}
                  </span>
                  <span style={{ flex: 1, fontSize: `calc(${basisFs} - 2px)`, fontFamily: 'Arial', color: donkerModus ? '#e0d0f0' : '#1a0a2e', textDecoration: a.afgedaan ? 'line-through' : 'none', opacity: a.afgedaan ? 0.6 : 1 }}>
                    {a.actie}
                  </span>
                  {a.datum && <span style={{ fontSize: '12px', color: donkerModus ? 'rgba(255,255,255,0.4)' : '#888', fontFamily: 'Arial', flexShrink: 0 }}>{formatDatumNL(a.datum)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Centrale Fractiekalender */}
        <CentraleKalenderSectie donkerModus={donkerModus} kaartRand={kaartRand} basisFs={basisFs} GOUD={GOUD} GOUD_LICHT={GOUD_LICHT} />
      </div>
    </div>
  )
}

function CentraleKalenderSectie({ donkerModus, kaartRand, basisFs, GOUD, GOUD_LICHT }: {
  donkerModus: boolean; kaartRand: string; basisFs: string; GOUD: string; GOUD_LICHT: string
}) {
  const [items, setItems] = useState<{ id: string; datum: string; omschrijving: string; locatie: string; personen: string }[]>([])

  useEffect(() => {
    import('@/lib/kalender').then(({ haalKalenderItems }) => {
      haalKalenderItems(true).then(data => setItems(data)).catch(() => {})
    })
  }, [])

  if (items.length === 0) return null

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 20px 40px' }}>
      <div style={{ borderTop: `1px solid ${kaartRand}`, paddingTop: '20px' }}>
        <h2 style={{ fontSize: '15px', color: GOUD, fontFamily: 'Arial', fontWeight: 'bold', marginBottom: '12px' }}>
          📅 Fractiekalender — aankomende evenementen
        </h2>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: '16px', padding: '6px 0', borderBottom: `1px solid ${donkerModus ? 'rgba(255,255,255,0.06)' : '#f0ede8'}`, alignItems: 'baseline' }}>
            <span style={{ minWidth: '80px', fontFamily: 'Arial', fontWeight: 'bold', color: GOUD_LICHT, fontSize: '13px', flexShrink: 0 }}>
              {item.datum ? new Date(item.datum + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}
            </span>
            <span style={{ flex: 1, fontSize: `calc(${basisFs} - 2px)`, fontFamily: 'Arial', color: donkerModus ? '#e0d0f0' : '#1a0a2e' }}>
              {item.omschrijving}
            </span>
            {item.locatie && <span style={{ fontSize: '12px', color: donkerModus ? 'rgba(255,255,255,0.4)' : '#888', fontFamily: 'Arial', flexShrink: 0 }}>📍 {item.locatie}</span>}
            {item.personen && <span style={{ fontSize: '12px', color: donkerModus ? 'rgba(255,255,255,0.4)' : '#888', fontStyle: 'italic', fontFamily: 'Arial', flexShrink: 0 }}>{item.personen}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

const pk = (bg: string): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
  color: 'white', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer',
  fontSize: '13px', fontFamily: 'Arial',
})

const pk2 = (donker: boolean): React.CSSProperties => ({
  padding: '5px 11px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
  border: `1px solid ${donker ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
  background: donker ? 'rgba(255,255,255,0.08)' : '#f0f0f0',
  color: donker ? 'white' : '#333', fontFamily: 'Arial',
})
