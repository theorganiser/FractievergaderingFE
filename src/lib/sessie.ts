// Eén plek die uit de cookies afleidt wie er is ingelogd en met welke rechten.
// Edge-compatibel (alleen jose), zodat zowel de middleware als de API-routes dit gebruiken.

import { NextResponse } from 'next/server'
import { verifieerToken, COOKIE_LEZER, COOKIE_ADMIN, COOKIE_MODERATOR } from './auth'

export interface Sessie {
  naam: string
  isAdmin: boolean
  isModerator: boolean   // admin heeft ook moderatorrechten
  eigenWachtwoord: boolean
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

export async function leesSessie(cookies: CookieBron): Promise<Sessie | null> {
  const lezer = await payloadMetRol(cookies, COOKIE_LEZER, 'lezer')
  if (!lezer) return null
  const isAdmin = !!(await payloadMetRol(cookies, COOKIE_ADMIN, 'admin'))
  const isModerator = isAdmin || !!(await payloadMetRol(cookies, COOKIE_MODERATOR, 'moderator'))
  return {
    naam: (lezer.naam as string) || '',
    isAdmin,
    isModerator,
    eigenWachtwoord: lezer.eigen === '1',
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
