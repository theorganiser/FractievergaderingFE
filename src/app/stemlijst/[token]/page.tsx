'use client'

export const dynamic = 'force-dynamic'

import { useVergaderingOpToken } from '../../../hooks/useVergaderingen'
import { useAuth } from '../../../hooks/useAuth'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Agendapunt, Subpunt } from '../../../lib/types'
import { laadStemmen, slaaStemOp } from '../../../lib/stemlijst'

interface Props { params: { token: string } }

type GDPStem = 'voor' | 'tegen' | 'onthouding' | ''

interface StemItem {
  key: string
  label: string
  rvNummer?: string
  subtype: 'amendement' | 'raadsvoorstel' | 'motie'
  indent: boolean
  blokNummer: number
}

function bouwStemlijstItems(punten: Agendapunt[]): StemItem[] {
  const items: StemItem[] = []
  let blokTeller = 0

  punten.forEach((punt, pi) => {
    if (punt.puntType !== 'raadsvergadering') return

    const alleHoofdpunten = punt.subpunten.filter(s => !s.subtype || s.subtype === 'normaal')
    const alleAmendementen = punt.subpunten.filter(s => s.subtype === 'amendement' && s.inStemlijst)
    const alleMoties = punt.subpunten.filter(s => s.subtype === 'motie' && s.inStemlijst)

    const relevantHoofdpunten = alleHoofdpunten.filter(hp => {
      const rvNr = hp.rvNummer || ''
      const heeftGekoppelde = alleAmendementen.some(a => a.gekoppeldAanRv === rvNr) ||
                              alleMoties.some(m => m.gekoppeldAanRv === rvNr)
      return hp.inStemlijst || heeftGekoppelde
    })

    const lozeA = alleAmendementen.filter(a => !a.gekoppeldAanRv || a.gekoppeldAanRv === '')
    const lozeM = alleMoties.filter(m => !m.gekoppeldAanRv || m.gekoppeldAanRv === '')
    if (!relevantHoofdpunten.length && !lozeA.length && !lozeM.length) return

    const maakKey = (sub: Subpunt, type: string) =>
      sub.stemlijstKey || `${type}-${sub.rvNummer || sub.titel.substring(0, 20)}`

    relevantHoofdpunten.forEach((hp, hpi) => {
      blokTeller++
      const blok = blokTeller
      const rvNr = hp.rvNummer || ''
      const totaalHoofdpunten = alleHoofdpunten.length

      const gekoppeldeA = alleAmendementen.filter(a =>
        a.gekoppeldAanRv ? a.gekoppeldAanRv === rvNr : totaalHoofdpunten === 1)
      const gekoppeldeM = alleMoties.filter(m =>
        m.gekoppeldAanRv ? m.gekoppeldAanRv === rvNr : totaalHoofdpunten === 1)

      gekoppeldeA.forEach(a => items.push({ key: maakKey(a, 'amendement'), label: a.titel, rvNummer: a.rvNummer, subtype: 'amendement', indent: true, blokNummer: blok }))
      if (hp.inStemlijst) items.push({ key: maakKey(hp, 'raadsvoorstel'), label: hp.titel, rvNummer: hp.rvNummer, subtype: 'raadsvoorstel', indent: false, blokNummer: blok })
      gekoppeldeM.forEach(m => items.push({ key: maakKey(m, 'motie'), label: m.titel, rvNummer: m.rvNummer, subtype: 'motie', indent: true, blokNummer: blok }))
    })

    if (alleHoofdpunten.length > 1 && (lozeA.length || lozeM.length)) {
      blokTeller++
      lozeA.forEach(a => items.push({ key: maakKey(a, 'amendement'), label: a.titel, rvNummer: a.rvNummer, subtype: 'amendement', indent: true, blokNummer: blokTeller }))
      lozeM.forEach(m => items.push({ key: maakKey(m, 'motie'), label: m.titel, rvNummer: m.rvNummer, subtype: 'motie', indent: true, blokNummer: blokTeller }))
    }
  })
  return items
}

