'use client'

import { useState, useEffect } from 'react'
import { Vergadering, Agendapunt } from '@/lib/types'
import { formatDatum, formatDatumNL } from '@/lib/datum'
import { RegelMetNotitie } from './NotitiesSectie'

function normaliseerPunt(punt: Agendapunt): Agendapunt {
  return { ...punt, subpunten: Array.isArray(punt.subpunten) ? punt.subpunten : [] }
}

export default function Leesweergave({ vergadering: v, toonPrintKnop = false, naam = '', onNotitieToevoegen, onVrijPuntToevoegen, onBijlageToevoegen, onBijlageVerwijderen }: {
  vergadering: Vergadering; toonPrintKnop?: boolean; naam?: string
  onNotitieToevoegen?: (puntId: number, subIndex: number | null, tekst: string) => void
  onVrijPuntToevoegen?: (tekst: string) => void
  onBijlageToevoegen?: (puntId: number, subIndex: number | null, bijlage: { naam: string; pad: string; type: string; grootte: number; uploader: string }) => void
  onBijlageVerwijderen?: (puntId: number, subIndex: number | null, bijlageId: string) => void
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
        const isTerugkoppeling = punt.titel.toLowerCase().includes('terugkoppeling')

        return (
          <div key={punt.id} style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', gap: '14px', padding: '5px 0' }}>
              <span style={{ minWidth: '28px', fontSize: '14px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>{punt.id}.</span>
              <div style={{ flex: 1 }}>
                <RegelMetNotitie rowStyle={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}
                  notities={punt.notities} naam={naam}
                  onToevoegen={onNotitieToevoegen ? (tekst) => onNotitieToevoegen(punt.id, null, tekst) : undefined}
                  bijlagen={punt.bijlagen} vergaderingId={v.id}
                  onBijlageToevoegen={onBijlageToevoegen ? (bijlage) => onBijlageToevoegen(punt.id, null, bijlage) : undefined}
                  onBijlageVerwijderen={onBijlageVerwijderen ? (bijlageId) => onBijlageVerwijderen(punt.id, null, bijlageId) : undefined}>
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
                </RegelMetNotitie>

                {/* Politieke Avond subpunten */}
                {isPA && punt.subpunten.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {punt.subpunten.map((sub, si) => (
                      <RegelMetNotitie key={si}
                        rowStyle={{ display: 'flex', gap: '10px', padding: '3px 0 3px 14px', alignItems: 'baseline' }}
                        notities={sub.notities} naam={naam}
                        onToevoegen={onNotitieToevoegen ? (tekst) => onNotitieToevoegen(punt.id, si, tekst) : undefined}
                        bijlagen={sub.bijlagen} vergaderingId={v.id}
                        onBijlageToevoegen={onBijlageToevoegen ? (bijlage) => onBijlageToevoegen(punt.id, si, bijlage) : undefined}
                        onBijlageVerwijderen={onBijlageVerwijderen ? (bijlageId) => onBijlageVerwijderen(punt.id, si, bijlageId) : undefined}>
                        <span style={{ minWidth: '20px', fontSize: '13px', color: 'var(--tekst-zacht)', fontStyle: 'italic', fontFamily: 'Arial', flexShrink: 0 }}>{String.fromCharCode(97 + si)}.</span>
                        {sub.starttijd && <span style={{ fontSize: '13px', fontFamily: 'Arial', color: '#1a5c8a', fontWeight: 'bold', flexShrink: 0 }}>{sub.starttijd}</span>}
                        <span style={{ fontSize: '14px', flex: 1 }}>{sub.titel}</span>
                        {sub.woordvoerder && <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontStyle: 'italic', fontFamily: 'Arial', flexShrink: 0 }}>({sub.woordvoerder})</span>}
                      </RegelMetNotitie>
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
                        <RegelMetNotitie key={si}
                          rowStyle={{ display: 'flex', gap: '10px', padding: '3px 0 3px 14px', alignItems: 'baseline', paddingLeft: isSubtype ? '32px' : '14px' }}
                          notities={sub.notities} naam={naam}
                          onToevoegen={onNotitieToevoegen ? (tekst) => onNotitieToevoegen(punt.id, si, tekst) : undefined}
                          bijlagen={sub.bijlagen} vergaderingId={v.id}
                          onBijlageToevoegen={onBijlageToevoegen ? (bijlage) => onBijlageToevoegen(punt.id, si, bijlage) : undefined}
                          onBijlageVerwijderen={onBijlageVerwijderen ? (bijlageId) => onBijlageVerwijderen(punt.id, si, bijlageId) : undefined}>
                          {isSubtype && (
                            <span style={{ fontSize: '10px', background: isMotie ? '#fff0e8' : '#f0e8ff', color: isMotie ? '#8a4000' : '#5a1a8a', border: `1px solid ${isMotie ? '#e8a060' : '#c0a0d8'}`, padding: '1px 5px', borderRadius: '3px', flexShrink: 0, fontFamily: 'Arial' }}>
                              {isMotie ? 'Motie' : 'Amendement'}
                            </span>
                          )}
                          {sub.rvNummer && <span style={{ fontSize: '13px', fontFamily: 'Arial', color: '#5a1a8a', fontWeight: 'bold', flexShrink: 0, minWidth: '60px' }}>{sub.rvNummer}</span>}
                          <span style={{ fontSize: '14px', flex: 1 }}>{sub.titel}</span>
                          {sub.woordvoerder && <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontStyle: 'italic', fontFamily: 'Arial', flexShrink: 0 }}>({sub.woordvoerder})</span>}
                          {sub.inStemlijst && <span style={{ fontSize: '10px', background: '#e8f5ed', color: '#2d7a4f', border: '1px solid #a8d8b5', padding: '1px 5px', borderRadius: '3px', fontFamily: 'Arial', flexShrink: 0 }}>Stemlijst</span>}
                        </RegelMetNotitie>
                      )
                    })}
                  </div>
                )}

                {/* Normale subpunten */}
                {!isPA && !isRV && punt.subpunten.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {punt.subpunten.map((sub, si) => (
                      <RegelMetNotitie key={sub.id || si}
                        rowStyle={{ display: 'flex', gap: '10px', padding: '3px 0 3px 14px' }}
                        notities={sub.notities} naam={naam}
                        onToevoegen={onNotitieToevoegen ? (tekst) => onNotitieToevoegen(punt.id, si, tekst) : undefined}
                        bijlagen={sub.bijlagen} vergaderingId={v.id}
                        onBijlageToevoegen={onBijlageToevoegen ? (bijlage) => onBijlageToevoegen(punt.id, si, bijlage) : undefined}
                        onBijlageVerwijderen={onBijlageVerwijderen ? (bijlageId) => onBijlageVerwijderen(punt.id, si, bijlageId) : undefined}>
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
                      </RegelMetNotitie>
                    ))}
                  </div>
                )}

                {/* Vrij punt toevoegen — bijv. bij "Terugkoppeling gesprekken", open voor iedereen */}
                {isTerugkoppeling && onVrijPuntToevoegen && (
                  <TerugkoppelingInvoer onToevoegen={onVrijPuntToevoegen} />
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

export function LeesweergaveVolledig({ vergadering: v, toonPrintKnop, naam = '', onNotitieToevoegen, onVrijPuntToevoegen, onBijlageToevoegen, onBijlageVerwijderen }: {
  vergadering: Vergadering; toonPrintKnop?: boolean; naam?: string
  onNotitieToevoegen?: (puntId: number, subIndex: number | null, tekst: string) => void
  onVrijPuntToevoegen?: (tekst: string) => void
  onBijlageToevoegen?: (puntId: number, subIndex: number | null, bijlage: { naam: string; pad: string; type: string; grootte: number; uploader: string }) => void
  onBijlageVerwijderen?: (puntId: number, subIndex: number | null, bijlageId: string) => void
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
      <Leesweergave vergadering={v} toonPrintKnop={toonPrintKnop} naam={naam} onNotitieToevoegen={onNotitieToevoegen} onVrijPuntToevoegen={onVrijPuntToevoegen}
        onBijlageToevoegen={onBijlageToevoegen} onBijlageVerwijderen={onBijlageVerwijderen} />

      {actielijst.length > 0 && (
        <div style={{ marginTop: '32px', borderTop: '2px solid var(--blauw)', paddingTop: '20px' }}>
          <h2 style={{ fontSize: '15px', color: 'var(--blauw)', marginBottom: '10px', fontWeight: 'bold', fontFamily: 'Arial' }}>✓ Actielijst</h2>
          <div style={{ display: 'flex', gap: '12px', padding: '4px 0', borderBottom: '1px solid var(--rand)', fontSize: '10px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            <span style={{ minWidth: '20px', flexShrink: 0 }} />
            <span style={{ minWidth: '100px', maxWidth: '120px', flexShrink: 0 }}>Wie</span>
            <span style={{ flex: 1 }}>Wat</span>
            <span style={{ flexShrink: 0 }}>Deadline</span>
          </div>
          {actielijst.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #f0ede8', fontSize: '14px', alignItems: 'flex-start' }}>
              <span style={{ minWidth: '20px', flexShrink: 0, marginTop: '2px' }}>{a.afgedaan ? '✅' : '⬜'}</span>
              <span style={{ fontWeight: 'bold', minWidth: '100px', maxWidth: '120px', textDecoration: a.afgedaan ? 'line-through' : 'none', opacity: a.afgedaan ? 0.5 : 1, fontFamily: 'Arial', fontSize: '13px', flexShrink: 0 }}>{a.naam}</span>
              <span style={{ flex: 1, textDecoration: a.afgedaan ? 'line-through' : 'none', opacity: a.afgedaan ? 0.5 : 1 }}>{a.actie}</span>
              {a.deadline && <span style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', flexShrink: 0 }}>{formatDatumNL(a.deadline)}</span>}
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

function TerugkoppelingInvoer({ onToevoegen }: { onToevoegen: (tekst: string) => void }) {
  const [tekst, setTekst] = useState('')
  const [bezig, setBezig] = useState(false)

  const plaats = async () => {
    if (!tekst.trim()) return
    setBezig(true)
    await onToevoegen(tekst)
    setTekst('')
    setBezig(false)
  }

  return (
    <div className="no-print" style={{ display: 'flex', gap: '8px', padding: '8px 0 4px 14px', flexWrap: 'wrap' as const }}>
      <input
        value={tekst}
        onChange={e => setTekst(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && plaats()}
        placeholder="+ Terugkoppeling toevoegen (bijv. gesprek met een inwoner)..."
        style={{ flex: 1, minWidth: '220px', padding: '7px 10px', border: '1px solid var(--rand)', borderRadius: '6px', fontSize: '13px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' as const }}
      />
      <button onClick={plaats} disabled={!tekst.trim() || bezig}
        style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontFamily: 'Arial', fontWeight: '600', cursor: (!tekst.trim() || bezig) ? 'not-allowed' : 'pointer', opacity: (!tekst.trim() || bezig) ? 0.5 : 1 }}>
        {bezig ? '...' : 'Toevoegen'}
      </button>
    </div>
  )
}
