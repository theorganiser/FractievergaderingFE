'use client'

export const dynamic = 'force-dynamic'

import { useVergaderingOpToken } from '@/hooks/useVergaderingen'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Agendapunt } from '@/lib/types'
import { laadStemmen, slaaStemOp } from '@/lib/stemlijst'

interface Props { params: { token: string } }

interface StemItem {
  key: string
  label: string
  rvNummer?: string
  subtype: 'amendement' | 'raadsvoorstel' | 'motie'
  indent: boolean
  blokNummer: number
}

type GDPStem = 'voor' | 'tegen' | 'onthouding' | ''

function bouwStemlijstItems(punten: Agendapunt[]): StemItem[] {
  const items: StemItem[] = []
  let blokTeller = 0

  punten.forEach((punt, pi) => {
    if (punt.puntType !== 'raadsvergadering') return

    // Alle hoofdpunten (ook zonder inStemlijst - als ouder van amendementen/moties)
    const alleHoofdpunten = punt.subpunten.filter(s => !s.subtype || s.subtype === 'normaal')
    const alleAmendementen = punt.subpunten.filter(s => s.subtype === 'amendement' && s.inStemlijst)
    const alleMoties = punt.subpunten.filter(s => s.subtype === 'motie' && s.inStemlijst)
    const raadsvoorstellenInStemlijst = alleHoofdpunten.filter(s => s.inStemlijst)

    // Bepaal unieke blokken: elk hoofdpunt dat zelf in stemlijst staat OF
    // waarvoor amendementen/moties in de stemlijst staan
    const relevantHoofdpunten = alleHoofdpunten.filter(hp => {
      const rvNr = hp.rvNummer || ''
      const heeftGekoppelde = alleAmendementen.some(a => a.gekoppeldAanRv === rvNr) ||
                              alleMoties.some(m => m.gekoppeldAanRv === rvNr)
      return hp.inStemlijst || heeftGekoppelde
    })

    // Als geen hoofdpunten relevant en ook geen losse items, sla over
    const lozeA = alleAmendementen.filter(a => !a.gekoppeldAanRv || a.gekoppeldAanRv === '')
    const lozeM = alleMoties.filter(m => !m.gekoppeldAanRv || m.gekoppeldAanRv === '')
    if (!relevantHoofdpunten.length && !lozeA.length && !lozeM.length) return

    // Per relevant hoofdpunt een blok
    relevantHoofdpunten.forEach((hp, hpi) => {
      blokTeller++
      const blok = blokTeller
      const rvNr = hp.rvNummer || ''

      // Amendementen gekoppeld aan dit hoofdpunt
      // Als slechts 1 hoofdpunt totaal: neem ook ongekoppelde mee
      const totaalHoofdpunten = alleHoofdpunten.length
      const gekoppeldeA = alleAmendementen.filter(a =>
        a.gekoppeldAanRv
          ? a.gekoppeldAanRv === rvNr
          : totaalHoofdpunten === 1
      )
      const gekoppeldeM = alleMoties.filter(m =>
        m.gekoppeldAanRv
          ? m.gekoppeldAanRv === rvNr
          : totaalHoofdpunten === 1
      )

      gekoppeldeA.forEach((a, ai) => {
        items.push({ key: `${pi}-${hpi}-a-${ai}`, label: a.titel, rvNummer: a.rvNummer, subtype: 'amendement', indent: true, blokNummer: blok })
      })
      if (hp.inStemlijst) {
        items.push({ key: `${pi}-rv-${hpi}`, label: hp.titel, rvNummer: hp.rvNummer, subtype: 'raadsvoorstel', indent: false, blokNummer: blok })
      }
      gekoppeldeM.forEach((m, mi) => {
        items.push({ key: `${pi}-${hpi}-m-${mi}`, label: m.titel, rvNummer: m.rvNummer, subtype: 'motie', indent: true, blokNummer: blok })
      })
    })

    // Losse amendementen/moties zonder koppeling (alleen als meerdere hoofdpunten)
    if (alleHoofdpunten.length > 1 && (lozeA.length || lozeM.length)) {
      blokTeller++
      lozeA.forEach((a, ai) => items.push({ key: `${pi}-los-a-${ai}`, label: a.titel, rvNummer: a.rvNummer, subtype: 'amendement', indent: true, blokNummer: blokTeller }))
      lozeM.forEach((m, mi) => items.push({ key: `${pi}-los-m-${mi}`, label: m.titel, rvNummer: m.rvNummer, subtype: 'motie', indent: true, blokNummer: blokTeller }))
    }
  })
  return items
}

