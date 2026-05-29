'use client'

export const dynamic = 'force-dynamic'

import { useVergaderingOpToken } from '@/hooks/useVergaderingen'
import { useState } from 'react'
import { Agendapunt } from '@/lib/types'

interface Props { params: { token: string } }

interface StemItem {
  key: string
  label: string
  rvNummer?: string
  subtype: 'amendement' | 'raadsvoorstel' | 'motie'
  indent: boolean
  blokNummer: number  // welk RV-blok dit item bij hoort
}

type GDPStem = 'voor' | 'tegen' | 'onthouding' | ''

// Bouw stemlijst per RV-agendapunt
// Volgorde per raadsvoorstel-blok: amendementen → raadsvoorstel → moties
// Moties/amendementen zonder koppeling komen als losse blok onderaan
function bouwStemlijstItems(punten: Agendapunt[]): StemItem[] {
  const items: StemItem[] = []
  let blokTeller = 0

  punten.forEach((punt, pi) => {
    if (punt.puntType !== 'raadsvergadering') return

    const raadsvoorstellen = punt.subpunten.filter(s => (!s.subtype || s.subtype === 'normaal') && s.inStemlijst)
    const alleAmendementen = punt.subpunten.filter(s => s.subtype === 'amendement' && s.inStemlijst)
    const alleMoties = punt.subpunten.filter(s => s.subtype === 'motie' && s.inStemlijst)

    if (raadsvoorstellen.length === 0 && alleAmendementen.length === 0 && alleMoties.length === 0) return

    // Per raadsvoorstel een blok
    raadsvoorstellen.forEach((rv, rvi) => {
      blokTeller++
      const blok = blokTeller
      const rvNr = rv.rvNummer || ''

      // Amendementen gekoppeld aan dit RV (of alle als geen koppeling beschikbaar)
      const gekoppeldeAmendementen = alleAmendementen.filter(a =>
        a.gekoppeldAanRv ? a.gekoppeldAanRv === rvNr : raadsvoorstellen.length === 1
      )
      // Moties gekoppeld aan dit RV
      const gekoppeldeMoties = alleMoties.filter(m =>
        m.gekoppeldAanRv ? m.gekoppeldAanRv === rvNr : raadsvoorstellen.length === 1
      )

      // 1. Amendementen
      gekoppeldeAmendementen.forEach((a, ai) => {
        items.push({ key: `${pi}-${rvi}-a-${ai}`, label: a.titel, rvNummer: a.rvNummer, subtype: 'amendement', indent: true, blokNummer: blok })
      })
      // 2. Raadsvoorstel
      items.push({ key: `${pi}-rv-${rvi}`, label: rv.titel, rvNummer: rv.rvNummer, subtype: 'raadsvoorstel', indent: false, blokNummer: blok })
      // 3. Moties
      gekoppeldeMoties.forEach((m, mi) => {
        items.push({ key: `${pi}-${rvi}-m-${mi}`, label: m.titel, rvNummer: m.rvNummer, subtype: 'motie', indent: true, blokNummer: blok })
      })
    })

    // Losse moties/amendementen (niet gekoppeld en meerdere RVs)
    if (raadsvoorstellen.length > 1) {
      const lozeAmendementen = alleAmendementen.filter(a => !a.gekoppeldAanRv || a.gekoppeldAanRv === '')
      const lozeMoties = alleMoties.filter(m => !m.gekoppeldAanRv || m.gekoppeldAanRv === '')

      if (lozeAmendementen.length > 0 || lozeMoties.length > 0) {
        blokTeller++
        const blok = blokTeller
        lozeAmendementen.forEach((a, ai) => {
          items.push({ key: `${pi}-los-a-${ai}`, label: a.titel, rvNummer: a.rvNummer, subtype: 'amendement', indent: true, blokNummer: blok })
        })
        lozeMoties.forEach((m, mi) => {
          items.push({ key: `${pi}-los-m-${mi}`, label: m.titel, rvNummer: m.rvNummer, subtype: 'motie', indent: true, blokNummer: blok })
        })
      }
    }
  })

  return items
}

