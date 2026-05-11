'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Topbalk() {
  const pathname = usePathname()
  const { isAdmin, logout } = useAuth()

  return (
    <header style={{
      background: 'var(--blauw)',
      color: 'white',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          background: 'var(--accent)',
          color: 'var(--blauw)',
          fontSize: '10px',
          fontWeight: 'bold',
          padding: '2px 8px',
          borderRadius: '3px',
          letterSpacing: '1px',
          fontFamily: 'Arial, sans-serif',
        }}>GM</span>
        <span style={{ fontSize: '15px', letterSpacing: '0.5px' }}>Vergaderagenda Gooise Meren</span>
      </div>

      <nav style={{ display: 'flex', gap: '2px' }}>
        <NavLink href="/" actief={pathname === '/'}>Vergaderingen</NavLink>
        {isAdmin && <NavLink href="/beheer" actief={pathname === '/beheer'}>Beheer</NavLink>}
        {isAdmin ? (
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.65)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              borderRadius: '4px',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Uitloggen
          </button>
        ) : (
          <NavLink href="/login" actief={pathname === '/login'}>Beheerder</NavLink>
        )}
      </nav>
    </header>
  )
}

function NavLink({ href, actief, children }: { href: string; actief: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        background: actief ? 'rgba(255,255,255,0.15)' : 'none',
        color: actief ? 'white' : 'rgba(255,255,255,0.65)',
        padding: '8px 16px',
        fontSize: '13px',
        borderRadius: '4px',
        fontFamily: 'Arial, sans-serif',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </Link>
  )
}
