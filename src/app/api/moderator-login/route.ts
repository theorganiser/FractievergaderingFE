import { NextRequest, NextResponse } from 'next/server'
import { maakModeratorCookie, maakLezerCookie } from '../../../lib/auth'
import { checkRateLimit } from '../../../lib/ratelimit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'onbekend'
  const { toegestaan, resterend, resetOver } = checkRateLimit(`moderator-${ip}`)

  if (!toegestaan) {
    return NextResponse.json(
      { fout: `Te veel pogingen. Probeer het over ${Math.ceil(resetOver / 1000)} seconden opnieuw.` },
      { status: 429 }
    )
  }

  const { wachtwoord, naam } = await req.json()
  const juistWachtwoord = process.env.MODERATOR_PASSWORD
  if (!juistWachtwoord) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
  if (wachtwoord !== juistWachtwoord) return NextResponse.json({ fout: `Onjuist wachtwoord. Nog ${resterend} poging(en).` }, { status: 401 })

  const moderatorCookie = await maakModeratorCookie()
  const lezerCookie = await maakLezerCookie(naam || 'Moderator')
  const response = NextResponse.json({ ok: true })
  response.headers.append('Set-Cookie', moderatorCookie)
  response.headers.append('Set-Cookie', lezerCookie)
  return response
}
