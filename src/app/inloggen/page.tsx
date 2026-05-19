'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const NAAM_SLEUTEL = 'gdp_spreker_naam'

function InloggenFormulier() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get('admin') === '1'
  const terugPad = searchParams.get('terug') || '/'

  const [naam, setNaam] = useState('')
  const [code, setCode] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [laden, setLaden] = useState(false)
  const [schudden, setSchudden] = useState(false)

  useEffect(() => {
    // Naam alvast invullen vanuit localStorage
    const bekendNaam = localStorage.getItem(NAAM_SLEUTEL) || ''
    if (bekendNaam) setNaam(bekendNaam)
  }, [])

  const handleLogin = async () => {
    if (!isAdmin && !naam.trim()) {
      setFout('Vul je naam in.')
      schud()
      return
    }

    setLaden(true)
    setFout(null)

    try {
      const endpoint = isAdmin ? '/api/admin-login' : '/api/login'
      const body = isAdmin
        ? { wachtwoord: code, naam: naam.trim() || 'Beheerder' }
        : { naam: naam.trim(), code }

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await resp.json()

      if (!resp.ok) {
        setFout(data.fout || 'Inloggen mislukt.')
        schud()
        setCode('')
      } else {
        // Naam opslaan in localStorage
        if (naam.trim()) localStorage.setItem(NAAM_SLEUTEL, naam.trim())
        // Gebruik window.location voor volledige browser navigatie
        // zodat de cookie zeker wordt meegestuurd naar middleware
        window.location.href = terugPad
      }
    } catch {
      setFout('Verbindingsfout. Probeer opnieuw.')
      schud()
    }

    setLaden(false)
  }

  const schud = () => {
    setSchudden(true)
    setTimeout(() => setSchudden(false), 500)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2d0a40 0%, #4a1a5c 50%, #2d0a40 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '40px 36px',
        width: '400px', maxWidth: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        animation: schudden ? 'schud 0.4s ease' : 'none',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: '#4a1a5c', color: '#a89060', fontWeight: '900', fontSize: '22px',
            width: '60px', height: '60px', borderRadius: '12px',
            fontFamily: 'Arial Black, Arial', marginBottom: '12px', letterSpacing: '1px',
          }}>GDP</div>
          <h1 style={{ fontSize: '20px', color: '#4a1a5c', fontWeight: '700', margin: '0 0 4px', fontFamily: 'Arial' }}>
            Fractie Vergaderagenda
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0, fontFamily: 'Arial' }}>
            Goois Democratisch Platform
          </p>
        </div>

        {/* Naam veld — alleen voor lezers */}
        {!isAdmin && (
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStijl}>Jouw naam</label>
            <input
              type="text"
              value={naam}
              onChange={e => { setNaam(e.target.value); setFout(null) }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus={!naam}
              placeholder="Voornaam of volledige naam..."
              style={{ ...invoerStijl, borderColor: fout && !naam.trim() ? '#c0392b' : '#dde3ed' }}
            />
          </div>
        )}

        {/* Code / wachtwoord veld */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStijl}>
            {isAdmin ? 'Beheerderswachtwoord' : 'Toegangscode'}
          </label>
          <input
            type="password"
            value={code}
            onChange={e => { setCode(e.target.value); setFout(null) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus={!!naam && !isAdmin}
            placeholder={isAdmin ? 'Beheerderswachtwoord...' : 'Toegangscode...'}
            style={{ ...invoerStijl, borderColor: fout && code !== undefined ? '#c0392b' : '#dde3ed' }}
          />
        </div>

        {/* Foutmelding */}
        {fout && (
          <div style={{ background: '#fdf0ef', border: '1px solid #e8a090', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#c0392b', fontFamily: 'Arial' }}>
            {fout}
          </div>
        )}

        {/* Inlogknop */}
        <button
          onClick={handleLogin}
          disabled={laden}
          style={{
            width: '100%', background: laden ? '#9a6aac' : '#4a1a5c', color: 'white',
            border: 'none', padding: '13px', borderRadius: '8px',
            fontSize: '15px', fontFamily: 'Arial', fontWeight: '600',
            cursor: laden ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
          }}
        >
          {laden ? '⏳ Bezig...' : 'Toegang →'}
        </button>

        {/* Wissel tussen lezer en beheerder */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          {isAdmin ? (
            <button
              onClick={() => { setFout(null); setCode(''); router.push(`/inloggen?terug=${terugPad}`) }}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: '12px', fontFamily: 'Arial', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Terug naar fractie-inloggen
            </button>
          ) : (
            <button
              onClick={() => { setFout(null); setCode(''); router.push(`/inloggen?terug=${terugPad}&admin=1`) }}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: '12px', fontFamily: 'Arial', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Beheerder inloggen
            </button>
          )}
        </div>

        <p style={{ fontSize: '11px', color: '#bbb', fontFamily: 'Arial', textAlign: 'center', marginTop: '12px' }}>
          Neem contact op met de fractie voor de toegangscode.
        </p>
      </div>

      <style>{`
        @keyframes schud {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
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

const labelStijl: React.CSSProperties = {
  display: 'block', fontSize: '12px', color: '#666', fontFamily: 'Arial',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px',
}
const invoerStijl: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '2px solid #dde3ed',
  borderRadius: '8px', fontSize: '15px', fontFamily: 'Arial',
  outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' as const,
}
