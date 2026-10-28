// Eén plek die uit de cookies afleidt wie er is ingelogd en met welke rechten.
// Edge-compatibel (alleen jose), zodat zowel de middleware als de API-routes dit gebruiken.

import { NextResponse } from 'next/server'
import { verifieerToken, COOKIE_LEZER, COOKIE_ADMIN, COOKIE_MODERATOR } from './auth'

export interface Sessie {
  naam: string
  isAdmin: boolean
  isModerator: boolean   // admin heeft ook moderatorrechten
  eigenWachtwoord: boolean
  // Beheerder/moderator die nog een eigen wachtwoord moet instellen (heeft tot dan alleen lezerrechten)
  rolWacht: '' | 'beheerder' | 'moderator'
}

export type Niveau = 'lezer' | 'moderator' | 'admin'

interface CookieBron {
  get(naam: string): { value: string } | undefined
}

// Een token telt alleen als het in de juiste cookie zit én de juiste rol draagt. Anders kan een
// geldig lezer-token in de admin-cookie geplakt worden (zelfde geheim, dus de handtekening klopt).
async function payloadMetRol(cookies: CookieBron, cookie: string, rol: string) {
  const token = cookies.get(cookie)?.value
  if (!token) return null
  const payload = await verifieerToken(token)
  return payload?.rol === rol ? payload : null
}

// Een rol-cookie hoort bij één persoon: de naam erin moet gelijk zijn aan die in de lezer-cookie.
// Zo kun je een beheerders-cookie niet combineren met een login onder een andere naam.
async function rolVoor(cookies: CookieBron, cookie: string, rol: string, naam: string): Promise<boolean> {
  const payload = await payloadMetRol(cookies, cookie, rol)
  return !!payload && !!naam && payload.naam === naam
}

export async function leesSessie(cookies: CookieBron): Promise<Sessie | null> {
  const lezer = await payloadMetRol(cookies, COOKIE_LEZER, 'lezer')
  if (!lezer) return null
  const naam = (lezer.naam as string) || ''
  const isAdmin = await rolVoor(cookies, COOKIE_ADMIN, 'admin', naam)
  const isModerator = isAdmin || await rolVoor(cookies, COOKIE_MODERATOR, 'moderator', naam)
  const rolWacht = lezer.rolWacht === 'beheerder' || lezer.rolWacht === 'moderator' ? lezer.rolWacht : ''
  return {
    naam,
    isAdmin,
    isModerator,
    eigenWachtwoord: lezer.eigen === '1',
    rolWacht,
  }
}

export function heeftNiveau(sessie: Sessie | null, niveau: Niveau): boolean {
  if (!sessie) return false
  if (niveau === 'admin') return sessie.isAdmin
  if (niveau === 'moderator') return sessie.isModerator
  return true
}

// Voor API-routes: geeft de sessie terug, of een kant-en-klare 401/403-response.
//   const s = await vereis(req, 'admin'); if (s instanceof NextResponse) return s
export async function vereis(req: { cookies: CookieBron }, niveau: Niveau = 'lezer'): Promise<Sessie | NextResponse> {
  const sessie = await leesSessie(req.cookies)
  if (!sessie) return NextResponse.json({ fout: 'Je bent niet ingelogd.' }, { status: 401 })
  if (!heeftNiveau(sessie, niveau)) {
    const wie = niveau === 'admin' ? 'beheerders' : 'moderators en beheerders'
    return NextResponse.json({ fout: `Alleen voor ${wie}.` }, { status: 403 })
  }
  return sessie
}
