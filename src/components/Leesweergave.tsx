'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Vergadering, Agendapunt } from '@/lib/types'
import { formatDatum, formatDatumNL } from '@/lib/datum'
import { RegelMetNotitie } from './NotitiesSectie'
import { berekenTijden, isInformeer } from '@/lib/tijdsblok'

// Hoeveel dagen vooruit de fractiekalender in de leesweergave getoond wordt
export const KALENDER_VOORUIT_DAGEN = 14

function normaliseerPunt(punt: Agendapunt): Agendapunt {
  return { ...punt, subpunten: Array.isArray(punt.subpunten) ? punt.subpunten : [] }
}

type NieuweBijlage = { naam: string; pad: string; type: string; grootte: number; uploader: string }

// Acties die alleen beschikbaar zijn voor ingelogde fractieleden (niet in de beheer-preview)
export interface LeesActies {
  naam?: string
  isAdmin?: boolean
  onNotitieToevoegen?: (puntId: number, subIndex: number | null, tekst: string) => void
  onNotitieWijzig?: (puntId: number, subIndex: number | null, notitieId: string, tekst: string) => Promise<void> | void
  onNotitieVerwijder?: (puntId: number, subIndex: number | null, notitieId: string) => Promise<void> | void
  onVrijPuntToevoegen?: (puntId: number, tekst: string) => void
  onBespreekZet?: (puntId: number, subIndex: number, aan: boolean) => void
  onBijlageToevoegen?: (puntId: number, subIndex: number | null, bijlage: NieuweBijlage) => void
  onBijlageVerwijderen?: (puntId: number, subIndex: number | null, bijlageId: string) => void
}

const isTeBespreken = (punt: Agendapunt) => !isInformeer(punt) && punt.titel.toLowerCase().includes('te bespreken')
const isTerugkoppelingPunt = (punt: Agendapunt) => punt.titel.toLowerCase().includes('terugkoppeling')

