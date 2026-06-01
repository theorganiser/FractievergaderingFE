'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { startSyncEnWacht, SyncLogItem } from '@/lib/api'

export default function Topbalk() {
  const pathname = usePathname()
  const { isAdmin, logout, naam: sprekerNaam } = useAuth()
  const [syncBezig, setSyncBezig] = useState(false)
  const [syncResultaat, setSyncResultaat] = useState<SyncLogItem | null>(null)
  const [toonResultaat, setToonResultaat] = useState(false)
  const [naamBewerken, setNaamBewerken] = useState(false)
  const [naamInvoer, setNaamInvoer] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  // Sluit menu bij navigeren
  useEffect(() => { setMenuOpen(false) }, [pathname])

  if (pathname.startsWith('/presentatie/') || pathname.startsWith('/inloggen') || pathname.startsWith('/stemlijst/')) return null

  const slaaNaamOp = () => {
    if (!naamInvoer.trim()) return
    localStorage.setItem('gdp_spreker_naam', naamInvoer.trim())
    setNaamBewerken(false)
    window.location.reload()
  }

  const handleSync = async () => {
    setSyncBezig(true)
    setToonResultaat(false)
    setMenuOpen(false)
    try {
      const log = await startSyncEnWacht()
      setSyncResultaat(log[0] || null)
      setToonResultaat(true)
      setTimeout(() => setToonResultaat(false), 8000)
    } catch {
      setSyncResultaat(null)
      setToonResultaat(true)
      setTimeout(() => setToonResultaat(false), 4000)
    }
    setSyncBezig(false)
  }

  const navItems = [
    { href: '/', label: '📅 Vergaderingen' },
    { href: '/documenten', label: '📄 Documenten' },
    { href: '/kalender', label: '🗓 Kalender' },
    ...(isAdmin ? [{ href: '/beheer', label: '⚙️ Beheer' }] : []),
  ]

  return (
    <>
      <header style={{
        background: '#4a1a5c',
        color: 'white',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        height: '58px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        borderBottom: '3px solid #a89060',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'white', flexShrink: 0 }}>
          <div style={{ background: 'white', color: '#4a1a5c', fontWeight: '900', fontSize: '13px', padding: '3px 8px', borderRadius: '5px', letterSpacing: '1px', fontFamily: 'Arial Black, Arial' }}>GDP</div>
          <div className="hide-mobile">
            <div style={{ fontSize: '13px', fontWeight: '600', lineHeight: 1.2 }}>Fractie Vergaderagenda</div>
            <div style={{ fontSize: '9px', color: '#c8a8d8', letterSpacing: '0.5px' }}>GOOIS DEMOCRATISCH PLATFORM</div>
          </div>
        </Link>

        <div style={{ flex: 1 }} />

        {/* Desktop nav */}
        <nav className="hide-mobile" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
          {navItems.map(item => (
            <NavLink key={item.href} href={item.href} actief={pathname === item.href}>{item.label}</NavLink>
          ))}
          {!isAdmin && sprekerNaam && (
            <button onClick={() => { setNaamInvoer(sprekerNaam); setNaamBewerken(true) }}
              style={{ background: 'rgba(168,144,96,0.2)', border: '1px solid rgba(168,144,96,0.4)', color: '#d4b880', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', marginLeft: '4px' }}
              title="Naam wijzigen">
              👤 {sprekerNaam} ✎
            </button>
          )}
          {isAdmin && (
            <button onClick={handleSync} disabled={syncBezig}
              style={{ background: 'rgba(168,144,96,0.2)', border: '1px solid #a89060', color: '#e8d090', padding: '5px 12px', borderRadius: '6px', cursor: syncBezig ? 'not-allowed' : 'pointer', fontSize: '12px', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '4px' }}>
              {syncBezig ? <><Spinner /> Bezig...</> : '↻ Sync'}
            </button>
          )}
          {isAdmin ? (
            <button onClick={logout} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', borderRadius: '6px', marginLeft: '4px', fontFamily: 'Arial' }}>
              Uitloggen
            </button>
          ) : null}
        </nav>

        {/* Naam op desktop voor niet-admin */}
        {naamBewerken && (
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input value={naamInvoer} onChange={e => setNaamInvoer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') slaaNaamOp(); if (e.key === 'Escape') setNaamBewerken(false) }}
              autoFocus placeholder="Jouw naam..."
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '4px 10px', borderRadius: '5px', fontSize: '13px', fontFamily: 'Arial', outline: 'none', width: '140px' }} />
            <button onClick={slaaNaamOp} style={{ background: '#a89060', border: 'none', color: '#2d0a40', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>✓</button>
            <button onClick={() => setNaamBewerken(false)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
          </div>
        )}

        {/* Hamburger knop - alleen mobiel */}
        <button
          className="show-mobile"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '18px', display: 'none' }}
          aria-label="Menu">
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobiel dropdown menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: '58px', left: 0, right: 0, bottom: 0,
          zIndex: 99, background: 'rgba(45,10,64,0.95)',
          display: 'flex', flexDirection: 'column',
          padding: '16px',
          backdropFilter: 'blur(4px)',
        }}>
          {/* Naam sectie */}
          {!isAdmin && (
            <div style={{ background: 'rgba(168,144,96,0.15)', border: '1px solid rgba(168,144,96,0.3)', borderRadius: '10px', padding: '14px 16px', marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color: '#a89060', fontFamily: 'Arial', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ingelogd als</div>
              <div style={{ fontSize: '16px', color: 'white', fontFamily: 'Arial', fontWeight: '600', marginBottom: '10px' }}>👤 {sprekerNaam || 'Onbekend'}</div>
              <input value={naamInvoer} onChange={e => setNaamInvoer(e.target.value)}
                placeholder="Naam wijzigen..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '8px' }} />
              <button onClick={() => { if (naamInvoer.trim()) { localStorage.setItem('gdp_spreker_naam', naamInvoer.trim()); window.location.reload() } }}
                style={{ background: '#a89060', color: '#2d0a40', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: 'bold' }}>
                ✓ Naam opslaan
              </button>
            </div>
          )}

          {/* Nav links */}
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              style={{ display: 'block', color: pathname === item.href ? '#e8d090' : 'white', background: pathname === item.href ? 'rgba(168,144,96,0.2)' : 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: '10px', textDecoration: 'none', fontSize: '16px', fontFamily: 'Arial', marginBottom: '8px', border: `1px solid ${pathname === item.href ? 'rgba(168,144,96,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
              {item.label}
            </Link>
          ))}

          <div style={{ flex: 1 }} />

          {/* Admin acties */}
          {isAdmin && (
            <button onClick={handleSync} disabled={syncBezig}
              style={{ background: 'rgba(168,144,96,0.2)', border: '1px solid #a89060', color: '#e8d090', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Arial', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {syncBezig ? <><Spinner /> Bezig...</> : '↻ Documenten verversen'}
            </button>
          )}

          {isAdmin && (
            <button onClick={() => { logout(); setMenuOpen(false) }}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontFamily: 'Arial' }}>
              Uitloggen
            </button>
          )}
        </div>
      )}

      {/* Sync resultaat banner */}
      {toonResultaat && (
        <div style={{ background: syncResultaat ? '#2d4a1a' : '#4a1a1a', color: 'white', padding: '8px 20px', fontSize: '13px', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `2px solid ${syncResultaat ? '#6dbb40' : '#bb4040'}` }}>
          {syncResultaat ? <><span>✓ Sync geslaagd</span></> : <span>✗ Sync mislukt</span>}
          <button onClick={() => setToonResultaat(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
          .hide-mobile { display: flex !important; }
        }
      `}</style>
    </>
  )
}

function NavLink({ href, actief, children }: { href: string; actief: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      background: actief ? 'rgba(168,144,96,0.25)' : 'none',
      color: actief ? '#e8d090' : 'rgba(255,255,255,0.75)',
      padding: '6px 12px', fontSize: '13px', borderRadius: '6px',
      fontFamily: 'Arial', textDecoration: 'none',
      border: actief ? '1px solid rgba(168,144,96,0.4)' : '1px solid transparent',
    }}>
      {children}
    </Link>
  )
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#e8d090', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}
