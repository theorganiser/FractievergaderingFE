'use client'

import { useState } from 'react'
import { useKalender } from '@/hooks/useKalender'
import { CentraalKalenderItem } from '@/lib/kalender'

interface KalenderTabProps {
  onVoegToeAanAgenda: (item: CentraalKalenderItem) => void
}

export default function KalenderTab({ onVoegToeAanAgenda }: KalenderTabProps) {
  const { items, geladen } = useKalender(true) // alleen toekomst
  const [toegevoegd, setToegevoegd] = useState<Set<string>>(new Set())

  const handleToevoegen = (item: CentraalKalenderItem) => {
    onVoegToeAanAgenda(item)
    setToegevoegd(prev => new Set(prev).add(item.id))
  }

  const formatDatum = (datum: string) => {
    try {
      return new Date(datum + 'T12:00:00').toLocaleDateString('nl-NL', {
        weekday: 'short', day: 'numeric', month: 'long'
      })
    } catch { return datum }
  }

  if (!geladen) return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
      ⏳ Kalender laden...
    </div>
  )

  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
      <p>Geen aankomende evenementen in de centrale kalender.</p>
      <p style={{ marginTop: '8px', fontSize: '13px' }}>
        Voeg evenementen toe via de{' '}
        <a href="/kalender" target="_blank" style={{ color: 'var(--blauw)' }}>Fractiekalender pagina</a>.
      </p>
    </div>
  )

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '16px' }}>
        Aankomende evenementen uit de centrale fractiekalender. Klik op "Toevoegen" om een item als bespreekpunt toe te voegen aan de agenda.
      </p>

      {items.map(item => {
        const isToegevoegd = toegevoegd.has(item.id)
        return (
          <div key={item.id} style={{
            background: isToegevoegd ? '#f0faf2' : 'white',
            border: `1px solid ${isToegevoegd ? '#a8d8b5' : 'var(--rand)'}`,
            borderRadius: '8px', padding: '12px 16px', marginBottom: '8px',
            display: 'flex', alignItems: 'center', gap: '14px',
          }}>
            {/* Datum */}
            <div style={{ textAlign: 'center', minWidth: '48px', flexShrink: 0 }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--blauw)', lineHeight: 1 }}>
                {new Date(item.datum + 'T12:00:00').getDate()}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', textTransform: 'uppercase' }}>
                {new Date(item.datum + 'T12:00:00').toLocaleDateString('nl-NL', { month: 'short' })}
              </div>
            </div>

            <div style={{ width: '1px', height: '36px', background: 'var(--rand)', flexShrink: 0 }} />

            {/* Inhoud */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontFamily: 'Arial', color: 'var(--tekst)', fontWeight: '500' }}>
                {item.omschrijving}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '3px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
                  {formatDatum(item.datum)}
                </span>
                {item.locatie && (
                  <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
                    📍 {item.locatie}
                  </span>
                )}
                {item.personen && (
                  <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
                    👤 {item.personen}
                  </span>
                )}
              </div>
            </div>

            {/* Toevoegen knop */}
            <button
              onClick={() => !isToegevoegd && handleToevoegen(item)}
              disabled={isToegevoegd}
              style={{
                background: isToegevoegd ? '#e8f5ed' : 'var(--blauw)',
                color: isToegevoegd ? '#2d7a4f' : 'white',
                border: isToegevoegd ? '1px solid #a8d8b5' : 'none',
                padding: '7px 14px', borderRadius: '6px',
                cursor: isToegevoegd ? 'default' : 'pointer',
                fontSize: '12px', fontFamily: 'Arial', fontWeight: '600',
                flexShrink: 0, whiteSpace: 'nowrap' as const,
              }}
            >
              {isToegevoegd ? '✓ Toegevoegd' : '+ Bespreekpunt'}
            </button>
          </div>
        )
      })}

      <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginTop: '16px', textAlign: 'center' }}>
        Meer evenementen beheren?{' '}
        <a href="/kalender" target="_blank" style={{ color: 'var(--blauw)' }}>Open de fractiekalender ↗</a>
      </p>
    </div>
  )
}
