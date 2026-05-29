'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { startSyncEnWacht, SyncLogItem } from '@/lib/api'
import { getSprekerNaam, setSprekerNaam } from '@/components/Toegangspoort'

export default function Topbalk() {
  const pathname = usePathname()
  const { isAdmin, logout } = useAuth()
  const [syncBezig, setSyncBezig] = useState(false)
  const [sprekerNaam, setSprekerNaamState] = useState('')
  const [naamBewerken, setNaamBewerken] = useState(false)
  const [naamInvoer, setNaamInvoer] = useState('')

  useEffect(() => {
    setSprekerNaamState(getSprekerNaam())
  }, [])

  const slaaNaamOp = () => {
    if (!naamInvoer.trim()) return
    setSprekerNaam(naamInvoer.trim())
    setSprekerNaamState(naamInvoer.trim())
    setNaamBewerken(false)
  }
  const [syncResultaat, setSyncResultaat] = useState<SyncLogItem | null>(null)
  const [toonResultaat, setToonResultaat] = useState(false)

  if (pathname.startsWith('/presentatie/')) return null

  const handleSync = async () => {
    setSyncBezig(true)
    setToonResultaat(false)
    try {
      const log = await startSyncEnWacht()
      const laatste = log[0] || null
      setSyncResultaat(laatste)
      setToonResultaat(true)
      setTimeout(() => setToonResultaat(false), 8000)
    } catch {
      setSyncResultaat(null)
      setToonResultaat(true)
      setTimeout(() => setToonResultaat(false), 4000)
    }
    setSyncBezig(false)
  }

  return (
    <>
      <header style={{
        background: '#4a1a5c',
        color: 'white',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        height: '58px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        borderBottom: '3px solid #a89060',
      }}>
        {/* Logo/naam */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white' }}>
          <div style={{
            background: 'white',
            color: '#4a1a5c',
            fontWeight: '900',
            fontSize: '13px',
            padding: '3px 9px',
            borderRadius: '5px',
            letterSpacing: '1px',
            fontFamily: 'Arial Black, Arial, sans-serif',
          }}>GDP</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', lineHeight: 1.2 }}>Fractie Vergaderagenda</div>
            <div style={{ fontSize: '10px', color: '#c8a8d8', letterSpacing: '0.5px' }}>GOOIS DEMOCRATISCH PLATFORM</div>
          </div>
        </Link>

        <div style={{ flex: 1 }} />

        {/* Naam weergave */}
        {!isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {naamBewerken ? (
              <>
                <input
                  value={naamInvoer}
                  onChange={e => setNaamInvoer(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') slaaNaamOp(); if (e.key === 'Escape') setNaamBewerken(false) }}
                  autoFocus
                  placeholder="Jouw naam..."
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '4px 10px', borderRadius: '5px', fontSize: '13px', fontFamily: 'Arial', outline: 'none', width: '140px' }}
                />
                <button onClick={slaaNaamOp} style={{ background: '#a89060', border: 'none', color: '#2d0a40', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', fontWeight: 'bold' }}>✓</button>
                <button onClick={() => setNaamBewerken(false)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
              </>
            ) : (
              <button
                onClick={() => { setNaamInvoer(sprekerNaam); setNaamBewerken(true) }}
                style={{ background: 'rgba(168,144,96,0.2)', border: '1px solid rgba(168,144,96,0.4)', color: '#d4b880', padding: '4px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Naam wijzigen"
              >
                👤 {sprekerNaam || 'Naam instellen'} ✎
              </button>
            )}
          </div>
        )}

        {/* Sync knop — alleen voor beheerder */}
        {isAdmin && (
          <button
            onClick={handleSync}
            disabled={syncBezig}
            style={{
              background: syncBezig ? 'rgba(168,144,96,0.3)' : 'rgba(168,144,96,0.2)',
              border: '1px solid #a89060',
              color: syncBezig ? '#c8a8d8' : '#e8d090',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: syncBezig ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontFamily: 'Arial',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {syncBezig ? (
              <><Spinner /> Documenten ophalen...</>
            ) : (
              <>↻ Documenten verversen</>
            )}
          </button>
        )}

        {/* Nav links */}
        <nav style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          <NavLink href="/" actief={pathname === '/'}>Vergaderingen</NavLink>
          <NavLink href="/documenten" actief={pathname === '/documenten'}>Documenten</NavLink>
          <NavLink href="/kalender" actief={pathname === '/kalender'}>📅 Kalender</NavLink>
          {isAdmin && <NavLink href="/beheer" actief={pathname === '/beheer'}>Beheer</NavLink>}
          {isAdmin ? (
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', borderRadius: '6px', marginLeft: '4px', fontFamily: 'Arial' }}>
              Uitloggen
            </button>
          ) : (
            <NavLink href="/login" actief={pathname === '/login'}>Beheerder</NavLink>
          )}
        </nav>
      </header>

      {/* Sync resultaat banner */}
      {toonResultaat && (
        <div style={{
          background: syncResultaat ? '#2d4a1a' : '#4a1a1a',
          color: 'white',
          padding: '8px 20px',
          fontSize: '13px',
          fontFamily: 'Arial',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: `2px solid ${syncResultaat ? '#6dbb40' : '#bb4040'}`,
          animation: 'fadeIn 0.3s ease',
        }}>
          {syncResultaat ? (
            <>
              <span>✓ Sync geslaagd</span>
              {syncResultaat.nieuw !== undefined && (
                <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  {syncResultaat.nieuw} nieuw
                </span>
              )}
              {syncResultaat.bijgewerkt !== undefined && (
                <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                  {syncResultaat.bijgewerkt} bijgewerkt
                </span>
              )}
              {syncResultaat.per_type && Object.entries(syncResultaat.per_type).map(([type, stats]) => (
                <span key={type} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                  {type}: +{stats.nieuw}
                </span>
              ))}
            </>
          ) : (
            <span>✗ Sync mislukt of API niet bereikbaar</span>
          )}
          <button onClick={() => setToonResultaat(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  )
}

function NavLink({ href, actief, children }: { href: string; actief: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      background: actief ? 'rgba(168,144,96,0.25)' : 'none',
      color: actief ? '#e8d090' : 'rgba(255,255,255,0.75)',
      padding: '6px 13px',
      fontSize: '13px',
      borderRadius: '6px',
      fontFamily: 'Arial',
      textDecoration: 'none',
      border: actief ? '1px solid rgba(168,144,96,0.4)' : '1px solid transparent',
    }}>
      {children}
    </Link>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: '12px', height: '12px',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#e8d090',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}
