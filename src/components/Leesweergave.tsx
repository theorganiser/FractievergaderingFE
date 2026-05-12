'use client'

import { Vergadering } from '@/lib/types'
import { formatDatum } from '@/lib/datum'

interface LeesweergaveProps {
  vergadering: Vergadering
  toonPrintKnop?: boolean
}

export default function Leesweergave({ vergadering: v, toonPrintKnop = false }: LeesweergaveProps) {
  return (
    <div style={{ fontFamily: 'Georgia, serif', lineHeight: 1.7 }}>
      {toonPrintKnop && (
        <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => window.print()}
            style={{
              background: 'var(--blauw)',
              color: 'white',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            ⎙ Afdrukken / PDF
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid var(--blauw)',
      }}>
        <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: 'normal', marginBottom: '14px' }}>
          {v.titel || 'Vergadering'}
        </h1>
        <MetaRij label="Datum:" waarde={v.datum ? formatDatum(v.datum) : '—'} />
        <MetaRij label="Aanvang:" waarde={v.aanvang ? v.aanvang + ' uur' : '—'} />
        <MetaRij label="Locatie:" waarde={v.locatie || '—'} />
        {v.aanwezig && <MetaRij label="Aanwezig:" waarde={v.aanwezig} />}
        {v.online && <MetaRij label="Online:" waarde={v.online} />}
        {v.afwezig && <MetaRij label="Afwezig:" waarde={v.afwezig} />}
      </div>

      {/* Agenda titel */}
      <div style={{
        fontSize: '16px',
        color: 'var(--blauw)',
        margin: '20px 0 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 'bold',
      }}>
        ▶ Agenda
      </div>

      {/* Agendapunten */}
      {v.punten.map((punt) => (
        <div key={punt.id}>
          <div style={{ display: 'flex', gap: '14px', padding: '6px 0' }}>
            <span style={{ minWidth: '28px', fontSize: '14px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif' }}>
              {punt.id}.
            </span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '15px' }}>
                {punt.url ? (
                  <a href={punt.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blauw)', textDecoration: 'none', borderBottom: '1px solid currentColor' }}>
                    {punt.titel}
                  </a>
                ) : punt.titel}
                {punt.toelichting && (
                  <span style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontStyle: 'italic', marginLeft: '6px' }}>
                    {punt.toelichting}
                  </span>
                )}
              </span>
              {punt.subpunten.map((sub, si) => (
                <div key={sub.id} style={{ display: 'flex', gap: '12px', padding: '4px 0 4px 16px' }}>
                  <span style={{ minWidth: '22px', fontSize: '13px', color: 'var(--tekst-zacht)', fontStyle: 'italic', fontFamily: 'Arial, sans-serif' }}>
                    {String.fromCharCode(97 + si)}.
                  </span>
                  <div>
                    {sub.url ? (
                      <a
                        href={sub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--blauw-mid)', textDecoration: 'none', fontSize: '14px' }}
                      >
                        {sub.titel}
                      </a>
                    ) : (
                      <span style={{ fontSize: '14px' }}>{sub.titel}</span>
                    )}
                    {sub.afgedaan && (
                      <span style={{
                        fontSize: '10px',
                        background: '#e8f5ed',
                        color: '#2d7a4f',
                        border: '1px solid #a8d8b5',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontFamily: 'Arial, sans-serif',
                        marginLeft: '8px',
                        verticalAlign: 'middle',
                      }}>
                        Afgedaan
                      </span>
                    )}
                    {sub.toelichting && (
                      <div style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontStyle: 'italic', marginTop: '2px' }}>
                        {sub.toelichting}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        paddingTop: '16px',
        borderTop: '1px solid var(--rand)',
        fontSize: '11px',
        color: 'var(--tekst-zacht)',
        fontFamily: 'Arial, sans-serif',
      }}>
        Gemeente Gooise Meren — bestuur.gooisemeren.nl
      </div>
    </div>
  )
}

function MetaRij({ label, waarde }: { label: string; waarde: string }) {
  return (
    <div style={{ fontSize: '14px', display: 'flex', gap: '8px', marginBottom: '4px' }}>
      <span style={{ color: 'var(--tekst-zacht)', minWidth: '90px', fontFamily: 'Arial, sans-serif', fontSize: '13px' }}>
        {label}
      </span>
      <span>{waarde}</span>
    </div>
  )
}

// Exporteer ook een versie met acties en kalender voor de volledige leesweergave
export function LeesweergaveVolledig({ vergadering: v, toonPrintKnop }: { vergadering: import('@/lib/types').Vergadering, toonPrintKnop?: boolean }) {
  return (
    <div>
      <Leesweergave vergadering={v} toonPrintKnop={toonPrintKnop} />
      
      {/* Actielijst */}
      {v.actielijst && v.actielijst.length > 0 && (
        <div style={{ marginTop: '32px', borderTop: '2px solid var(--blauw)', paddingTop: '20px' }}>
          <h2 style={{ fontSize: '16px', color: 'var(--blauw)', marginBottom: '12px', fontWeight: 'bold' }}>✓ Actielijst</h2>
          {v.actielijst.map(a => (
            <div key={a.id} style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #f0ede8', fontSize: '14px' }}>
              <span style={{ minWidth: '16px' }}>{a.afgedaan ? '✅' : '⬜'}</span>
              <span style={{ fontWeight: 'bold', minWidth: '100px', textDecoration: a.afgedaan ? 'line-through' : 'none', opacity: a.afgedaan ? 0.5 : 1 }}>{a.naam}</span>
              <span style={{ flex: 1, textDecoration: a.afgedaan ? 'line-through' : 'none', opacity: a.afgedaan ? 0.5 : 1 }}>{a.actie}</span>
              {a.datum && <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>{a.datum}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Kalender */}
      {v.kalender && v.kalender.length > 0 && (
        <div style={{ marginTop: '28px', borderTop: '1px solid var(--rand)', paddingTop: '16px' }}>
          <h2 style={{ fontSize: '16px', color: 'var(--blauw)', marginBottom: '12px', fontWeight: 'bold' }}>📅 Algemene agendapunten</h2>
          {[...v.kalender].sort((a, b) => a.datum.localeCompare(b.datum)).map(item => (
            <div key={item.id} style={{ display: 'flex', gap: '16px', padding: '5px 0', fontSize: '14px' }}>
              <span style={{ minWidth: '80px', fontFamily: 'Arial', fontWeight: 'bold', color: 'var(--blauw)', fontSize: '13px' }}>
                {item.datum ? new Date(item.datum + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}
              </span>
              <span style={{ flex: 1 }}>{item.omschrijving}</span>
              {item.personen && <span style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontStyle: 'italic' }}>{item.personen}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
