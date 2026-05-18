import { NextRequest, NextResponse } from 'next/server'
import { verifieerToken, COOKIE_LEZER, COOKIE_ADMIN } from '@/lib/auth'

// Paden die altijd toegankelijk zijn (geen auth nodig)
const OPENBARE_PADEN = [
  '/inloggen',
  '/api/login',
  '/api/admin-login',
  '/api/logout',
  '/_next',
  '/favicon',
]

export async function middleware(req: NextRequest) {
  const pad = req.nextUrl.pathname

  // Openbare paden altijd doorlaten
  if (OPENBARE_PADEN.some(p => pad.startsWith(p))) {
    return NextResponse.next()
  }

  // Check lezer cookie
  const lezerToken = req.cookies.get(COOKIE_LEZER)?.value
  const lezerPayload = lezerToken ? await verifieerToken(lezerToken) : null

  if (!lezerPayload) {
    // Geen geldige cookie — redirect naar inlogpagina
    const url = req.nextUrl.clone()
    url.pathname = '/inloggen'
    url.searchParams.set('terug', pad)
    return NextResponse.redirect(url)
  }

  // Check admin voor beveiligde beheer-paden
  const adminPaden = ['/vergadering', '/beheer']
  if (adminPaden.some(p => pad.startsWith(p))) {
    const adminToken = req.cookies.get(COOKIE_ADMIN)?.value
    const adminPayload = adminToken ? await verifieerToken(adminToken) : null

    if (!adminPayload) {
      const url = req.nextUrl.clone()
      url.pathname = '/inloggen'
      url.searchParams.set('terug', pad)
      url.searchParams.set('admin', '1')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