export default function StemlijstPagina({ params }: Props) {
  const { token } = params
  const { vergadering: v, geladen } = useVergaderingOpToken(token)
  const [stemmen, setStemmen] = useState<Record<string, GDPStem>>({})

  if (!geladen) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#888', fontFamily: 'Arial' }}>⏳ Laden...</div>
  )
  if (!v) return (
    <div style={{ textAlign: 'center', padding: '80px', color: '#c0392b', fontFamily: 'Arial' }}>Vergadering niet gevonden</div>
  )

  const items = bouwStemlijstItems(v.punten || [])
  const rvPunten = (v.punten || []).filter(p => p.puntType === 'raadsvergadering')

  const setStem = (key: string, stem: GDPStem) => {
    setStemmen(prev => ({ ...prev, [key]: stem }))
  }

  // Groepeer items per blok voor visuele scheiding
  const blokken: StemItem[][] = []
  items.forEach(item => {
    const blokIdx = item.blokNummer - 1
    if (!blokken[blokIdx]) blokken[blokIdx] = []
    blokken[blokIdx].push(item)
  })

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px', fontFamily: 'Arial' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #4a1a5c', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ background: '#4a1a5c', color: '#a89060', fontWeight: '900', fontSize: '14px', padding: '3px 10px', borderRadius: '4px', letterSpacing: '1px', fontFamily: 'Arial Black' }}>GDP</span>
            <h1 style={{ fontSize: '20px', color: '#4a1a5c', fontWeight: '700', margin: 0 }}>Stemlijst</h1>
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            {v.titel}
            {rvPunten.length > 0 && rvPunten[0].rvDatum && (
              <span style={{ marginLeft: '10px', color: '#4a1a5c', fontWeight: '600' }}>
                Raadsvergadering {rvPunten[0].rvDatum}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => window.print()}
          style={{ background: '#4a1a5c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
          className="no-print">
          ⎙ Afdrukken
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚖️</div>
          <p>Geen stemlijst-items gevonden.</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>
            Voeg een <strong>Raadsvergadering</strong> punt toe en vink "Stemlijst" aan bij de subpunten.
          </p>
        </div>
      ) : (
        <div>
          {/* Legenda */}
          <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '20px', fontSize: '12px', color: '#666', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ marginRight: '4px' }}>Volgorde:</span>
            <span style={{ background: '#f0e8ff', color: '#5a1a8a', border: '1px solid #c0a0d8', padding: '2px 10px', borderRadius: '3px' }}>📝 Amendementen</span>
            <span style={{ color: '#999' }}>→</span>
            <span style={{ background: '#e8f0ff', color: '#1a3a8a', border: '1px solid #a0c0e0', padding: '2px 10px', borderRadius: '3px' }}>⚖️ Raadsvoorstel</span>
            <span style={{ color: '#999' }}>→</span>
            <span style={{ background: '#fff0e8', color: '#8a4000', border: '1px solid #e8a060', padding: '2px 10px', borderRadius: '3px' }}>🗳 Moties</span>
          </div>

          {/* Blokken per raadsvoorstel */}
          {blokken.map((blok, bi) => (
            <div key={bi} style={{ marginBottom: '20px', border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(74,26,92,0.08)' }}>
              {blok.map((item, idx) => {
                const isAmendement = item.subtype === 'amendement'
                const isMotie = item.subtype === 'motie'
                const isRV = item.subtype === 'raadsvoorstel'
                const stem = stemmen[item.key] || ''

                const rijBg = isRV
                  ? '#f0e8ff'
                  : isAmendement
                  ? (idx % 2 === 0 ? '#f8f5ff' : '#f3eeff')
                  : (idx % 2 === 0 ? '#fff8f0' : '#fff3e8')

                return (
                  <div key={item.key} style={{
                    background: rijBg,
                    borderBottom: idx < blok.length - 1 ? '1px solid #e8e0f0' : 'none',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingLeft: item.indent ? '32px' : '16px',
                  }}>
                    {/* Type badge + nummer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '90px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 'bold', padding: '2px 5px', borderRadius: '3px',
                        background: isAmendement ? '#f0e8ff' : isMotie ? '#fff0e8' : '#e8f0ff',
                        color: isAmendement ? '#5a1a8a' : isMotie ? '#8a4000' : '#1a3a8a',
                        border: `1px solid ${isAmendement ? '#c0a0d8' : isMotie ? '#e8a060' : '#a0c0e0'}`,
                      }}>
                        {isAmendement ? 'A' : isMotie ? 'M' : 'RV'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#4a1a5c', fontWeight: isRV ? 'bold' : 'normal' }}>
                        {item.rvNummer || '—'}
                      </span>
                    </div>

                    {/* Titel */}
                    <div style={{ flex: 1, fontSize: isRV ? '14px' : '13px', fontWeight: isRV ? '600' : 'normal', color: '#1a0a2e' }}>
                      {item.label}
                    </div>

                    {/* GDP Stem knoppen */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} className="no-print">
                      <StemKnop label="Voor" actief={stem === 'voor'} kleur="#2d7a4f"
                        onClick={() => setStem(item.key, stem === 'voor' ? '' : 'voor')} />
                      <StemKnop label="Onthouding" actief={stem === 'onthouding'} kleur="#a86a00"
                        onClick={() => setStem(item.key, stem === 'onthouding' ? '' : 'onthouding')} />
                      <StemKnop label="Tegen" actief={stem === 'tegen'} kleur="#c0392b"
                        onClick={() => setStem(item.key, stem === 'tegen' ? '' : 'tegen')} />
                    </div>

                    {/* Print weergave stem */}
                    <div className="print-only" style={{ display: 'none', minWidth: '80px', textAlign: 'center' }}>
                      {stem === 'voor' && <span style={{ color: '#2d7a4f', fontWeight: 'bold' }}>✓ Voor</span>}
                      {stem === 'tegen' && <span style={{ color: '#c0392b', fontWeight: 'bold' }}>✗ Tegen</span>}
                      {stem === 'onthouding' && <span style={{ color: '#a86a00', fontWeight: 'bold' }}>~ Onthouding</span>}
                      {!stem && <span style={{ color: '#ccc' }}>—</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StemKnop({ label, actief, kleur, onClick }: {
  label: string; actief: boolean; kleur: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      background: actief ? kleur : 'white',
      color: actief ? 'white' : kleur,
      border: `1.5px solid ${kleur}`,
      padding: '5px 10px', borderRadius: '5px',
      cursor: 'pointer', fontSize: '11px', fontFamily: 'Arial',
      fontWeight: actief ? 'bold' : 'normal',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}
