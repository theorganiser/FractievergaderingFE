'use client'

import { useState, useEffect } from 'react'
import { Vergadering, Agendapunt } from '@/lib/types'
import { formatDatum, formatDatumNL } from '@/lib/datum'

function normaliseerPunt(punt: Agendapunt): Agendapunt {
  return { ...punt, subpunten: Array.isArray(punt.subpunten) ? punt.subpunten : [] }
}

export default function Leesweergave({ vergadering: v, toonPrintKnop = false }: {
  vergadering: Vergadering; toonPrintKnop?: boolean
}) {
  const punten = Array.isArray(v.punten) ? v.punten.map(normaliseerPunt) : []

  return (
    <div className="leesweergave-container" style={{ fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
      {toonPrintKnop && (
        <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => window.print()}
            style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial' }}>
            ⎙ Afdrukken / PDF
          </button>
        </div>
      )}

      {/* Header */}
      <div className="print-header" style={{ marginBottom: '20px', paddingBottom: '14px', borderBottom: '2px solid var(--blauw)' }}>
        <div className="print-only" style={{ display: 'none', marginBottom: '12px' }}>
          <span style={{ background: '#4a1a5c', color: '#a89060', fontWeight: '900', fontSize: '14px', padding: '3px 10px', borderRadius: '4px', fontFamily: 'Arial Black, Arial' }}>GDP</span>
          <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px', fontFamily: 'Arial' }}>Goois Democratisch Platform</span>
        </div>
        <h1 style={{ fontSize: '20px', color: 'var(--blauw)', fontWeight: 'normal', marginBottom: '12px' }}>{v.titel || 'Vergadering'}</h1>
        <MetaRij label="Datum:" waarde={v.datum ? formatDatum(v.datum) : '—'} />
        <MetaRij label="Aanvang:" waarde={v.aanvang ? v.aanvang + ' uur' : '—'} />
        <MetaRij label="Locatie:" waarde={v.locatie || '—'} />
        {v.aanwezig && <MetaRij label="Aanwezig:" waarde={v.aanwezig} />}
        {v.online && <MetaRij label="Online:" waarde={v.online} />}
        {v.afwezig && <MetaRij label="Afwezig:" waarde={v.afwezig} />}
      </div>

      <div style={{ fontSize: '15px', color: 'var(--blauw)', margin: '16px 0 12px', fontWeight: 'bold' }}>▶ Agenda</div>

      {punten.map((punt) => {
        const isPA = punt.puntType === 'politieke_avond'
        const isRV = punt.puntType === 'raadsvergadering'

        return (
          <div key={punt.id} style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', gap: '14px', padding: '5px 0' }}>
              <span style={{ minWidth: '28px', fontSize: '14px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>{punt.id}.</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '15px' }}>
                  {punt.url ? (
                    <a href={punt.url} target="_blank" rel="noopener noreferrer"
                      style={{ color: isPA ? '#1a5c8a' : isRV ? '#5a1a8a' : 'var(--blauw)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>
                      {punt.titel}
                    </a>
                  ) : (
                    <span style={{ color: isPA ? '#1a5c8a' : isRV ? '#5a1a8a' : 'inherit' }}>{punt.titel}</span>
                  )}
                  {punt.toelichting && !isPA && !isRV && (
                    <span style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontStyle: 'italic', marginLeft: '8px' }}>{punt.toelichting}</span>
                  )}
                </span>

                {/* Politieke Avond subpunten */}
                {isPA && punt.subpunten.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {punt.subpunten.map((sub, si) => (
                      <div key={si} style={{ display: 'flex', gap: '10px', padding: '3px 0 3px 14px', alignItems: 'baseline' }}>
                        <span style={{ minWidth: '20px', fontSize: '13px', color: 'var(--tekst-zacht)', fontStyle: 'italic', fontFamily: 'Arial', flexShrink: 0 }}>{String.fromCharCode(97 + si)}.</span>
                        {sub.starttijd && <span style={{ fontSize: '13px', fontFamily: 'Arial', color: '#1a5c8a', fontWeight: 'bold', flexShrink: 0 }}>{sub.starttijd}</span>}
                        <span style={{ fontSize: '14px', flex: 1 }}>{sub.titel}</span>
                        {sub.woordvoerder && <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontStyle: 'italic', fontFamily: 'Arial', flexShrink: 0 }}>({sub.woordvoerder})</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Raadsvergadering subpunten */}
                {isRV && punt.subpunten.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {punt.subpunten.map((sub, si) => {
                      const isMotie = sub.subtype === 'motie'
                      const isAmendement = sub.subtype === 'amendement'
                      const isSubtype = isMotie || isAmendement
                      return (
                        <div key={si} style={{ display: 'flex', gap: '10px', padding: '3px 0 3px 14px', alignItems: 'baseline', paddingLeft: isSubtype ? '32px' : '14px' }}>
                          {isSubtype && (
                            <span style={{ fontSize: '10px', background: isMotie ? '#fff0e8' : '#f0e8ff', color: isMotie ? '#8a4000' : '#5a1a8a', border: `1px solid ${isMotie ? '#e8a060' : '#c0a0d8'}`, padding: '1px 5px', borderRadius: '3px', flexShrink: 0, fontFamily: 'Arial' }}>
                              {isMotie ? 'Motie' : 'Amendement'}
                            </span>
                          )}
                          {sub.rvNummer && <span style={{ fontSize: '13px', fontFamily: 'Arial', color: '#5a1a8a', fontWeight: 'bold', flexShrink: 0, minWidth: '60px' }}>{sub.rvNummer}</span>}
                          <span style={{ fontSize: '14px', flex: 1 }}>{sub.titel}</span>
                          {sub.inStemlijst && <span style={{ fontSize: '10px', background: '#e8f5ed', color: '#2d7a4f', border: '1px solid #a8d8b5', padding: '1px 5px', borderRadius: '3px', fontFamily: 'Arial', flexShrink: 0 }}>Stemlijst</span>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Normale subpunten */}
                {!isPA && !isRV && punt.subpunten.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {punt.subpunten.map((sub, si) => (
                      <div key={sub.id || si} style={{ display: 'flex', gap: '10px', padding: '3px 0 3px 14px' }}>
                        <span style={{ minWidth: '20px', fontSize: '13px', color: 'var(--tekst-zacht)', fontStyle: 'italic', fontFamily: 'Arial', flexShrink: 0 }}>{String.fromCharCode(97 + si)}.</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                            {sub.url ? (
                              <a href={sub.url} target="_blank" rel="noopener noreferrer"
                                style={{ color: '#6a2a8a', textDecoration: 'none', fontSize: '14px', borderBottom: '1px dotted currentColor' }}>
                                {sub.titel}
                              </a>
                            ) : <span style={{ fontSize: '14px' }}>{sub.titel}</span>}
                            {sub.afgedaan && (
                              <span style={{ fontSize: '10px', background: '#e8f5ed', color: '#2d7a4f', border: '1px solid #a8d8b5', padding: '1px 6px', borderRadius: '3px', fontFamily: 'Arial' }}>Afgedaan</span>
                            )}
                          </div>
                          {(sub.toelichting || sub.publicatiedatum) && (
                            <div style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontStyle: 'italic', marginTop: '1px', fontFamily: 'Arial' }}>
                              {sub.publicatiedatum && formatDatumNL(sub.publicatiedatum)}
                              {sub.publicatiedatum && sub.toelichting && ' — '}
                              {sub.toelichting}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid var(--rand)', fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
        Goois Democratisch Platform — Gooise Meren
      </div>
    </div>
  )
}

function MetaRij({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div style={{ fontSize: '14px', display: 'flex', gap: '8px', marginBottom: '3px' }}>
      <span style={{ color: 'var(--tekst-zacht)', minWidth: '90px', fontFamily: 'Arial', fontSize: '13px' }}>{label}</span>
      <span>{waarde}</span>
    </div>
  )
}

export function LeesweergaveVolledig({ vergadering: v, toonPrintKnop }: {
  vergadering: Vergadering; toonPrintKnop?: boolean
}) {
  const actielijst = Array.isArray(v.actielijst) ? v.actielijst : []
  const kalender = Array.isArray(v.kalender) ? v.kalender : []
  const [centraleKalender, setCentraleKalender] = useState<{ id: string; datum: string; omschrijving: string; locatie: string; personen: string }[]>([])

  useEffect(() => {
    // Haal toekomstige items op uit de centrale fractiekalender
    import('@/lib/kalender').then(({ haalKalenderItems }) => {
      haalKalenderItems(true).then(items => setCentraleKalender(items)).catch(() => {})
    })
  }, [])

  return (
    <div>
      <Leesweergave vergadering={v} toonPrintKnop={toonPrintKnop} />

      {actielijst.length > 0 && (
        <div style={{ marginTop: '32px', borderTop: '2px solid var(--blauw)', paddingTop: '20px' }}>
          <h2 style={{ fontSize: '15px', color: 'var(--blauw)', marginBottom: '10px', fontWeight: 'bold', fontFamily: 'Arial' }}>✓ Actielijst</h2>
          {actielijst.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #f0ede8', fontSize: '14px', alignItems: 'flex-start' }}>
              <span style={{ minWidth: '20px', flexShrink: 0, marginTop: '2px' }}>{a.afgedaan ? '✅' : '⬜'}</span>
              <span style={{ fontWeight: 'bold', minWidth: '100px', maxWidth: '120px', textDecoration: a.afgedaan ? 'line-through' : 'none', opacity: a.afgedaan ? 0.5 : 1, fontFamily: 'Arial', fontSize: '13px', flexShrink: 0 }}>{a.naam}</span>
              <span style={{ flex: 1, textDecoration: a.afgedaan ? 'line-through' : 'none', opacity: a.afgedaan ? 0.5 : 1 }}>{a.actie}</span>
              {a.datum && <span style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', flexShrink: 0 }}>{formatDatumNL(a.datum)}</span>}
            </div>
          ))}
        </div>
      )}

      {centraleKalender.length > 0 && (
        <div style={{ marginTop: '28px', borderTop: '1px solid var(--rand)', paddingTop: '16px' }}>
          <h2 style={{ fontSize: '15px', color: 'var(--blauw)', marginBottom: '10px', fontWeight: 'bold', fontFamily: 'Arial' }}>📅 Fractiekalender — aankomende evenementen</h2>
          {centraleKalender.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '5px 0', fontSize: '14px', alignItems: 'baseline', borderBottom: '1px solid #f5f0f8' }}>
              <span style={{ minWidth: '75px', fontFamily: 'Arial', fontWeight: 'bold', color: 'var(--blauw)', fontSize: '13px', flexShrink: 0 }}>
                {item.datum ? new Date(item.datum + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}
              </span>
              <span style={{ flex: 1 }}>{item.omschrijving}</span>
              {item.locatie && <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', flexShrink: 0 }}>📍 {item.locatie}</span>}
              {item.personen && <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontStyle: 'italic', fontFamily: 'Arial', flexShrink: 0 }}>{item.personen}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
