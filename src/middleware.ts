import { NextRequest, NextResponse } from 'next/server'
import { leesSessie, heeftNiveau, Niveau } from '@/lib/sessie'

const OPENBARE_PADEN = [
  '/inloggen',
  '/api/login',
  '/api/admin-login',
  '/api/moderator-login',
  '/api/logout',
  '/api/check-auth',
  '/_next',
  '/favicon',
]

// Pagina's die meer dan een gewone login vereisen
const PAGINA_NIVEAU: [string, Niveau][] = [
  ['/beheer', 'admin'],
  ['/nieuws', 'admin'],
  ['/vergadering', 'moderator'],
]

function naarInloggen(req: NextRequest, admin: boolean) {
  const url = req.nextUrl.clone()
  url.pathname = '/inloggen'
  url.searchParams.set('terug', req.nextUrl.pathname)
  if (admin) url.searchParams.set('admin', '1')
  return NextResponse.redirect(url)
}

// Controleert de JWT-cookies (handtekening, verloop én rol). API-routes controleren zelf
// nog een keer hun eigen niveau; dit is de eerste poort.
export async function middleware(req: NextRequest) {
  const pad = req.nextUrl.pathname

  if (OPENBARE_PADEN.some(p => pad.startsWith(p))) {
    return NextResponse.next()
  }

  const sessie = await leesSessie(req.cookies)

  if (!sessie) {
    if (pad.startsWith('/api/')) return NextResponse.json({ fout: 'Je bent niet ingelogd.' }, { status: 401 })
    return naarInloggen(req, false)
  }

  const eis = PAGINA_NIVEAU.find(([p]) => pad.startsWith(p))
  if (eis && !heeftNiveau(sessie, eis[1])) return naarInloggen(req, true)

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
