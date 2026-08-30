'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { getSprekerNaam } from '../../components/Toegangspoort'

type Stap = 1 | 2 | 3

interface Resultaat {
  website?: string
  linkedin?: string
  facebook?: string
  feedback?: string
}

export default function PersberichtenPagina() {
  const { isAdmin, geladen: authGeladen } = useAuth()
  const [stap, setStap] = useState<Stap>(1)
  const [rawTekst, setRawTekst] = useState('')       // stap 1 input
  const [nieuwsArtikel, setNieuwsArtikel] = useState('') // stap 2 bewerking
  const [laden, setLaden] = useState(false)
  const [resultaat, setResultaat] = useState<Resultaat | null>(null)
  const [fout, setFout] = useState('')
  const [gekopieerd, setGekopieerd] = useState<string | null>(null)
  const [toonInstellingen, setToonInstellingen] = useState(false)
  const [systeemPrompt, setSysteemPrompt] = useState('')
  const [promptOpslaan, setPromptOpslaan] = useState(false)

  useEffect(() => {
    if (isAdmin) laadSysteemPrompt()
  }, [isAdmin])

  const laadSysteemPrompt = async () => {
    const { data } = await supabase.from('persbericht_instructies').select('systeem_prompt').limit(1).single()
    if (data) setSysteemPrompt(data.systeem_prompt)
  }

  const slaPromptOp = async () => {
    setPromptOpslaan(true)
    await supabase.from('persbericht_instructies').update({
      systeem_prompt: systeemPrompt,
      bijgewerkt_op: new Date().toISOString(),
      bijgewerkt_door: getSprekerNaam() || 'Beheerder',
    }).neq('id', '00000000-0000-0000-0000-000000000000')
    setPromptOpslaan(false)
    setToonInstellingen(false)
  }

  const roepAIAan = async (modus: string, tekst: string) => {
    setLaden(true)
    setFout('')
    setResultaat(null)
    try {
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tekst, modus }),
      })
      const data = await resp.json()
      if (!resp.ok || data.fout) {
        setFout(data.fout || 'Er ging iets mis.')
      } else {
        setResultaat(data)
        // Na stap 1: zet nieuws artikel klaar voor bewerking
        if (modus === 'genereer' && data.website) {
          setNieuwsArtikel(data.website)
        }
      }
    } catch {
      setFout('Verbindingsfout. Probeer opnieuw.')
    }
    setLaden(false)
  }

  const kopieer = (platform: string, inhoud: string) => {
    navigator.clipboard.writeText(inhoud).then(() => {
      setGekopieerd(platform)
      setTimeout(() => setGekopieerd(null), 2000)
    })
  }

  const gaNaarStap2 = () => {
    setStap(2)
    setResultaat(null)
  }

  const gaNaarStap3 = () => {
    setStap(3)
    setResultaat(null)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>✍️ Persberichten</h1>
          <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', margin: '2px 0 0', fontFamily: 'Arial' }}>Goois Democratisch Platform — Gooise Meren</p>
        </div>
        {authGeladen && isAdmin && (
          <button onClick={() => setToonInstellingen(!toonInstellingen)}
            style={{ background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}>
            ⚙️ Instructies aanpassen
          </button>
        )}
      </div>

      <div style={{ height: '2px', background: 'linear-gradient(to right, var(--blauw), #a89060, transparent)', margin: '12px 0 20px' }} />

      {/* Instructies aanpassen */}
      {toonInstellingen && isAdmin && (
        <div style={{ background: 'white', border: '2px solid var(--blauw)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--blauw)', fontFamily: 'Arial', fontWeight: '600', margin: '0 0 12px' }}>⚙️ AI Instructies (systeem prompt)</h3>
          <textarea rows={8} value={systeemPrompt} onChange={e => setSysteemPrompt(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '13px', fontFamily: 'Arial', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button onClick={slaPromptOp} disabled={promptOpslaan}
              style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600' }}>
              {promptOpslaan ? '⏳ Opslaan...' : '✓ Opslaan'}
            </button>
            <button onClick={() => setToonInstellingen(false)}
              style={{ background: 'white', color: 'var(--tekst-zacht)', border: '1px solid var(--rand)', padding: '8px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial' }}>
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Stappen indicator */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', background: '#f5f0fa', borderRadius: '10px', padding: '4px', border: '1px solid #e0d0f0' }}>
        {([
          { nr: 1, label: '1. Ruwe tekst → Artikel' },
          { nr: 2, label: '2. Artikel bewerken + tips' },
          { nr: 3, label: '3. Sociale media posts' },
        ] as { nr: Stap; label: string }[]).map(s => (
          <button key={s.nr} onClick={() => { if (s.nr <= stap || (s.nr === 2 && nieuwsArtikel) || (s.nr === 3 && nieuwsArtikel)) setStap(s.nr) }}
            style={{ flex: 1, padding: '10px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', fontWeight: stap === s.nr ? '700' : '400', background: stap === s.nr ? '#4a1a5c' : 'transparent', color: stap === s.nr ? 'white' : stap > s.nr ? '#2d7a4f' : 'var(--tekst-zacht)', transition: 'all 0.15s', textAlign: 'center' as const }}>
            {stap > s.nr ? '✓ ' : ''}{s.label}
          </button>
        ))}
      </div>

      {/* STAP 1 */}
      {stap === 1 && (
        <div>
          <div style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ruwe tekst / bron informatie
            </label>
            <textarea rows={8} value={rawTekst} onChange={e => setRawTekst(e.target.value)}
              placeholder="Plak hier je ruwe tekst, notities, besluit of bronmateriaal..."
              style={{ width: '100%', padding: '12px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const, lineHeight: 1.6 }} />
            {fout && <div style={{ background: '#fdf0ef', border: '1px solid #e8a090', borderRadius: '6px', padding: '10px 14px', marginTop: '10px', fontSize: '13px', color: '#c0392b', fontFamily: 'Arial' }}>⚠️ {fout}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button onClick={() => roepAIAan('genereer', rawTekst)} disabled={laden || !rawTekst.trim()}
                style={{ background: laden ? '#9a7aac' : 'var(--blauw)', color: 'white', border: 'none', padding: '11px 24px', borderRadius: '8px', cursor: (laden || !rawTekst.trim()) ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'Arial', fontWeight: '600', opacity: !rawTekst.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {laden ? '⏳ Genereren...' : '✨ Genereer nieuwsartikel'}
              </button>
            </div>
          </div>

          {resultaat?.website && (
            <div style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#f5eeff', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e0d0f0' }}>
                <span style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: '700', color: '#4a1a5c' }}>🌐 Gegenereerd nieuwsartikel</span>
                <button onClick={() => kopieer('artikel', resultaat.website!)}
                  style={{ background: gekopieerd === 'artikel' ? '#2d7a4f' : '#4a1a5c', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}>
                  {gekopieerd === 'artikel' ? '✓ Gekopieerd!' : '📋 Kopieer'}
                </button>
              </div>
              <div style={{ padding: '16px', fontSize: '14px', fontFamily: 'Arial', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, maxHeight: '300px', overflowY: 'auto' }}>
                {resultaat.website}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #f0ede8', background: '#fafaf8', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={gaNaarStap2}
                  style={{ background: '#4a1a5c', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Arial', fontWeight: '600' }}>
                  Ga naar stap 2: Artikel bewerken →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAP 2 */}
      {stap === 2 && (
        <div>
          <div style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Nieuwsartikel bewerken
            </label>
            <textarea rows={12} value={nieuwsArtikel} onChange={e => setNieuwsArtikel(e.target.value)}
              placeholder="Plak of bewerk hier je nieuwsartikel..."
              style={{ width: '100%', padding: '12px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const, lineHeight: 1.6 }} />
            {fout && <div style={{ background: '#fdf0ef', border: '1px solid #e8a090', borderRadius: '6px', padding: '10px 14px', marginTop: '10px', fontSize: '13px', color: '#c0392b', fontFamily: 'Arial' }}>⚠️ {fout}</div>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => roepAIAan('feedback', nieuwsArtikel)} disabled={laden || !nieuwsArtikel.trim()}
                style={{ background: laden ? '#888' : 'white', color: '#4a1a5c', border: '2px solid #4a1a5c', padding: '10px 20px', borderRadius: '8px', cursor: (laden || !nieuwsArtikel.trim()) ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600', opacity: !nieuwsArtikel.trim() ? 0.5 : 1 }}>
                {laden ? '⏳ Bezig...' : '💡 Vraag tips & feedback'}
              </button>
              <button onClick={gaNaarStap3} disabled={!nieuwsArtikel.trim()}
                style={{ background: '#4a1a5c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: !nieuwsArtikel.trim() ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600', opacity: !nieuwsArtikel.trim() ? 0.5 : 1 }}>
                Tekst is akkoord → Ga naar stap 3
              </button>
            </div>
          </div>

          {resultaat?.feedback && (
            <div style={{ background: '#fffdf0', border: '2px solid #e8c84a', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', color: '#7a5000', fontFamily: 'Arial', fontWeight: '700', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💡 Tips & opmerkingen
              </h3>
              <div style={{ fontSize: '14px', fontFamily: 'Arial', lineHeight: 1.7, color: '#3a2000', whiteSpace: 'pre-wrap' as const }}>
                {resultaat.feedback}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAP 3 */}
      {stap === 3 && (
        <div>
          <div style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ background: '#e8f5ed', border: '1px solid #a8d8b5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#1a5c2a', fontFamily: 'Arial' }}>
              ✓ Goedgekeurde tekst staat klaar. Claude maakt nu Facebook- en LinkedIn-berichten op basis van jouw artikel.
            </div>
            <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '10px 12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '13px', fontFamily: 'Arial', color: '#666', lineHeight: 1.5, whiteSpace: 'pre-wrap' as const, marginBottom: '16px' }}>
              {nieuwsArtikel.substring(0, 400)}{nieuwsArtikel.length > 400 ? '...' : ''}
            </div>
            {fout && <div style={{ background: '#fdf0ef', border: '1px solid #e8a090', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#c0392b', fontFamily: 'Arial' }}>⚠️ {fout}</div>}
            <button onClick={() => roepAIAan('sociaal', nieuwsArtikel)} disabled={laden}
              style={{ background: laden ? '#9a7aac' : 'var(--blauw)', color: 'white', border: 'none', padding: '11px 24px', borderRadius: '8px', cursor: laden ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'Arial', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {laden ? '⏳ Genereren...' : '📱 Maak sociale media berichten'}
            </button>
          </div>

          {resultaat?.linkedin && resultaat?.facebook && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <SociaalKaart platform="LinkedIn" emoji="💼" kleur="#0a66c2" bg="#e8f0f8" rand="#a0c0e0"
                inhoud={resultaat.linkedin} gekopieerd={gekopieerd === 'linkedin'} onKopieer={() => kopieer('linkedin', resultaat.linkedin!)} />
              <SociaalKaart platform="Facebook" emoji="👥" kleur="#1877f2" bg="#e8f0ff" rand="#a0c0e0"
                inhoud={resultaat.facebook} gekopieerd={gekopieerd === 'facebook'} onKopieer={() => kopieer('facebook', resultaat.facebook!)} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SociaalKaart({ platform, emoji, kleur, bg, rand, inhoud, gekopieerd, onKopieer }: {
  platform: string; emoji: string; kleur: string; bg: string; rand: string
  inhoud: string; gekopieerd: boolean; onKopieer: () => void
}) {
  return (
    <div style={{ background: 'white', border: `1px solid ${rand}`, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: bg, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${rand}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{emoji}</span>
          <span style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: '700', color: kleur }}>{platform}</span>
        </div>
        <button onClick={onKopieer}
          style={{ background: gekopieerd ? '#2d7a4f' : kleur, color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', fontWeight: '600' }}>
          {gekopieerd ? '✓ Gekopieerd!' : '📋 Kopieer'}
        </button>
      </div>
      <div style={{ padding: '16px', flex: 1, fontSize: '13px', fontFamily: 'Arial', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, maxHeight: '350px', overflowY: 'auto' }}>
        {inhoud}
      </div>
      <div style={{ padding: '8px 16px', borderTop: `1px solid ${rand}`, background: bg, fontSize: '11px', color: '#888', fontFamily: 'Arial' }}>
        {inhoud.split(/\s+/).length} woorden
      </div>
    </div>
  )
}
