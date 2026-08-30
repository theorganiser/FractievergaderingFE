import { NextRequest, NextResponse } from 'next/server'
import { maakAdminCookie, maakLezerCookie } from '../../../lib/auth'
import { checkRateLimit } from '../../../lib/ratelimit'

export async function POST(req: NextRequest) {
  // Rate limiting: max 5 pogingen per minuut per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'onbekend'
  const { toegestaan, resterend, resetOver } = checkRateLimit(`admin-${ip}`)

  if (!toegestaan) {
    return NextResponse.json(
      { fout: `Te veel pogingen. Probeer het over ${Math.ceil(resetOver / 1000)} seconden opnieuw.` },
      { status: 429 }
    )
  }

  const { wachtwoord, naam } = await req.json()
  const juistWachtwoord = process.env.ADMIN_PASSWORD
  if (!juistWachtwoord) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
  if (wachtwoord !== juistWachtwoord) return NextResponse.json({ fout: `Onjuist wachtwoord. Nog ${resterend} poging(en).` }, { status: 401 })

  const adminCookie = await maakAdminCookie()
  const lezerCookie = await maakLezerCookie(naam || 'Beheerder')
  const response = NextResponse.json({ ok: true })
  response.headers.append('Set-Cookie', adminCookie)
  response.headers.append('Set-Cookie', lezerCookie)
  return response
}