export default function StemlijstPagina({ params }: Props) {
  const { token } = params
  const { vergadering: v, geladen } = useVergaderingOpToken(token)
  const { isAdmin, isModerator } = useAuth()
  const [stemmen, setStemmen] = useState<Record<string, GDPStem>>({})
  const [notities, setNotities] = useState<Record<string, string>>({})
  const [stemlijstOpen, setStemlijstOpen] = useState<Record<string, boolean>>({})
  const [stemmenGeladen, setStemmenGeladen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const magBewerken = isAdmin || isModerator

  useEffect(() => {
    if (!v) return
    laadStemmen(v.id).then(data => {
      const s: Record<string, GDPStem> = {}
      const n: Record<string, string> = {}
      Object.entries(data).forEach(([key, val]) => {
        s[key] = val.stem as GDPStem
        n[key] = val.notitie
      })
      setStemmen(s)
      setNotities(n)
      setStemmenGeladen(true)
    })
  }, [v])

  const slaOp = useCallback((vergaderingId: string, key: string, stem: GDPStem, notitie: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { slaaStemOp(vergaderingId, key, stem, notitie) }, 800)
  }, [])

  const setStem = (key: string, stem: GDPStem) => {
    setStemmen(prev => ({ ...prev, [key]: stem }))
    if (v) slaOp(v.id, key, stem, notities[key] || '')
  }
  const setNotitie = (key: string, notitie: string) => {
    setNotities(prev => ({ ...prev, [key]: notitie }))
    if (v) slaOp(v.id, key, stemmen[key] || '', notitie)
  }
  const toggleStemverklaring = (key: string) =>
    setStemlijstOpen(prev => ({ ...prev, [key]: !prev[key] }))

  if (!geladen) return <div style={{ textAlign: 'center', padding: '80px', color: '#888', fontFamily: 'Arial' }}>⏳ Laden...</div>
  if (!v) return <div style={{ textAlign: 'center', padding: '80px', color: '#c0392b', fontFamily: 'Arial' }}>Vergadering niet gevonden</div>

  const items = bouwStemlijstItems(v.punten || [])
  const rvPunten = (v.punten || []).filter(p => p.puntType === 'raadsvergadering')

  const blokken: StemItem[][] = []
  items.forEach(item => {
    if (!blokken[item.blokNummer - 1]) blokken[item.blokNummer - 1] = []
    blokken[item.blokNummer - 1].push(item)
  })

  const stemKleur = (s: GDPStem) => ({
    'voor':       { bg: '#e8f5ed', kleur: '#2d7a4f', rand: '#6dbb80', label: '✓ VOOR' },
    'tegen':      { bg: '#fdf0ef', kleur: '#c0392b', rand: '#e8a090', label: '✗ TEGEN' },
    'onthouding': { bg: '#fff8e8', kleur: '#a86a00', rand: '#e8c870', label: '~ ONTHOUDING' },
    '':           { bg: '#f5f5f5', kleur: '#bbb',    rand: '#ddd',    label: '— onbekend' },
  }[s || ''])

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 16px', fontFamily: 'Arial' }}>
      {/* Header */}
      <div style={{ borderBottom: '3px solid #4a1a5c', paddingBottom: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#4a1a5c', color: '#a89060', fontWeight: '900', fontSize: '13px', padding: '3px 10px', borderRadius: '4px', letterSpacing: '1px' }}>GDP</span>
            <h1 style={{ fontSize: '18px', color: '#4a1a5c', fontWeight: '700', margin: 0 }}>Stemlijst</h1>
          </div>
          <button onClick={() => window.print()} className="no-print"
            style={{ background: '#4a1a5c', color: 'white', border: 'none', padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            ⎙ Afdrukken
          </button>
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
          {v.titel}
          {rvPunten[0]?.rvDatum && <span style={{ marginLeft: '10px', color: '#4a1a5c', fontWeight: '600' }}>· Raadsvergadering {rvPunten[0].rvDatum}</span>}
        </div>
        {stemmenGeladen && magBewerken && (
          <div style={{ fontSize: '11px', color: '#2d7a4f', marginTop: '4px' }}>✓ Stemmen worden automatisch opgeslagen</div>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚖️</div>
          <p>Geen stemlijst-items gevonden.</p>
        </div>
      ) : (
        <div>
          {/* Legenda */}
          <div className="no-print" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '11px' }}>
            <span style={{ color: '#666' }}>Volgorde per blok:</span>
            {[['A', 'Amendementen', '#f0e8ff', '#5a1a8a', '#c0a0d8'], ['RV', 'Raadsvoorstel', '#e8f0ff', '#1a3a8a', '#a0c0e0'], ['M', 'Moties', '#fff0e8', '#8a4000', '#e8a060']].map(([code, label, bg, kleur, rand]) => (
              <span key={code} style={{ background: bg, color: kleur, border: `1px solid ${rand}`, padding: '2px 8px', borderRadius: '3px' }}>{code} {label}</span>
            ))}
          </div>

          {blokken.map((blok, bi) => (
            <div key={bi} style={{ marginBottom: '10px', border: '1px solid #e0d0f0', borderRadius: '10px', overflow: 'hidden' }}>
              {blok.map((item, idx) => {
                const isA = item.subtype === 'amendement'
                const isM = item.subtype === 'motie'
                const isRV = item.subtype === 'raadsvoorstel'
                const stem = stemmen[item.key] || ''
                const notitie = notities[item.key] || ''
                const heeftNotitie = notitie.trim().length > 0
                const stemverklaringOpen = stemlijstOpen[item.key]
                const sk = stemKleur(stem)

                return (
                  <div key={item.key} style={{
                    borderBottom: idx < blok.length - 1 ? '1px solid #f0ede8' : 'none',
                    background: isRV ? '#f8f0ff' : item.indent ? '#fefcff' : 'white',
                  }}>
                    <div style={{ padding: '10px 14px', paddingLeft: item.indent ? '24px' : '14px' }}>
                      {/* Hoofdrij */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {/* Type badge */}
                        <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, background: isA ? '#f0e8ff' : isM ? '#fff0e8' : '#e8f0ff', color: isA ? '#5a1a8a' : isM ? '#8a4000' : '#1a3a8a', border: `1px solid ${isA ? '#c0a0d8' : isM ? '#e8a060' : '#a0c0e0'}` }}>
                          {isA ? 'A' : isM ? 'M' : 'RV'}
                        </span>
                        {item.rvNummer && (
                          <span style={{ fontSize: '12px', color: '#4a1a5c', fontWeight: 'bold', flexShrink: 0, minWidth: '50px' }}>{item.rvNummer}</span>
                        )}
                        {/* Titel */}
                        <span style={{ flex: 1, fontSize: isRV ? '14px' : '13px', fontWeight: isRV ? '600' : 'normal', color: '#1a0a2e', minWidth: '100px' }}>
                          {item.label}
                        </span>
                      </div>

                      {/* Stem knoppen — altijd zichtbaar voor admin/moderator */}
                      {magBewerken && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {(['voor', 'onthouding', 'tegen'] as GDPStem[]).map(s => {
                            const k = stemKleur(s)
                            const actief = stem === s
                            return (
                              <button key={s} onClick={() => setStem(item.key, actief ? '' : s)}
                                style={{ padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', fontWeight: actief ? 'bold' : 'normal', transition: 'all 0.12s', background: actief ? k.kleur : 'white', color: actief ? 'white' : k.kleur, border: `1.5px solid ${k.kleur}` }}>
                                {s === 'voor' ? '✓ Voor' : s === 'tegen' ? '✗ Tegen' : '~ Onthouding'}
                              </button>
                            )
                          })}
                          {/* Stemverklaring knop */}
                          <button onClick={() => toggleStemverklaring(item.key)}
                            style={{ padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', background: stemverklaringOpen || heeftNotitie ? '#f0e8ff' : 'white', color: '#5a1a8a', border: `1.5px solid ${heeftNotitie ? '#5a1a8a' : '#ddd'}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            💬 {heeftNotitie ? 'Stemverklaring ✓' : 'Stemverklaring'}
                          </button>
                        </div>
                      )}

                      {/* Read-only stem weergave voor fractieleden */}
                      {!magBewerken && stem && (
                        <div style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '3px 10px', borderRadius: '5px', background: sk.bg, color: sk.kleur, border: `1.5px solid ${sk.rand}` }}>
                            {sk.label}
                          </span>
                          {heeftNotitie && <span title="Stemverklaring aanwezig" style={{ fontSize: '13px' }}>💬</span>}
                        </div>
                      )}

                      {/* Stemverklaring tekstveld */}
                      {magBewerken && stemverklaringOpen && (
                        <div style={{ marginTop: '8px' }}>
                          <textarea rows={2} value={notitie} onChange={e => setNotitie(item.key, e.target.value)}
                            placeholder="Stemverklaring / toelichting..."
                            style={{ width: '100%', border: '1px solid #c0a0d8', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontFamily: 'Arial', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const, background: '#fdf8ff' }} />
                        </div>
                      )}

                      {/* Print weergave */}
                      <div className="print-only" style={{ display: 'none', marginTop: '4px', fontSize: '12px', fontWeight: 'bold', color: sk.kleur }}>
                        {stem ? sk.label : '—'}
                        {heeftNotitie && ` · Stemverklaring: ${notitie}`}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { font-size: 10pt; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
    </div>
  )
}
