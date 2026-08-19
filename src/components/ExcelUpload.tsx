'use client'

import { useState, useRef } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://datascraperraad.onrender.com'

interface UploadResultaat {
  totaal: number
  nieuw: number
  bijgewerkt: number
  bestandsnaam: string
}

interface Sectie {
  type: 'raadsmededelingen' | 'technische_vragen' | 'schriftelijke_vragen'
  label: string
  beschrijving: string
  downloadUrl: string
  downloadNaam: string
  kleur: string
  bg: string
  rand: string
  emoji: string
}

const SECTIES: Sectie[] = [
  {
    type: 'raadsmededelingen',
    label: 'Raadsmededelingen',
    beschrijving: 'Raadsmededelingen 2026 van gemeente Gooise Meren',
    downloadUrl: 'https://bestuur.gooisemeren.nl/Documenten/Raadsmededelingen/2026/?format=excel',
    downloadNaam: 'Raadsmededelingen_2026.xlsx',
    kleur: '#4a1a5c', bg: '#f5eeff', rand: '#c0a0d8', emoji: '📋',
  },
  {
    type: 'technische_vragen',
    label: 'Technische vragen',
    beschrijving: 'Technische vragen gesorteerd op ingediend (aflopend)',
    downloadUrl: 'https://bestuur.gooisemeren.nl/documenten/technische-vragen/?sorteren=ingediend_aflopend&pagina=1&format=excel',
    downloadNaam: 'Technische_vragen.xlsx',
    kleur: '#1a4a7a', bg: '#e8f0f8', rand: '#a0c0e0', emoji: '❓',
  },
  {
    type: 'schriftelijke_vragen',
    label: 'Schriftelijke vragen',
    beschrijving: 'Schriftelijke vragen gesorteerd op ingediend (aflopend)',
    downloadUrl: 'https://bestuur.gooisemeren.nl/documenten/schriftelijke-vragen/?sorteren=ingediend_aflopend&pagina=1&format=excel',
    downloadNaam: 'Schriftelijke_vragen.xlsx',
    kleur: '#5a1a8a', bg: '#f0e8f8', rand: '#c0a0e0', emoji: '✉️',
  },
]

export default function ExcelUpload() {
  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '20px', lineHeight: 1.6 }}>
        Download het Excel-bestand van de gemeente website en upload het hier om de documenten bij te werken.
        <strong> Stap 1: Download → Stap 2: Kies bestand → Stap 3: Uploaden</strong>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {SECTIES.map(s => <UploadSectie key={s.type} sectie={s} />)}
      </div>
    </div>
  )
}

function UploadSectie({ sectie }: { sectie: Sectie }) {
  const [bestand, setBestand] = useState<File | null>(null)
  const [uploaden, setUploaden] = useState(false)
  const [resultaat, setResultaat] = useState<UploadResultaat | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleBestand = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBestand(e.target.files?.[0] || null)
    setResultaat(null)
    setFout(null)
  }

  const handleUpload = async () => {
    if (!bestand) return
    setUploaden(true)
    setFout(null)
    setResultaat(null)
    try {
      const form = new FormData()
      form.append('bestand', bestand)
      form.append('type', sectie.type)
      const resp = await fetch(`${API_URL}/upload/excel`, { method: 'POST', body: form })
      const data = await resp.json()
      if (!resp.ok) {
        setFout(data.detail || data.fout || data.error || `Fout ${resp.status}`)
      } else {
        setResultaat(data)
        setBestand(null)
        if (inputRef.current) inputRef.current.value = ''
      }
    } catch {
      setFout('Verbindingsfout — controleer of de backend bereikbaar is.')
    }
    setUploaden(false)
  }

  return (
    <div style={{ border: `1px solid ${sectie.rand}`, borderRadius: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: sectie.bg, padding: '14px 18px', borderBottom: `1px solid ${sectie.rand}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '20px' }}>{sectie.emoji}</span>
        <div>
          <div style={{ fontSize: '15px', fontFamily: 'Arial', fontWeight: '700', color: sectie.kleur }}>{sectie.label}</div>
          <div style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginTop: '1px' }}>{sectie.beschrijving}</div>
        </div>
      </div>

      {/* Stappen */}
      <div style={{ padding: '16px 18px', background: 'white' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Stap 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={stapLabel}>Stap 1 — Download Excel</span>
            <a href={sectie.downloadUrl} download={sectie.downloadNaam} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', color: sectie.kleur, border: `1.5px solid ${sectie.kleur}`, padding: '8px 14px', borderRadius: '7px', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600', textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
              ⬇ Download Excel
            </a>
          </div>

          <span style={{ fontSize: '18px', color: '#ccc', paddingBottom: '8px' }}>→</span>

          {/* Stap 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={stapLabel}>Stap 2 — Kies bestand</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleBestand}
                style={{ display: 'none' }} id={`file-${sectie.type}`} />
              <label htmlFor={`file-${sectie.type}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', color: 'var(--tekst-zacht)', border: '1.5px solid #ddd', padding: '8px 14px', borderRadius: '7px', fontSize: '13px', fontFamily: 'Arial', cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                📂 Kies bestand
              </label>
              {bestand && (
                <span style={{ fontSize: '12px', color: '#2d7a4f', fontFamily: 'Arial', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  ✓ {bestand.name}
                </span>
              )}
            </div>
          </div>

          <span style={{ fontSize: '18px', color: '#ccc', paddingBottom: '8px' }}>→</span>

          {/* Stap 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={stapLabel}>Stap 3 — Uploaden</span>
            <button onClick={handleUpload} disabled={!bestand || uploaden}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: bestand && !uploaden ? sectie.kleur : '#ccc', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600', cursor: bestand && !uploaden ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' as const }}>
              {uploaden ? <><Spinner /> Uploaden...</> : '↑ Uploaden'}
            </button>
          </div>
        </div>

        {/* Resultaat */}
        {resultaat && (
          <div style={{ marginTop: '14px', background: '#e8f5ed', border: '1px solid #a8d8b5', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', fontFamily: 'Arial', color: '#1a5c2a' }}>
            <div style={{ fontWeight: '700', marginBottom: '6px' }}>✓ {resultaat.bestandsnaam} verwerkt</div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span>📄 <strong>{resultaat.totaal}</strong> documenten totaal</span>
              <span>🆕 <strong>{resultaat.nieuw}</strong> nieuw</span>
              <span>✏️ <strong>{resultaat.bijgewerkt}</strong> bijgewerkt</span>
            </div>
          </div>
        )}

        {/* Fout */}
        {fout && (
          <div style={{ marginTop: '14px', background: '#fdf0ef', border: '1px solid #e8a090', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', fontFamily: 'Arial', color: '#c0392b' }}>
            ⚠️ {fout}
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}

const stapLabel: React.CSSProperties = {
  fontSize: '10px', color: 'var(--tekst-zacht)', fontFamily: 'Arial',
  textTransform: 'uppercase', letterSpacing: '0.5px',
}
