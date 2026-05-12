'use client'

import { useState } from 'react'
import { Agendapunt } from '@/lib/types'

type Stem = 'voor' | 'tegen' | 'onbekend'

interface StemItem {
  id: string
  titel: string
  stem: Stem
  notitie?: string
}

interface StemlijstProps {
  punten: Agendapunt[]
  rvDatum?: string
}

const STEM_CONFIG: Record<Stem, { label: string; kleur: string; bg: string; rand: string; emoji: string }> = {
  voor: { label: 'VOOR', kleur: '#1a5c2a', bg: '#d4f5dd', rand: '#6dbb80', emoji: '✅' },
  onbekend: { label: 'NOG TE BEPALEN', kleur: '#7a5a00', bg: '#fff3cc', rand: '#d4aa00', emoji: '🔶' },
  tegen: { label: 'TEGEN', kleur: '#8b1a1a', bg: '#fde8e8', rand: '#e08080', emoji: '❌' },
}

export default function Stemlijst({ punten, rvDatum }: StemlijstProps) {
  // Haal raadsvergadering subpunten op als stemitems
  const rvPunt = punten.find(p => p.titel.toLowerCase().includes('raadsvergadering'))
  
  const [items, setItems] = useState<StemItem[]>(() => {
    const bronPunten = rvPunt?.subpunten || []
    return bronPunten
      .filter(s => s.titel && !s.titel.toLowerCase().includes('agenda raadsvergadering') && !s.titel.toLowerCase().includes('stemlijst'))
      .map(s => ({ id: s.id, titel: s.titel, stem: 'onbekend' as Stem, notitie: '' }))
  })

  const [extraTitel, setExtraTitel] = useState('')
  const [toonExport, setToonExport] = useState(false)

  const setStem = (id: string, stem: Stem) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, stem } : i))
  }

  const setNotitie = (id: string, notitie: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, notitie } : i))
  }

  const voegToe = () => {
    if (!extraTitel.trim()) return
    setItems(prev => [...prev, { id: 'e_' + Date.now(), titel: extraTitel.trim(), stem: 'onbekend', notitie: '' }])
    setExtraTitel('')
  }

  const verwijder = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const exporteerPDF = () => {
    const html = `
<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8">
<title>Stemlijst GDP ${rvDatum || ''}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 32px; max-width: 700px; margin: 0 auto; }
  h1 { color: #0d2b4e; border-bottom: 3px solid #e8c84a; padding-bottom: 10px; }
  .item { margin: 10px 0; padding: 10px 14px; border-radius: 6px; display: flex; align-items: center; gap: 12px; }
  .voor { background: #d4f5dd; border-left: 4px solid #6dbb80; }
  .tegen { background: #fde8e8; border-left: 4px solid #e08080; }
  .onbekend { background: #fff3cc; border-left: 4px solid #d4aa00; }
  .stem-badge { font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 3px; white-space: nowrap; }
  .notitie { font-size: 11px; color: #666; font-style: italic; margin-top: 3px; }
  @media print { body { padding: 16px; } }
</style></head><body>
<h1>Stemlijst GDP — Raadsvergadering ${rvDatum || ''}</h1>
${items.map(i => {
  const c = STEM_CONFIG[i.stem]
  return `<div class="item ${i.stem}">
    <span class="stem-badge" style="background:${c.rand};color:${c.kleur}">${c.emoji} ${c.label}</span>
    <div><div>${i.titel}</div>${i.notitie ? `<div class="notitie">${i.notitie}</div>` : ''}</div>
  </div>`
}).join('')}
<p style="margin-top:24px;font-size:11px;color:#999;">Goois Democratisch Platform — gegenereerd ${new Date().toLocaleDateString('nl-NL')}</p>
</body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stemlijst-gdp-${rvDatum || 'rv'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = { voor: items.filter(i => i.stem === 'voor').length, tegen: items.filter(i => i.stem === 'tegen').length, onbekend: items.filter(i => i.stem === 'onbekend').length }

  return (
    <div>
      {/* Header met stats */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {(['voor', 'onbekend', 'tegen'] as Stem[]).map(s => {
          const c = STEM_CONFIG[s]
          return (
            <div key={s} style={{ background: c.bg, border: `1px solid ${c.rand}`, borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>{c.emoji}</span>
              <div>
                <div style={{ fontSize: '10px', color: c.kleur, fontFamily: 'Arial', fontWeight: 'bold', letterSpacing: '0.5px' }}>{c.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: c.kleur, lineHeight: 1 }}>{stats[s]}</div>
              </div>
            </div>
          )
        })}
        <div style={{ flex: 1 }} />
        <button onClick={exporteerPDF} style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⬇ Exporteer stemlijst
        </button>
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic' }}>
          Geen raadsvergadering agendapunten gevonden. Voeg punten hieronder handmatig toe.
        </div>
      )}

      {/* Stemitems */}
      {items.map(item => {
        const c = STEM_CONFIG[item.stem]
        return (
          <div key={item.id} style={{ background: c.bg, border: `1px solid ${c.rand}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '8px', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontFamily: 'Arial', color: 'var(--tekst)', marginBottom: '6px' }}>{item.titel}</div>
                <input
                  placeholder="Notitie / aantekening (optioneel)"
                  value={item.notitie || ''}
                  onChange={e => setNotitie(item.id, e.target.value)}
                  style={{ width: '100%', fontSize: '12px', padding: '4px 8px', border: `1px solid ${c.rand}`, borderRadius: '4px', background: 'rgba(255,255,255,0.7)', fontFamily: 'Arial', fontStyle: 'italic', outline: 'none' }}
                />
              </div>
              {/* Stem knoppen */}
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {(['voor', 'onbekend', 'tegen'] as Stem[]).map(s => {
                  const sc = STEM_CONFIG[s]
                  const actief = item.stem === s
                  return (
                    <button key={s} onClick={() => setStem(item.id, s)} style={{
                      padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', fontWeight: 'bold',
                      background: actief ? sc.rand : 'rgba(255,255,255,0.6)',
                      color: actief ? sc.kleur : '#999',
                      border: `2px solid ${actief ? sc.rand : 'rgba(0,0,0,0.1)'}`,
                      transform: actief ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.15s',
                    }}>
                      {sc.emoji}
                    </button>
                  )
                })}
                <button onClick={() => verwijder(item.id)} style={{ padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: '#999' }}>✕</button>
              </div>
            </div>
          </div>
        )
      })}

      {/* Punt toevoegen */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <input
          value={extraTitel}
          onChange={e => setExtraTitel(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && voegToe()}
          placeholder="Extra agendapunt toevoegen aan stemlijst..."
          style={{ flex: 1, padding: '9px 12px', border: '1px solid var(--rand)', borderRadius: '7px', fontSize: '13px', fontFamily: 'Arial', outline: 'none' }}
        />
        <button onClick={voegToe} disabled={!extraTitel.trim()} style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', opacity: !extraTitel.trim() ? 0.5 : 1 }}>
          + Toevoegen
        </button>
      </div>
    </div>
  )
}
