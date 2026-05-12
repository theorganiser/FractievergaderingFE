'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Topbalk() {
  const pathname = usePathname()
  const { isAdmin, logout } = useAuth()

  // Verberg topbalk op leespagina en in presentatiemodus
  if (pathname.startsWith('/lees/')) return null

  return (
    <header style={{
      background: 'var(--blauw)',
      color: 'white',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '58px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      borderBottom: '3px solid var(--accent)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* GDP logo badge */}
        <div style={{
          background: 'var(--accent)',
          color: 'var(--blauw)',
          fontWeight: '900',
          fontSize: '14px',
          padding: '4px 10px',
          borderRadius: '4px',
          letterSpacing: '1px',
          fontFamily: 'Arial Black, Arial, sans-serif',
        }}>GDP</div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '0.3px' }}>Fractie Vergaderagenda</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>GOOIS DEMOCRATISCH PLATFORM</div>
        </div>
      </div>

      <nav style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        <NavLink href="/" actief={pathname === '/'}>Vergaderingen</NavLink>
        {isAdmin && <NavLink href="/beheer" actief={pathname === '/beheer'}>Beheer</NavLink>}
        {isAdmin ? (
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', borderRadius: '6px', marginLeft: '4px' }}>
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
    <Link href={href} style={{
      background: actief ? 'rgba(232,200,74,0.2)' : 'none',
      color: actief ? 'var(--accent)' : 'rgba(255,255,255,0.75)',
      padding: '6px 14px',
      fontSize: '13px',
      borderRadius: '6px',
      fontFamily: 'Arial, sans-serif',
      textDecoration: 'none',
      border: actief ? '1px solid rgba(232,200,74,0.4)' : '1px solid transparent',
    }}>
      {children}
    </Link>
  )
}
