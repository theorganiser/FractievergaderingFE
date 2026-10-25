import { NextRequest, NextResponse } from 'next/server'
import { maakLezerCookie, maakAdminCookie, maakModeratorCookie } from '@/lib/auth'
import { leesSessie } from '@/lib/sessie'
import { checkRateLimit } from '@/lib/ratelimit'
import { db } from '@/lib/server/db'
import { haalWachtwoordHash, controleerWachtwoord, zetWachtwoord, rolWachtwoord, MIN_LENGTE } from '@/lib/wachtwoord'

// Eigen wachtwoord instellen of wijzigen. De naam komt uit de (geverifieerde) login-cookie,
// dus je kunt alleen je eigen wachtwoord aanpassen.
// Als "huidig" geldt: je eigen wachtwoord, of als je er nog geen hebt de gedeelde toegangscode
// (fractielid) of het beheerders-/moderatorwachtwoord (beheerder/moderator).
// Daarna krijg je meteen de rechten die bij je rol in de gebruikers-tabel horen.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'onbekend'
  const { toegestaan, resetOver } = checkRateLimit(`ww-${ip}`)
  if (!toegestaan) {
    return NextResponse.json({ fout: `Te veel pogingen. Probeer het over ${Math.ceil(resetOver / 1000)} seconden opnieuw.` }, { status: 429 })
  }

  const sessie = await leesSessie(req.cookies)
  const naam = sessie?.naam || ''
  if (!naam) return NextResponse.json({ fout: 'Je bent niet ingelogd.' }, { status: 401 })

  const { huidig, nieuw } = await req.json().catch(() => ({}))
  if (typeof nieuw !== 'string' || nieuw.length < MIN_LENGTE) {
    return NextResponse.json({ fout: `Kies een wachtwoord van minimaal ${MIN_LENGTE} tekens.` }, { status: 400 })
  }
  const gedeeld = [process.env.READER_PASSWORD, process.env.ADMIN_PASSWORD, process.env.MODERATOR_PASSWORD].filter(Boolean)
  if (gedeeld.includes(nieuw) || nieuw === huidig) {
    return NextResponse.json({ fout: 'Kies een ander wachtwoord dan je huidige of een gedeelde code.' }, { status: 400 })
  }

  const { data: gebruiker } = await db().from('gebruikers').select('naam, rol, actief').eq('naam', naam).maybeSingle()
  if (!gebruiker || !gebruiker.actief) return NextResponse.json({ fout: 'Je account is niet (meer) actief.' }, { status: 403 })
  const extraRol = gebruiker.rol === 'beheerder' || gebruiker.rol === 'moderator' ? gebruiker.rol as 'beheerder' | 'moderator' : null

  try {
    const eigenHash = await haalWachtwoordHash(naam)
    if (eigenHash) {
      if (typeof huidig !== 'string' || !controleerWachtwoord(huidig, eigenHash)) {
        return NextResponse.json({ fout: 'Je huidige wachtwoord klopt niet.' }, { status: 401 })
      }
    } else if (extraRol) {
      const juist = rolWachtwoord(extraRol)
      if (!juist) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
      if (huidig !== juist) {
        return NextResponse.json({ fout: `Het ${extraRol === 'beheerder' ? 'beheerderswachtwoord' : 'moderatorwachtwoord'} klopt niet.` }, { status: 401 })
      }
    } else {
      const code = process.env.READER_PASSWORD
      if (!code) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
      if (huidig !== code) {
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
  if (extraRol === 'beheerder') response.headers.append('Set-Cookie', await maakAdminCookie(naam))
  if (extraRol === 'moderator') response.headers.append('Set-Cookie', await maakModeratorCookie(naam))
  return response
}
