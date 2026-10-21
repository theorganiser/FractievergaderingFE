'use client'

import { useState } from 'react'

interface MailVoorstel {
  uid: number
  van: string
  onderwerp: string
  ontvangen: string
  voorstel: Record<string, string>
}

export default function MailOphalenPaneel({ soort, onToevoegen, knopLabel = '📧 Ophalen uit mail' }: {
  soort: 'events' | 'ingekomen'
  onToevoegen: (velden: Record<string, string>) => void
  knopLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [laden, setLaden] = useState(false)
  const [voorstellen, setVoorstellen] = useState<MailVoorstel[]>([])
  const [bewerkt, setBewerkt] = useState<Record<number, Record<string, string>>>({})
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState<number | null>(null)

  const ophalen = async () => {
    setOpen(true)
    setLaden(true)
    setFout('')
    try {
      const res = await fetch('/api/mail/ophalen', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ soort }),
      })
      const data = await res.json()
      if (data.fout) {
        setFout(data.fout)
      } else {
        setVoorstellen(data.voorstellen)
        const init: Record<number, Record<string, string>> = {}
        data.voorstellen.forEach((v: MailVoorstel) => { init[v.uid] = { ...v.voorstel } })
        setBewerkt(init)
      }
    } catch {
      setFout('Kon de mailbox niet ophalen.')
    }
    setLaden(false)
  }

  const veldWijzig = (uid: number, key: string, waarde: string) => {
    setBewerkt(prev => ({ ...prev, [uid]: { ...prev[uid], [key]: waarde } }))
  }

  const verwerk = async (v: MailVoorstel, toevoegen: boolean) => {
    setBezig(v.uid)
    if (toevoegen) onToevoegen(bewerkt[v.uid] || v.voorstel)
    try {
      await fetch('/api/mail/markeren', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ soort, uid: v.uid }),
      })
    } catch {
      // markeren mislukt is niet fataal — mail duikt dan bij een volgende keer nogmaals op
    }
    setVoorstellen(prev => prev.filter(x => x.uid !== v.uid))
    setBezig(null)
  }

  return (
    <div>
      <button onClick={ophalen} disabled={laden}
        style={{ background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '7px 14px', borderRadius: '7px', cursor: laden ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600' }}>
        {laden ? '⏳ Ophalen...' : knopLabel}
      </button>

      {open && (
        <div style={{ marginTop: '12px', border: '1px solid var(--rand)', borderRadius: '10px', padding: '14px 16px', background: '#fafaf8' }}>
          {fout && <p style={{ fontSize: '13px', color: 'var(--rood)', fontFamily: 'Arial', margin: 0 }}>⚠️ {fout}</p>}
          {!fout && !laden && voorstellen.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', margin: 0 }}>Geen nieuwe mail gevonden.</p>
          )}

          {voorstellen.map(v => (
            <div key={v.uid} style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '8px', padding: '12px 14px', marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', margin: '0 0 8px' }}>
                ✉️ {v.van} — {v.onderwerp}
              </p>

              {soort === 'events' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <input type="date" style={veldStijl} value={bewerkt[v.uid]?.datum || ''} onChange={e => veldWijzig(v.uid, 'datum', e.target.value)} />
                  <input type="time" style={veldStijl} value={bewerkt[v.uid]?.starttijd || ''} onChange={e => veldWijzig(v.uid, 'starttijd', e.target.value)} />
                  <input style={veldStijl} placeholder="Locatie" value={bewerkt[v.uid]?.locatie || ''} onChange={e => veldWijzig(v.uid, 'locatie', e.target.value)} />
                  <select style={veldStijl} value={bewerkt[v.uid]?.categorie || ''} onChange={e => veldWijzig(v.uid, 'categorie', e.target.value)}>
                    <option value="">Geen categorie</option>
                    <option value="belangrijk">🔴 Belangrijk</option>
                    <option value="uitnodiging_regio">🔵 Uitnodigingen regio</option>
                    <option value="overige_uitnodigingen">🟣 Overige uitnodigingen</option>
                  </select>
                  <input style={{ ...veldStijl, gridColumn: '1 / -1' }} placeholder="Omschrijving" value={bewerkt[v.uid]?.omschrijving || ''} onChange={e => veldWijzig(v.uid, 'omschrijving', e.target.value)} />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px', marginBottom: '10px' }}>
                  <input style={veldStijl} placeholder="Afzender" value={bewerkt[v.uid]?.afzender || ''} onChange={e => veldWijzig(v.uid, 'afzender', e.target.value)} />
                  <input style={veldStijl} placeholder="Onderwerp" value={bewerkt[v.uid]?.onderwerp || ''} onChange={e => veldWijzig(v.uid, 'onderwerp', e.target.value)} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => verwerk(v, true)} disabled={bezig === v.uid}
                  style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontFamily: 'Arial', fontWeight: '600', cursor: bezig === v.uid ? 'not-allowed' : 'pointer', opacity: bezig === v.uid ? 0.6 : 1 }}>
                  ✓ Toevoegen
                </button>
                <button onClick={() => verwerk(v, false)} disabled={bezig === v.uid}
                  style={{ background: 'white', color: 'var(--tekst-zacht)', border: '1px solid var(--rand)', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontFamily: 'Arial', cursor: bezig === v.uid ? 'not-allowed' : 'pointer', opacity: bezig === v.uid ? 0.6 : 1 }}>
                  ✕ Negeren
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const veldStijl: React.CSSProperties = {
  padding: '6px 8px', border: '1px solid var(--rand)', borderRadius: '5px', fontSize: '12px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' as const,
}
