'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { getSprekerNaam } from '@/components/Toegangspoort'

interface Persbericht {
  id: string
  gebruiker_naam: string
  ruwe_tekst: string
  website_tekst: string
  linkedin_tekst: string
  facebook_tekst: string
  aangemaakt_op: string
}

interface Resultaat {
  website: string
  linkedin: string
  facebook: string
}

export default function PersberichtenPagina() {
  const { isAdmin, geladen: authGeladen } = useAuth()
  const [tekst, setTekst] = useState('')
  const [laden, setLaden] = useState(false)
  const [resultaat, setResultaat] = useState<Resultaat | null>(null)
  const [fout, setFout] = useState('')
  const [geschiedenis, setGeschiedenis] = useState<Persbericht[]>([])
  const [geselecteerd, setGeselecteerd] = useState<Persbericht | null>(null)

  // Beheerder instellingen
  const [toonInstellingen, setToonInstellingen] = useState(false)
  const [systeemPrompt, setSysteemPrompt] = useState('')
  const [promptOpslaan, setPromptOpslaan] = useState(false)

  // Kopieer feedback
  const [gekopieerd, setGekopieerd] = useState<string | null>(null)

  useEffect(() => {
    laadGeschiedenis()
    if (isAdmin) laadSysteemPrompt()
  }, [isAdmin])

  const laadGeschiedenis = async () => {
    // Verwijder items ouder dan 7 dagen
    const zevenDagenGeleden = new Date()
    zevenDagenGeleden.setDate(zevenDagenGeleden.getDate() - 7)
    await supabase.from('persberichten_geschiedenis')
      .delete()
      .lt('aangemaakt_op', zevenDagenGeleden.toISOString())

    const { data } = await supabase
      .from('persberichten_geschiedenis')
      .select('*')
      .order('aangemaakt_op', { ascending: false })
      .limit(20)
    setGeschiedenis(data || [])
  }

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

  const genereer = async () => {
    if (!tekst.trim()) return
    setLaden(true)
    setFout('')
    setResultaat(null)
    setGeselecteerd(null)

    try {
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tekst }),
      })
      const data = await resp.json()
      if (!resp.ok || data.fout) {
        setFout(data.fout || 'Er ging iets mis.')
        return
      }

      setResultaat(data)

      // Sla op in Supabase
      const { data: opgeslagen } = await supabase.from('persberichten_geschiedenis').insert({
        gebruiker_naam: getSprekerNaam() || 'Onbekend',
        ruwe_tekst: tekst,
        website_tekst: data.website,
        linkedin_tekst: data.linkedin,
        facebook_tekst: data.facebook,
      }).select().single()

      if (opgeslagen) setGeschiedenis(prev => [opgeslagen, ...prev].slice(0, 20))
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

  const huidigResultaat: Resultaat | null = geselecteerd
    ? { website: geselecteerd.website_tekst, linkedin: geselecteerd.linkedin_tekst, facebook: geselecteerd.facebook_tekst }
    : resultaat

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>✍️ Persberichten</h1>
          <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', margin: '2px 0 0', fontFamily: 'Arial' }}>
            Goois Democratisch Platform — Gooise Meren
          </p>
        </div>
        {authGeladen && isAdmin && (
          <button onClick={() => setToonInstellingen(!toonInstellingen)}
            style={{ background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}>
            ⚙️ Instructies aanpassen
          </button>
        )}
      </div>

      <div style={{ height: '2px', background: 'linear-gradient(to right, var(--blauw), #a89060, transparent)', margin: '12px 0 20px' }} />

      <p style={{ fontSize: '14px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '20px', lineHeight: 1.6 }}>
        Hier kun je ruwe teksten omzetten naar persberichten vanuit het perspectief van <strong>GDP – Goois Democratisch Platform</strong>. De tekst wordt automatisch aangepast voor verschillende platforms.
      </p>

      {/* Beheerder instellingen */}
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

      {/* Invoer */}
      <div style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Ruwe tekst / bron informatie
        </label>
        <textarea rows={8} value={tekst} onChange={e => setTekst(e.target.value)}
          placeholder="Plak hier je ruwe tekst, notities, besluit of persbericht bron..."
          style={{ width: '100%', padding: '12px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const, lineHeight: 1.6 }} />
        {fout && (
          <div style={{ background: '#fdf0ef', border: '1px solid #e8a090', borderRadius: '6px', padding: '10px 14px', marginTop: '10px', fontSize: '13px', color: '#c0392b', fontFamily: 'Arial' }}>
            ⚠️ {fout}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center' }}>
          <button onClick={genereer} disabled={laden || !tekst.trim()}
            style={{ background: laden ? '#9a7aac' : 'var(--blauw)', color: 'white', border: 'none', padding: '11px 24px', borderRadius: '8px', cursor: (laden || !tekst.trim()) ? 'not-allowed' : 'pointer', fontSize: '14px', fontFamily: 'Arial', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', opacity: !tekst.trim() ? 0.5 : 1 }}>
            {laden ? <><Spinner /> Genereren...</> : '✨ Genereer persberichten'}
          </button>
          {tekst && <button onClick={() => { setTekst(''); setResultaat(null); setFout('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '13px', fontFamily: 'Arial' }}>
            Wissen
          </button>}
        </div>
      </div>

      {/* Resultaten */}
      {huidigResultaat && (
        <div>
          <h2 style={{ fontSize: '16px', color: 'var(--blauw)', fontFamily: 'Arial', fontWeight: '600', marginBottom: '16px' }}>
            {geselecteerd ? `📁 Eerder gegenereerd — ${new Date(geselecteerd.aangemaakt_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` : '✨ Gegenereerde versies'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <PersberichtKaart
              platform="Website" emoji="🌐"
              kleur="#4a1a5c" bg="#f5eeff" rand="#c0a0d8"
              inhoud={huidigResultaat.website}
              gekopieerd={gekopieerd === 'website'}
              onKopieer={() => kopieer('website', huidigResultaat.website)} />
            <PersberichtKaart
              platform="LinkedIn" emoji="💼"
              kleur="#0a66c2" bg="#e8f0f8" rand="#a0c0e0"
              inhoud={huidigResultaat.linkedin}
              gekopieerd={gekopieerd === 'linkedin'}
              onKopieer={() => kopieer('linkedin', huidigResultaat.linkedin)} />
            <PersberichtKaart
              platform="Facebook" emoji="👥"
              kleur="#1877f2" bg="#e8f0ff" rand="#a0c0e0"
              inhoud={huidigResultaat.facebook}
              gekopieerd={gekopieerd === 'facebook'}
              onKopieer={() => kopieer('facebook', huidigResultaat.facebook)} />
          </div>
        </div>
      )}

      {/* Geschiedenis */}
      {geschiedenis.length > 0 && (
        <div>
          <h2 style={{ fontSize: '16px', color: 'var(--blauw)', fontFamily: 'Arial', fontWeight: '600', marginBottom: '12px' }}>
            📁 Recente persberichten <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontWeight: 'normal' }}>(bewaard 7 dagen)</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {geschiedenis.map(item => (
              <button key={item.id}
                onClick={() => { setGeselecteerd(geselecteerd?.id === item.id ? null : item); setResultaat(null) }}
                style={{ background: geselecteerd?.id === item.id ? '#f5eeff' : 'white', border: `1px solid ${geselecteerd?.id === item.id ? '#c0a0d8' : 'var(--rand)'}`, borderRadius: '8px', padding: '12px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.15s' }}>
                <span style={{ fontSize: '20px' }}>📄</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontFamily: 'Arial', color: 'var(--tekst)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {item.ruwe_tekst.substring(0, 80)}{item.ruwe_tekst.length > 80 ? '...' : ''}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginTop: '2px' }}>
                    {item.gebruiker_naam} · {new Date(item.aangemaakt_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', flexShrink: 0 }}>
                  {geselecteerd?.id === item.id ? '▾ Verberg' : '▸ Bekijken'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PersberichtKaart({ platform, emoji, kleur, bg, rand, inhoud, gekopieerd, onKopieer }: {
  platform: string; emoji: string; kleur: string; bg: string; rand: string
  inhoud: string; gekopieerd: boolean; onKopieer: () => void
}) {
  return (
    <div style={{ background: 'white', border: `1px solid ${rand}`, borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: bg, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${rand}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{emoji}</span>
          <span style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: '700', color: kleur }}>{platform}</span>
        </div>
        <button onClick={onKopieer}
          style={{ background: gekopieerd ? '#2d7a4f' : kleur, color: 'white', border: 'none', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', fontWeight: '600', transition: 'background 0.2s' }}>
          {gekopieerd ? '✓ Gekopieerd!' : '📋 Kopieer'}
        </button>
      </div>
      {/* Inhoud */}
      <div style={{ padding: '16px', flex: 1, fontSize: '13px', fontFamily: 'Arial', lineHeight: 1.7, color: 'var(--tekst)', whiteSpace: 'pre-wrap' as const, maxHeight: '400px', overflowY: 'auto' }}>
        {inhoud}
      </div>
      {/* Footer */}
      <div style={{ padding: '8px 16px', borderTop: `1px solid ${rand}`, background: bg, fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
        {inhoud.split(/\s+/).length} woorden
      </div>
    </div>
  )
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}
