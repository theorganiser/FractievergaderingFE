'use client'

import { useState } from 'react'
import { Subpunt } from '@/lib/types'

interface IngekomenStukkenInvoerProps {
  subpunten: Subpunt[]
  onVoegToe: (subpunt: Omit<Subpunt, 'id'>) => void
  onVerwijder: (index: number) => void
  onUpdate: (index: number, wijzigingen: Partial<Subpunt>) => void
}

export default function IngekomenStukkenInvoer({ subpunten, onVoegToe, onVerwijder, onUpdate }: IngekomenStukkenInvoerProps) {
  const [modus, setModus] = useState<'velden' | 'plakken'>('velden')
  const [afzender, setAfzender] = useState('')
  const [onderwerp, setOnderwerp] = useState('')
  const [plakTekst, setPlakTekst] = useState('')
  const [plakFout, setPlakFout] = useState('')

  const voegToeViaVelden = () => {
    if (!onderwerp.trim()) return
    const titel = afzender.trim()
      ? `${afzender.trim()} — ${onderwerp.trim()}`
      : onderwerp.trim()
    onVoegToe({ titel, url: '', afgedaan: false })
    setAfzender('')
    setOnderwerp('')
  }

  const voegToeviaPlakken = () => {
    setPlakFout('')
    const tekst = plakTekst.trim()
    if (!tekst) return

    // Probeer te splitsen op veelvoorkomende e-mailpatronen
    // "Van: Naam <email> | Onderwerp: tekst"
    // "From: naam | Subject: tekst"
    // "Afzender: naam | Onderwerp: tekst"
    // of gewoon "naam - onderwerp"

    let gevondenAfzender = ''
    let gevondenOnderwerp = ''

    // Patroon 1: Van:/From:/Afzender: + Onderwerp:/Subject:
    const vanMatch = tekst.match(/(?:Van|From|Afzender)[:\s]+([^\n|;]+)/i)
    const onderwerpMatch = tekst.match(/(?:Onderwerp|Subject)[:\s]+([^\n|;]+)/i)

    if (onderwerpMatch) {
      gevondenOnderwerp = onderwerpMatch[1].trim()
      if (vanMatch) {
        // Haal naam uit "Naam <email@domain.nl>"
        gevondenAfzender = vanMatch[1].replace(/<[^>]+>/g, '').trim()
      }
    } else if (tekst.includes(' - ') || tekst.includes(' — ')) {
      // Patroon 2: "Naam - Onderwerp" of "Naam — Onderwerp"
      const delen = tekst.split(/\s[—-]\s/, 2)
      if (delen.length === 2) {
        gevondenAfzender = delen[0].trim()
        gevondenOnderwerp = delen[1].trim()
      }
    } else {
      // Geen patroon herkend: gebruik hele tekst als onderwerp
      gevondenOnderwerp = tekst
    }

    if (!gevondenOnderwerp) {
      setPlakFout('Kon het onderwerp niet herkennen. Controleer de tekst of gebruik de velden.')
      return
    }

    const titel = gevondenAfzender
      ? `${gevondenAfzender} — ${gevondenOnderwerp}`
      : gevondenOnderwerp

    onVoegToe({ titel, url: '', afgedaan: false })
    setPlakTekst('')
  }

  return (
    <div>
      {/* Huidige subpunten */}
      {subpunten.map((sub, si) => (
        <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #f0ede8' }}>
          <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontStyle: 'italic', minWidth: '18px', fontFamily: 'Arial' }}>
            {String.fromCharCode(97 + si)}.
          </span>
          <input
            style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--rand)', borderRadius: '5px', fontSize: '13px', fontFamily: 'Arial', outline: 'none' }}
            value={sub.titel}
            onChange={e => onUpdate(si, { titel: e.target.value })}
          />
          <button onClick={() => onVerwijder(si)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '16px', padding: '0 4px' }}>✕</button>
        </div>
      ))}

      {/* Invoermodus kiezen */}
      <div style={{ marginTop: '12px', border: '1px solid var(--rand)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--rand)' }}>
          <button onClick={() => setModus('velden')} style={{ flex: 1, padding: '8px', fontSize: '12px', fontFamily: 'Arial', border: 'none', cursor: 'pointer', background: modus === 'velden' ? '#f5eeff' : 'white', color: modus === 'velden' ? '#4a1a5c' : 'var(--tekst-zacht)', fontWeight: modus === 'velden' ? '600' : 'normal' }}>
            ✏️ Handmatig invoeren
          </button>
          <button onClick={() => setModus('plakken')} style={{ flex: 1, padding: '8px', fontSize: '12px', fontFamily: 'Arial', border: 'none', borderLeft: '1px solid var(--rand)', cursor: 'pointer', background: modus === 'plakken' ? '#f5eeff' : 'white', color: modus === 'plakken' ? '#4a1a5c' : 'var(--tekst-zacht)', fontWeight: modus === 'plakken' ? '600' : 'normal' }}>
            📋 Plak vanuit e-mail
          </button>
        </div>

        <div style={{ padding: '12px' }}>
          {modus === 'velden' ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                style={invoerStijl}
                value={afzender}
                onChange={e => setAfzender(e.target.value)}
                placeholder="Afzender (optioneel)"
                onKeyDown={e => e.key === 'Enter' && voegToeViaVelden()}
              />
              <input
                style={{ ...invoerStijl, flex: 2 }}
                value={onderwerp}
                onChange={e => setOnderwerp(e.target.value)}
                placeholder="Onderwerp *"
                onKeyDown={e => e.key === 'Enter' && voegToeViaVelden()}
              />
              <button onClick={voegToeViaVelden} disabled={!onderwerp.trim()} style={toevoegKnop}>
                + Toevoegen
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '8px', margin: '0 0 8px' }}>
                Kopieer de onderwerpregel of "Van + Onderwerp" uit je e-mail en plak die hieronder:
              </p>
              <textarea
                rows={3}
                style={{ ...invoerStijl, width: '100%', resize: 'vertical', fontFamily: 'Arial', fontSize: '13px' }}
                value={plakTekst}
                onChange={e => { setPlakTekst(e.target.value); setPlakFout('') }}
                placeholder={`Voorbeelden:\n"Van: Jan Jansen | Onderwerp: Vraag over begroting"\n"Gemeente Naarden — Uitnodiging raadsvergadering"`}
              />
              {plakFout && <p style={{ fontSize: '12px', color: 'var(--rood)', fontFamily: 'Arial', margin: '4px 0 0' }}>{plakFout}</p>}
              <button onClick={voegToeviaPlakken} disabled={!plakTekst.trim()} style={{ ...toevoegKnop, marginTop: '8px' }}>
                📋 Verwerk en toevoegen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const invoerStijl: React.CSSProperties = {
  flex: 1, padding: '8px 10px', border: '1px solid var(--rand)',
  borderRadius: '6px', fontSize: '13px', outline: 'none', minWidth: '120px',
}

const toevoegKnop: React.CSSProperties = {
  background: '#4a1a5c', color: 'white', border: 'none',
  padding: '8px 14px', borderRadius: '6px', cursor: 'pointer',
  fontSize: '13px', fontFamily: 'Arial', fontWeight: '600',
  opacity: 1, whiteSpace: 'nowrap',
}