export default function StemlijstPagina({ params }: Props) {
  const { token } = params
  const { vergadering: v, geladen } = useVergaderingOpToken(token)
  const [stemmen, setStemmen] = useState<Record<string, GDPStem>>({})
  const [notities, setNotities] = useState<Record<string, string>>({})
  const [stemmenGeladen, setStemmenGeladen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Laad stemmen uit Supabase
  useEffect(() => {
    if (!v) return
    laadStemmen(v.id).then(data => {
      const nieuweStems: Record<string, GDPStem> = {}
      const nieuweNotities: Record<string, string> = {}
      Object.entries(data).forEach(([key, val]) => {
        nieuweStems[key] = val.stem as GDPStem
        nieuweNotities[key] = val.notitie
      })
      setStemmen(nieuweStems)
      setNotities(nieuweNotities)
      setStemmenGeladen(true)
    })
  }, [v])

  // Debounced opslaan
  const slaOp = useCallback((vergaderingId: string, key: string, stem: GDPStem, notitie: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      slaaStemOp(vergaderingId, key, stem, notitie)
    }, 1000)
  }, [])

  const setStem = (key: string, stem: GDPStem) => {
    setStemmen(prev => ({ ...prev, [key]: stem }))
    if (v) slaOp(v.id, key, stem, notities[key] || '')
  }

  const setNotitie = (key: string, notitie: string) => {
    setNotities(prev => ({ ...prev, [key]: notitie }))
    if (v) slaOp(v.id, key, stemmen[key] || '', notitie)
  }

  const exporteerPDF = () => { window.print() }

  if (!geladen) return <div style={{ textAlign: 'center', padding: '80px', color: '#888', fontFamily: 'Arial' }}>⏳ Laden...</div>
  if (!v) return <div style={{ textAlign: 'center', padding: '80px', color: '#c0392b', fontFamily: 'Arial' }}>Vergadering niet gevonden</div>

  const items = bouwStemlijstItems(v.punten || [])
  const rvPunten = (v.punten || []).filter(p => p.puntType === 'raadsvergadering')

  const blokken: StemItem[][] = []
  items.forEach(item => {
    const blokIdx = item.blokNummer - 1
    if (!blokken[blokIdx]) blokken[blokIdx] = []
    blokken[blokIdx].push(item)
  })

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 20px', fontFamily: 'Arial' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #4a1a5c', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ background: '#4a1a5c', color: '#a89060', fontWeight: '900', fontSize: '14px', padding: '3px 10px', borderRadius: '4px', letterSpacing: '1px', fontFamily: 'Arial Black' }}>GDP</span>
            <h1 style={{ fontSize: '20px', color: '#4a1a5c', fontWeight: '700', margin: 0 }}>Stemlijst</h1>
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            {v.titel}
            {rvPunten[0]?.rvDatum && <span style={{ marginLeft: '10px', color: '#4a1a5c', fontWeight: '600' }}>Raadsvergadering {rvPunten[0].rvDatum}</span>}
          </div>
          {stemmenGeladen && <div style={{ fontSize: '11px', color: '#2d7a4f', marginTop: '4px' }}>✓ Stemmen worden automatisch opgeslagen</div>}
        </div>
        <button onClick={exporteerPDF} className="no-print"
          style={{ background: '#4a1a5c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
          ⎙ PDF
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚖️</div>
          <p>Geen stemlijst-items gevonden.</p>
        </div>
      ) : (
        <>
          <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '20px', fontSize: '12px', color: '#666', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Volgorde:</span>
            <span style={{ background: '#f0e8ff', color: '#5a1a8a', border: '1px solid #c0a0d8', padding: '2px 10px', borderRadius: '3px' }}>📝 Amendementen</span>
            <span>→</span>
            <span style={{ background: '#e8f0ff', color: '#1a3a8a', border: '1px solid #a0c0e0', padding: '2px 10px', borderRadius: '3px' }}>⚖️ Raadsvoorstel</span>
            <span>→</span>
            <span style={{ background: '#fff0e8', color: '#8a4000', border: '1px solid #e8a060', padding: '2px 10px', borderRadius: '3px' }}>🗳 Moties</span>
          </div>

          {blokken.map((blok, bi) => (
            <div key={bi} style={{ marginBottom: '16px', border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden' }}>
              {blok.map((item, idx) => {
                const isA = item.subtype === 'amendement'
                const isM = item.subtype === 'motie'
                const isRV = item.subtype === 'raadsvoorstel'
                const stem = stemmen[item.key] || ''
                const notitie = notities[item.key] || ''
                const bg = isRV ? '#f0e8ff' : isA ? (idx % 2 === 0 ? '#f8f5ff' : '#f3eeff') : (idx % 2 === 0 ? '#fff8f0' : '#fff3e8')

                return (
                  <div key={item.key} style={{ background: bg, borderBottom: idx < blok.length - 1 ? '1px solid #e8e0f0' : 'none', padding: '10px 14px', paddingLeft: item.indent ? '28px' : '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Badge + nummer */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: '90px', flexShrink: 0 }}>
                        <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 5px', borderRadius: '3px', background: isA ? '#f0e8ff' : isM ? '#fff0e8' : '#e8f0ff', color: isA ? '#5a1a8a' : isM ? '#8a4000' : '#1a3a8a', border: `1px solid ${isA ? '#c0a0d8' : isM ? '#e8a060' : '#a0c0e0'}` }}>
                          {isA ? 'A' : isM ? 'M' : 'RV'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#4a1a5c', fontWeight: isRV ? 'bold' : 'normal' }}>{item.rvNummer || '—'}</span>
                      </div>

                      {/* Titel */}
                      <div style={{ flex: 1, fontSize: isRV ? '14px' : '13px', fontWeight: isRV ? '600' : 'normal', color: '#1a0a2e', minWidth: '150px' }}>
                        {item.label}
                      </div>

                      {/* GDP Stem knoppen */}
                      <div className="no-print" style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                        <StemKnop label="Voor" actief={stem === 'voor'} kleur="#2d7a4f" onClick={() => setStem(item.key, stem === 'voor' ? '' : 'voor')} />
                        <StemKnop label="Onthouding" actief={stem === 'onthouding'} kleur="#a86a00" onClick={() => setStem(item.key, stem === 'onthouding' ? '' : 'onthouding')} />
                        <StemKnop label="Tegen" actief={stem === 'tegen'} kleur="#c0392b" onClick={() => setStem(item.key, stem === 'tegen' ? '' : 'tegen')} />
                      </div>

                      {/* Print weergave */}
                      <div className="print-only" style={{ display: 'none', minWidth: '80px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold' }}>
                        {stem === 'voor' && <span style={{ color: '#2d7a4f' }}>✓ Voor</span>}
                        {stem === 'tegen' && <span style={{ color: '#c0392b' }}>✗ Tegen</span>}
                        {stem === 'onthouding' && <span style={{ color: '#a86a00' }}>~ Onthouding</span>}
                        {!stem && <span style={{ color: '#ccc' }}>—</span>}
                      </div>
                    </div>

                    {/* Notitie */}
                    <div style={{ marginTop: '6px', paddingLeft: '95px' }}>
                      <input className="no-print" value={notitie} onChange={e => setNotitie(item.key, e.target.value)}
                        placeholder="Notitie (optioneel)..."
                        style={{ width: '100%', border: '1px solid #e0d8f0', borderRadius: '5px', padding: '4px 8px', fontSize: '12px', outline: 'none', fontFamily: 'Arial', background: 'rgba(255,255,255,0.7)', boxSizing: 'border-box' as const }} />
                      {notitie && <div className="print-only" style={{ display: 'none', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>{notitie}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { font-size: 11pt; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>
    </div>
  )
}

function StemKnop({ label, actief, kleur, onClick }: { label: string; actief: boolean; kleur: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: actief ? kleur : 'white', color: actief ? 'white' : kleur, border: `1.5px solid ${kleur}`, padding: '4px 9px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontFamily: 'Arial', fontWeight: actief ? 'bold' : 'normal', transition: 'all 0.15s' }}>
      {label}
    </button>
  )
}
