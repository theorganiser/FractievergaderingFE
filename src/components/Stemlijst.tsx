'use client'


import { Vergadering } from '@/lib/types'

interface StemlijstProps {
  vergadering: Vergadering
}

export default function Stemlijst({ vergadering }: StemlijstProps) {
  const punten = vergadering.punten || []
  const rvDatum = vergadering.raadsvergaderingDatum
  // Verwijs naar de aparte stemlijst pagina via de leespagina
  // De editor toont alleen een preview van welke punten in de stemlijst staan

  const stemItems: { rvNummer?: string; titel: string; subtype: string }[] = []

  punten.forEach(punt => {
    if (punt.puntType !== 'raadsvergadering') return
    punt.subpunten.forEach(sub => {
      if (!sub.inStemlijst) return
      stemItems.push({
        rvNummer: sub.rvNummer,
        titel: sub.titel,
        subtype: sub.subtype || 'normaal',
      })
    })
  })

  return (
    <div>
      <div style={{ background: '#f5eeff', border: '1px solid #c0a0d8', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>⚖️</span>
        <div>
          <div style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: '600', color: '#4a1a5c', marginBottom: '4px' }}>
            De stemlijst is beschikbaar via de leesweergave
          </div>
          <div style={{ fontSize: '12px', color: '#888', fontFamily: 'Arial' }}>
            Open de leesweergave en klik op "⚖️ Stemlijst" voor de volledige stemlijst met GDP-stemmen die worden opgeslagen.
          </div>
        </div>
      </div>

      {stemItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚖️</div>
          <p>Geen stemlijst-items.</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Voeg een <strong>Raadsvergadering</strong> punt toe in de agenda en vink "Stemlijst" aan bij de subpunten.</p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '12px' }}>
            {stemItems.length} item{stemItems.length !== 1 ? 's' : ''} in de stemlijst:
          </p>
          <div style={{ border: '1px solid var(--rand)', borderRadius: '8px', overflow: 'hidden' }}>
            {stemItems.map((item, idx) => {
              const isA = item.subtype === 'amendement'
              const isM = item.subtype === 'motie'
              const isRV = item.subtype === 'normaal'
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: idx < stemItems.length - 1 ? '1px solid #f0ede8' : 'none', background: idx % 2 === 0 ? 'white' : '#fafaf8' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '3px', flexShrink: 0, background: isA ? '#f0e8ff' : isM ? '#fff0e8' : '#e8f0ff', color: isA ? '#5a1a8a' : isM ? '#8a4000' : '#1a3a8a', border: `1px solid ${isA ? '#c0a0d8' : isM ? '#e8a060' : '#a0c0e0'}` }}>
                    {isA ? 'A' : isM ? 'M' : 'RV'}
                  </span>
                  {item.rvNummer && (
                    <span style={{ fontSize: '12px', color: '#4a1a5c', fontWeight: 'bold', minWidth: '60px', flexShrink: 0 }}>{item.rvNummer}</span>
                  )}
                  <span style={{ fontSize: '13px', fontFamily: 'Arial', flex: 1, fontWeight: isRV ? '600' : 'normal' }}>{item.titel}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