export default function Leesweergave({ vergadering: v, toonPrintKnop = false, naam = '', isAdmin = false,
  onNotitieToevoegen, onNotitieWijzig, onNotitieVerwijder, onVrijPuntToevoegen, onBespreekZet, onBijlageToevoegen, onBijlageVerwijderen }: {
  vergadering: Vergadering; toonPrintKnop?: boolean
} & LeesActies) {
  const punten = Array.isArray(v.punten) ? v.punten.map(normaliseerPunt) : []
  const bespreekPunten = punten.filter(p => !isInformeer(p))
  const informeerPunten = punten.filter(p => isInformeer(p))
  const tijden = berekenTijden(punten, v.aanvang)

  // Props die elke notitie-/bijlage-regel (hoofdpunt of subpunt) nodig heeft
  const regelProps = (punt: Agendapunt, si: number | null) => {
    const doel = si === null ? punt : punt.subpunten[si]
    return {
      naam, isAdmin, vergaderingId: v.id,
      notities: doel?.notities, bijlagen: doel?.bijlagen,
      onToevoegen: onNotitieToevoegen ? (tekst: string) => onNotitieToevoegen(punt.id, si, tekst) : undefined,
      onNotitieWijzig: onNotitieWijzig ? (id: string, tekst: string) => onNotitieWijzig(punt.id, si, id, tekst) : undefined,
      onNotitieVerwijder: onNotitieVerwijder ? (id: string) => onNotitieVerwijder(punt.id, si, id) : undefined,
      onBijlageToevoegen: onBijlageToevoegen ? (b: NieuweBijlage) => onBijlageToevoegen(punt.id, si, b) : undefined,
      onBijlageVerwijderen: onBijlageVerwijderen ? (id: string) => onBijlageVerwijderen(punt.id, si, id) : undefined,
    }
  }

  const renderPunt = (punt: Agendapunt) => {
    const isPA = punt.puntType === 'politieke_avond'
    const isRV = punt.puntType === 'raadsvergadering'
    const informeer = isInformeer(punt)
    const tijd = tijden.perPunt[punt.id]
    const toonInvoer = !!onVrijPuntToevoegen && (isTerugkoppelingPunt(punt) || isTeBespreken(punt) || (informeer && !punt.apiType))

    return (
      <div key={punt.id} style={{ marginBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '14px', padding: '5px 0' }}>
          <span style={{ minWidth: '28px', fontSize: '14px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>{punt.id}.</span>
          <div style={{ flex: 1 }}>
            <RegelMetNotitie rowStyle={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}
              {...regelProps(punt, null)}>
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
              {tijd && tijd.minuten > 0 && (
                <span title="Tijdsblok" style={{ fontSize: '11px', fontFamily: 'Arial', color: '#1a5c8a', background: '#eaf3fa', border: '1px solid #bcd6ea', padding: '1px 7px', borderRadius: '9px', flexShrink: 0 }}>
                  ⏱ {tijd.start ? `${tijd.start} · ` : ''}{tijd.minuten} min
                </span>
              )}
            </RegelMetNotitie>

            {/* Politieke Avond subpunten */}
            {isPA && punt.subpunten.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                {punt.subpunten.map((sub, si) => (
                  <RegelMetNotitie key={si}
                    rowStyle={{ display: 'flex', gap: '10px', padding: '3px 0 3px 14px', alignItems: 'baseline' }}
                    {...regelProps(punt, si)}>
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
                      {...regelProps(punt, si)}>
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
                    {...regelProps(punt, si)}>
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
                        {informeer && sub.bespreekKey && !sub.bespreekKopie && (
                          <span style={{ fontSize: '10px', background: '#fff3cc', color: '#8a6800', border: '1px solid #e8c860', padding: '1px 6px', borderRadius: '3px', fontFamily: 'Arial' }}>
                            🗣 Wordt besproken{sub.bespreekDoor ? ` (${sub.bespreekDoor})` : ''}
                          </span>
                        )}
                        {informeer && onBespreekZet && !sub.bespreekKopie && (
                          <button className="no-print" onClick={() => onBespreekZet(punt.id, si, !sub.bespreekKey)}
                            title={sub.bespreekKey ? 'Haal dit punt weer uit Te bespreken' : 'Zet dit punt ook onder Te bespreken'}
                            style={{ fontSize: '11px', fontFamily: 'Arial', background: 'white', color: sub.bespreekKey ? 'var(--tekst-zacht)' : 'var(--blauw)', border: '1px solid var(--rand)', padding: '1px 8px', borderRadius: '9px', cursor: 'pointer' }}>
                            {sub.bespreekKey ? 'Toch niet bespreken' : 'Wil ik bespreken'}
                          </button>
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

            {/* Vrij punt toevoegen: Terugkoppeling gesprekken, Te bespreken en de handmatige informeerpunten (niet de automatische Raadsmededelingen/Vragen) — open voor iedereen */}
            {toonInvoer && onVrijPuntToevoegen && (
              <PuntInvoer
                placeholder={informeer
                  ? '+ Punt toevoegen (meer uitleg kan daarna via de + achter het punt)...'
                  : isTeBespreken(punt)
                    ? '+ Bespreekpunt toevoegen...'
                    : '+ Terugkoppeling toevoegen (bijv. gesprek met een inwoner)...'}
                onToevoegen={(tekst) => onVrijPuntToevoegen(punt.id, tekst)} />
            )}
          </div>
        </div>
      </div>
    )
  }

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

      {bespreekPunten.map(renderPunt)}

      {tijden.totaalMinuten > 0 && (
        <div style={{ margin: '6px 0 4px 42px', fontSize: '12px', fontFamily: 'Arial', color: '#1a5c8a' }}>
          ⏱ Geplande duur: {tijden.totaalMinuten} min{tijden.einde ? ` · verwacht einde ${tijden.einde} uur` : ''}
        </div>
      )}

      {informeerPunten.length > 0 && (
        <>
          <div style={{ fontSize: '15px', color: 'var(--blauw)', margin: '26px 0 4px', fontWeight: 'bold', paddingTop: '14px', borderTop: '1px solid var(--rand)' }}>
            ℹ️ Ter informatie
          </div>
          <div style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic', marginBottom: '8px' }}>
            Niet besproken tenzij iemand dat wil — klik bij een punt op "Wil ik bespreken" om het onder Te bespreken te zetten.
          </div>
          {informeerPunten.map(renderPunt)}
        </>
      )}

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

export function LeesweergaveVolledig({ vergadering: v, toonPrintKnop, ...acties }: {
  vergadering: Vergadering; toonPrintKnop?: boolean
} & LeesActies) {
  const actielijst = Array.isArray(v.actielijst) ? v.actielijst : []
  const kalender = Array.isArray(v.kalender) ? v.kalender : []
  const [centraleKalender, setCentraleKalender] = useState<{ id: string; datum: string; omschrijving: string; locatie: string; personen: string }[]>([])
  const [kalenderGeladen, setKalenderGeladen] = useState(false)

  useEffect(() => {
    // Alleen de komende 2 weken; de rest staat op de kalenderpagina
    import('@/lib/kalender').then(({ haalKalenderItems }) => {
      haalKalenderItems(true, KALENDER_VOORUIT_DAGEN)
        .then(items => { setCentraleKalender(items); setKalenderGeladen(true) })
        .catch(() => {})
    })
  }, [])

  return (
    <div>
      <Leesweergave vergadering={v} toonPrintKnop={toonPrintKnop} {...acties} />

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

      {kalenderGeladen && (
        <div style={{ marginTop: '28px', borderTop: '1px solid var(--rand)', paddingTop: '16px' }}>
          <h2 style={{ fontSize: '15px', color: 'var(--blauw)', marginBottom: '10px', fontWeight: 'bold', fontFamily: 'Arial' }}>📅 Fractiekalender — komende {KALENDER_VOORUIT_DAGEN / 7} weken</h2>
          {centraleKalender.length === 0 && (
            <div style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic', padding: '4px 0' }}>
              Geen evenementen in de komende {KALENDER_VOORUIT_DAGEN / 7} weken.
            </div>
          )}
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
          <div className="no-print" style={{ marginTop: '10px' }}>
            <Link href="/kalender" style={{ fontSize: '13px', fontFamily: 'Arial', color: 'var(--blauw)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>
              Bekijk de volledige fractiekalender →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function PuntInvoer({ onToevoegen, placeholder }: { onToevoegen: (tekst: string) => void; placeholder: string }) {
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
        placeholder={placeholder}
        style={{ flex: 1, minWidth: '220px', padding: '7px 10px', border: '1px solid var(--rand)', borderRadius: '6px', fontSize: '13px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' as const }}
      />
      <button onClick={plaats} disabled={!tekst.trim() || bezig}
        style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontFamily: 'Arial', fontWeight: '600', cursor: (!tekst.trim() || bezig) ? 'not-allowed' : 'pointer', opacity: (!tekst.trim() || bezig) ? 0.5 : 1 }}>
        {bezig ? '...' : 'Toevoegen'}
      </button>
    </div>
  )
}
