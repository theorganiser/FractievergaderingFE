import { NextRequest, NextResponse } from 'next/server'
import { verifieerToken, maakLezerCookie, COOKIE_LEZER } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'
import { haalWachtwoordHash, controleerWachtwoord, zetWachtwoord, MIN_LENGTE } from '@/lib/wachtwoord'

// Eigen wachtwoord instellen of wijzigen. De naam komt uit de (geverifieerde) login-cookie,
// dus je kunt alleen je eigen wachtwoord aanpassen.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'onbekend'
  const { toegestaan, resetOver } = checkRateLimit(`ww-${ip}`)
  if (!toegestaan) {
    return NextResponse.json({ fout: `Te veel pogingen. Probeer het over ${Math.ceil(resetOver / 1000)} seconden opnieuw.` }, { status: 429 })
  }

  const token = req.cookies.get(COOKIE_LEZER)?.value
  const payload = token ? await verifieerToken(token) : null
  const naam = (payload?.naam as string) || ''
  if (!naam) return NextResponse.json({ fout: 'Je bent niet ingelogd.' }, { status: 401 })

  const { huidig, nieuw } = await req.json()
  if (typeof nieuw !== 'string' || nieuw.length < MIN_LENGTE) {
    return NextResponse.json({ fout: `Kies een wachtwoord van minimaal ${MIN_LENGTE} tekens.` }, { status: 400 })
  }
  if (nieuw === process.env.READER_PASSWORD || nieuw === huidig) {
    return NextResponse.json({ fout: 'Kies een ander wachtwoord dan je huidige of de gedeelde toegangscode.' }, { status: 400 })
  }

  try {
    const eigenHash = await haalWachtwoordHash(naam)
    if (eigenHash) {
      if (typeof huidig !== 'string' || !controleerWachtwoord(huidig, eigenHash)) {
        return NextResponse.json({ fout: 'Je huidige wachtwoord klopt niet.' }, { status: 401 })
      }
    } else {
      const gedeeld = process.env.READER_PASSWORD
      if (!gedeeld) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
      if (huidig !== gedeeld) {
        return NextResponse.json({ fout: 'De huidige toegangscode klopt niet.' }, { status: 401 })
      }
    }
    await zetWachtwoord(naam, nieuw)
  } catch (err) {
    console.error('Wachtwoord instellen mislukt:', err)
    return NextResponse.json({ fout: 'Opslaan lukte niet. Is de tabel gebruiker_wachtwoorden aangemaakt (supabase-wachtwoorden.sql)?' }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  response.headers.append('Set-Cookie', await maakLezerCookie(naam, true))
  return response
}
