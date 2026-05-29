'use client'

import { useState } from 'react'
import { Agendapunt, Subpunt } from '@/lib/types'

type Stem = '✅' | '🔶' | '❌' | ''
type StemKey = string // `${puntIndex}-${subIndex|'main'}`

const FRACTIES = ['GDP', 'VVD', 'D66', 'PvdA/GL', 'CDA', 'PRO', 'Hart']

interface StemlijstProps {
  punten: Agendapunt[]
  rvDatum?: string
}

interface StemItem {
  key: string
  label: string
  rvNummer?: string
  subtype?: 'motie' | 'amendement' | 'normaal'
  indent?: boolean
}

export default function Stemlijst({ punten, rvDatum }: StemlijstProps) {
  const [stemmen, setStemmen] = useState<Record<string, Record<string, Stem>>>({})
  const [notities, setNotities] = useState<Record<string, string>>({})

  // Verzamel alle stemlijst-items uit alle punten
  const stemItems: StemItem[] = []

  punten.forEach((punt, pi) => {
    if (punt.puntType === 'raadsvergadering') {
      punt.subpunten.forEach((sub, si) => {
        if (sub.inStemlijst) {
          const isSubtype = sub.subtype === 'motie' || sub.subtype === 'amendement'
          stemItems.push({
            key: `${pi}-${si}`,
            label: sub.titel,
            rvNummer: sub.rvNummer,
            subtype: sub.subtype || 'normaal',
            indent: isSubtype,
          })
        }
      })
    }
  })

  const setHoofdStem = (key: string, fractie: string, stem: Stem) => {
    setStemmen(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [fractie]: stem }
    }))
  }

  const exporteer = () => {
    const rijen = stemItems.map(item => {
      const stemRij = FRACTIES.map(f => stemmen[item.key]?.[f] || '—')
      return `${item.rvNummer || ''}\t${item.label}\t${stemRij.join('\t')}`
    })
    const header = `Punt\tTitel\t${FRACTIES.join('\t')}`
    const blob = new Blob([[header, ...rijen].join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stemlijst-${rvDatum || 'vergadering'}.txt`
    a.click()
  }

  if (stemItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚖️</div>
        <p style={{ marginBottom: '8px' }}>Geen stemlijst-items gevonden.</p>
        <p style={{ fontSize: '13px' }}>
          Voeg een <strong>Raadsvergadering</strong> agendapunt toe en vink bij de subpunten{' '}
          <strong>"Stemlijst"</strong> aan om ze hier te tonen.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '16px', color: 'var(--blauw)', fontFamily: 'Arial', fontWeight: '600', margin: 0 }}>
          ⚖️ Stemlijst {rvDatum && `— ${rvDatum}`}
        </h2>
        <button onClick={exporteer}
          style={{ background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}>
          ↓ Exporteren
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'Arial' }}>
          <thead>
            <tr style={{ background: 'var(--blauw)', color: 'white' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', minWidth: '70px' }}>Nr.</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', minWidth: '200px' }}>Punt</th>
              {FRACTIES.map(f => (
                <th key={f} style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', minWidth: '80px' }}>{f}</th>
              ))}
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600', minWidth: '120px' }}>Notitie</th>
            </tr>
          </thead>
          <tbody>
            {stemItems.map((item, idx) => {
              const isMotie = item.subtype === 'motie'
              const isAmendement = item.subtype === 'amendement'
              const rij = stemmen[item.key] || {}
              const bg = idx % 2 === 0 ? 'white' : '#fafaf8'

              return (
                <tr key={item.key} style={{ background: item.indent ? (idx % 2 === 0 ? '#fdf8ff' : '#f8f0ff') : bg }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--rand)', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {(isMotie || isAmendement) && (
                        <span style={{ fontSize: '10px', background: isMotie ? '#fff0e8' : '#f0e8ff', color: isMotie ? '#8a4000' : '#5a1a8a', border: `1px solid ${isMotie ? '#e8a060' : '#c0a0d8'}`, padding: '1px 4px', borderRadius: '3px' }}>
                          {isMotie ? 'M' : 'A'}
                        </span>
                      )}
                      <span style={{ fontWeight: item.indent ? 'normal' : 'bold', color: item.indent ? '#5a1a8a' : 'var(--blauw)' }}>
                        {item.rvNummer || '—'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--rand)', paddingLeft: item.indent ? '28px' : '12px', verticalAlign: 'middle' }}>
                    {item.label}
                  </td>
                  {FRACTIES.map(f => (
                    <td key={f} style={{ padding: '6px 8px', borderBottom: '1px solid var(--rand)', textAlign: 'center', verticalAlign: 'middle' }}>
                      <StemKnop
                        waarde={rij[f] || ''}
                        onChange={(stem) => setHoofdStem(item.key, f, stem)}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--rand)', verticalAlign: 'middle' }}>
                    <input
                      value={notities[item.key] || ''}
                      onChange={e => setNotities(prev => ({ ...prev, [item.key]: e.target.value }))}
                      placeholder="Notitie..."
                      style={{ width: '100%', border: '1px solid var(--rand)', borderRadius: '4px', padding: '4px 6px', fontSize: '12px', outline: 'none', fontFamily: 'Arial' }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StemKnop({ waarde, onChange }: { waarde: Stem; onChange: (s: Stem) => void }) {
  const volgorde: Stem[] = ['', '✅', '🔶', '❌']
  const volgende = volgorde[(volgorde.indexOf(waarde) + 1) % volgorde.length]
  const bg = waarde === '✅' ? '#e8f5ed' : waarde === '❌' ? '#fdf0ef' : waarde === '🔶' ? '#fff8e8' : '#f5f5f5'
  return (
    <button onClick={() => onChange(volgende)}
      style={{ background: bg, border: '1px solid #ddd', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '16px', minWidth: '42px', transition: 'all 0.15s' }}>
      {waarde || '·'}
    </button>
  )
}
