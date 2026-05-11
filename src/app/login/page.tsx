'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPagina() {
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState(false)
  const { login, isAdmin } = useAuth()
  const router = useRouter()

  if (isAdmin) {
    router.push('/')
    return null
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (login(wachtwoord)) {
      router.push('/')
    } else {
      setFout(true)
      setWachtwoord('')
    }
  }

  return (
    <div style={{ maxWidth: '380px', margin: '60px auto' }}>
      <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: 'normal', marginBottom: '4px' }}>
        Beheerder inloggen
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', marginBottom: '28px' }}>
        Vergaderagenda Gooise Meren
      </p>

      <div style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '10px', padding: '28px' }}>
        <div onSubmit={handleLogin as unknown as React.FormEventHandler<HTMLDivElement>}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', marginBottom: '6px' }}>
              Wachtwoord
            </label>
            <input
              type="password"
              value={wachtwoord}
              onChange={e => { setWachtwoord(e.target.value); setFout(false) }}
              onKeyDown={e => e.key === 'Enter' && handleLogin(e as unknown as React.FormEvent)}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${fout ? 'var(--rood)' : 'var(--rand)'}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
                outline: 'none',
              }}
              placeholder="Voer wachtwoord in"
            />
            {fout && (
              <p style={{ fontSize: '12px', color: 'var(--rood)', fontFamily: 'Arial, sans-serif', marginTop: '6px' }}>
                Onjuist wachtwoord. Probeer het opnieuw.
              </p>
            )}
          </div>
          <button
            onClick={handleLogin as unknown as React.MouseEventHandler}
            style={{
              width: '100%',
              background: 'var(--blauw)',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif',
              cursor: 'pointer',
            }}
          >
            Inloggen
          </button>
        </div>
      </div>

      <p style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', marginTop: '16px', textAlign: 'center' }}>
        Geen account? Vraag de beheerder om toegang.
      </p>
    </div>
  )
}
