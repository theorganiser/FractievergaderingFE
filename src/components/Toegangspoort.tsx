'use client'

import { useState, useEffect } from 'react'

const OPSLAG_SLEUTEL = 'gdp_toegang_verleend'
const READER_PW = process.env.NEXT_PUBLIC_READER_PASSWORD || 'fractie2026'

export function heeftToegang(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(OPSLAG_SLEUTEL) === 'true'
}

export function verleenToegang(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(OPSLAG_SLEUTEL, 'true')
}

interface ToegangspoortProps {
  children: React.ReactNode
}

export default function Toegangspoort({ children }: ToegangspoortProps) {
  const [toegang, setToegang] = useState<boolean | null>(null)
  const [code, setCode] = useState('')
  const [fout, setFout] = useState(false)
  const [schudden, setSchudden] = useState(false)

  useEffect(() => {
    setToegang(heeftToegang())
  }, [])

  // Nog aan het checken
  if (toegang === null) return null

  // Toegang verleend
  if (toegang) return <>{children}</>

  const handleLogin = () => {
    if (code === READER_PW) {
      verleenToegang()
      setToegang(true)
    } else {
      setFout(true)
      setSchudden(true)
      setCode('')
      setTimeout(() => setSchudden(false), 500)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2d0a40 0%, #4a1a5c 50%, #2d0a40 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px 36px',
        width: '380px',
        maxWidth: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        animation: schudden ? 'schud 0.4s ease' : 'none',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#4a1a5c',
            color: '#a89060',
            fontWeight: '900',
            fontSize: '22px',
            width: '60px',
            height: '60px',
            borderRadius: '12px',
            fontFamily: 'Arial Black, Arial',
            marginBottom: '12px',
            letterSpacing: '1px',
          }}>GDP</div>
          <h1 style={{ fontSize: '20px', color: '#4a1a5c', fontWeight: '700', margin: '0 0 4px', fontFamily: 'Arial' }}>
            Fractie Vergaderagenda
          </h1>
          <p style={{ fontSize: '13px', color: '#888', margin: 0, fontFamily: 'Arial' }}>
            Goois Democratisch Platform
          </p>
        </div>

        {/* Formulier */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', fontFamily: 'Arial', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Toegangscode
          </label>
          <input
            type="password"
            value={code}
            onChange={e => { setCode(e.target.value); setFout(false) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
            placeholder="Voer de code in..."
            style={{
              width: '100%',
              padding: '12px 14px',
              border: `2px solid ${fout ? '#c0392b' : '#dde3ed'}`,
              borderRadius: '8px',
              fontSize: '15px',
              fontFamily: 'Arial',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
          />
          {fout && (
            <p style={{ fontSize: '12px', color: '#c0392b', fontFamily: 'Arial', marginTop: '6px', margin: '6px 0 0' }}>
              Onjuiste code. Probeer opnieuw.
            </p>
          )}
        </div>

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            background: '#4a1a5c',
            color: 'white',
            border: 'none',
            padding: '13px',
            borderRadius: '8px',
            fontSize: '15px',
            fontFamily: 'Arial',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => (e.currentTarget.style.background = '#6a2a8a')}
          onMouseOut={e => (e.currentTarget.style.background = '#4a1a5c')}
        >
          Toegang →
        </button>

        <p style={{ fontSize: '11px', color: '#bbb', fontFamily: 'Arial', textAlign: 'center', marginTop: '20px', margin: '20px 0 0' }}>
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
