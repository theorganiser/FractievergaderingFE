'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const NAAM_SLEUTEL = 'gdp_spreker_naam'

function InloggenFormulier() {
  const searchParams = useSearchParams()
  const terugPad = searchParams.get('terug') || '/'

  const [naam, setNaam] = useState('')
  const [code, setCode] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)
  const [schudden, setSchudden] = useState(false)

  useEffect(() => {
    const bekendNaam = localStorage.getItem(NAAM_SLEUTEL) || ''
    if (bekendNaam) setNaam(bekendNaam)
  }, [])

  const schud = () => { setSchudden(true); setTimeout(() => setSchudden(false), 500) }

  const handleLogin = async () => {
    if (!naam.trim()) { setFout('Vul je naam in.'); schud(); return }
    if (!code.trim()) { setFout('Vul de toegangscode in.'); schud(); return }
    setLaden(true); setFout(null)
    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naam: naam.trim(), code }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setFout(data.fout || 'Inloggen mislukt.')
        schud(); setCode('')
      } else {
        localStorage.setItem(NAAM_SLEUTEL, data.naam || naam.trim())
        window.location.href = terugPad
      }
    } catch {
      setFout('Verbindingsfout. Probeer opnieuw.')
      schud()
    }
    setLaden(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2d0a40 0%, #4a1a5c 50%, #2d0a40 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px 36px', width: '400px', maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animation: schudden ? 'schud 0.4s ease' : 'none' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#4a1a5c', color: '#a89060', fontWeight: '900', fontSize: '22px', width: '60px', height: '60px', borderRadius: '12px', fontFamily: 'Arial Black, Arial', marginBottom: '12px', letterSpacing: '1px' }}>GDP</div>
          <h1 style={{ fontSize: '20px', color: '#4a1a5c', fontWeight: '700', margin: '0 0 4px', fontFamily: 'Arial' }}>Fractie Vergaderagenda</h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0, fontFamily: 'Arial' }}>Goois Democratisch Platform</p>
        </div>

        {/* Naam */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStijl}>Jouw naam</label>
          <input type="text" value={naam} onChange={e => { setNaam(e.target.value); setFout(null) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus={!naam}
            placeholder="Voornaam..."
            style={{ ...invoerStijl, borderColor: fout && !naam.trim() ? '#c0392b' : '#dde3ed' }} />
        </div>

        {/* Code */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStijl}>Toegangscode</label>
          <input type="password" value={code} onChange={e => { setCode(e.target.value); setFout(null) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} autoFocus={!!naam}
            placeholder="Toegangscode..."
            style={{ ...invoerStijl, borderColor: fout && !code.trim() ? '#c0392b' : '#dde3ed' }} />
        </div>

        {/* Foutmelding */}
        {fout && (
          <div style={{ background: '#fdf0ef', border: '1px solid #e8a090', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#c0392b', fontFamily: 'Arial' }}>
            {fout}
          </div>
        )}

        {/* Knop */}
        <button onClick={handleLogin} disabled={laden}
          style={{ width: '100%', background: laden ? '#9a6aac' : '#4a1a5c', color: 'white', border: 'none', padding: '13px', borderRadius: '8px', fontSize: '15px', fontFamily: 'Arial', fontWeight: '600', cursor: laden ? 'not-allowed' : 'pointer' }}>
          {laden ? '⏳ Bezig...' : 'Toegang →'}
        </button>

        <p style={{ fontSize: '11px', color: '#bbb', fontFamily: 'Arial', textAlign: 'center', marginTop: '16px' }}>
          Neem contact op met de fractie voor de toegangscode.
        </p>
      </div>
      <style>{`@keyframes schud { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }`}</style>
    </div>
  )
}

export default function InloggenPagina() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#2d0a40' }} />}>
      <InloggenFormulier />
    </Suspense>
  )
}

const labelStijl: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#666', fontFamily: 'Arial', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }
const invoerStijl: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '2px solid #dde3ed', borderRadius: '8px', fontSize: '15px', fontFamily: 'Arial', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' as const }
