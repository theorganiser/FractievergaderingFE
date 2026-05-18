import { NextRequest, NextResponse } from 'next/server'

// Cookie namen
const COOKIE_LEZER = 'gdp_toegang'
const COOKIE_ADMIN = 'gdp_admin'

const OPENBARE_PADEN = [
  '/inloggen',
  '/api/login',
  '/api/admin-login',
  '/api/logout',
  '/api/check-auth',
  '/_next',
  '/favicon',
]

// Middleware doet alleen een simpele cookie aanwezigheidscheck
// De echte JWT verificatie gebeurt in /api/check-auth
export function middleware(req: NextRequest) {
  const pad = req.nextUrl.pathname

  if (OPENBARE_PADEN.some(p => pad.startsWith(p))) {
    return NextResponse.next()
  }

  // Check of lezer cookie aanwezig is (niet geverifieerd - dat doet check-auth)
  const heeftLezerCookie = !!req.cookies.get(COOKIE_LEZER)?.value

  if (!heeftLezerCookie) {
    const url = req.nextUrl.clone()
    url.pathname = '/inloggen'
    url.searchParams.set('terug', pad)
    return NextResponse.redirect(url)
  }

  // Check admin cookie voor beveiligde paden
  const adminPaden = ['/vergadering', '/beheer']
  if (adminPaden.some(p => pad.startsWith(p))) {
    const heeftAdminCookie = !!req.cookies.get(COOKIE_ADMIN)?.value

    if (!heeftAdminCookie) {
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
