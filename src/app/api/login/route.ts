import { NextRequest, NextResponse } from 'next/server'
import { maakLezerCookie, maakAdminCookie, maakModeratorCookie } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'
import { db } from '@/lib/server/db'
import { schrijfLoginLog } from '@/lib/loginlog'
import { haalWachtwoordHash, controleerWachtwoord, rolWachtwoord } from '@/lib/wachtwoord'

// Eén login voor iedereen: naam + wachtwoord. De rol komt uitsluitend uit de gebruikers-tabel.
//
// - Fractielid: eigen wachtwoord, of (zolang dat er niet is) de gedeelde toegangscode.
// - Beheerder/moderator: altijd een eigen wachtwoord. Heeft iemand met zo'n rol er nog geen,
//   dan logt hij eenmalig in met het beheerders- of moderatorwachtwoord en krijgt hij alleen
//   fractielid-rechten tot hij op /account een eigen wachtwoord heeft ingesteld.
//   De gedeelde toegangscode werkt voor deze rollen niet: wie die kent, kan dus niet als
//   beheerder of moderator inloggen door alleen diens naam in te typen.

// ilike zonder jokertekens: % en _ letterlijk nemen
const zonderJokers = (t: string) => t.replace(/[\\%_]/g, m => `\\${m}`)

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'onbekend'
  const { toegestaan, resterend, resetOver } = checkRateLimit(ip)

  if (!toegestaan) {
    return NextResponse.json(
      { fout: `Te veel pogingen. Probeer het over ${Math.ceil(resetOver / 1000)} seconden opnieuw.` },
      { status: 429 }
    )
  }

  const { naam, code } = await req.json().catch(() => ({}))
  if (typeof naam !== 'string' || !naam.trim()) return NextResponse.json({ fout: 'Vul je naam in.' }, { status: 400 })
  if (typeof code !== 'string' || !code) return NextResponse.json({ fout: 'Vul je wachtwoord in.' }, { status: 400 })

  const { data: gebruiker } = await db()
    .from('gebruikers')
    .select('naam, rol, actief')
    .ilike('naam', zonderJokers(naam.trim()))
    .maybeSingle()

  if (!gebruiker) {
    return NextResponse.json({ fout: 'Naam niet gevonden. Neem contact op met de beheerder.' }, { status: 401 })
  }
  if (!gebruiker.actief) {
    return NextResponse.json({ fout: 'Dit account is gedeactiveerd. Neem contact op met de beheerder.' }, { status: 401 })
  }

  // Heeft deze persoon een eigen wachtwoord ingesteld? Dan geldt alleen dat wachtwoord;
  // de gedeelde toegangscode werkt voor die persoon niet meer.
  let eigenHash: string | null
  try {
    eigenHash = await haalWachtwoordHash(gebruiker.naam)
  } catch (err) {
    console.error('Wachtwoordcontrole mislukt:', err)
    return NextResponse.json({ fout: 'Inloggen is tijdelijk niet mogelijk. Probeer het zo opnieuw.' }, { status: 500 })
  }

  const extraRol = gebruiker.rol === 'beheerder' || gebruiker.rol === 'moderator' ? gebruiker.rol as 'beheerder' | 'moderator' : null
  let rolWacht: '' | 'beheerder' | 'moderator' = ''

  if (eigenHash) {
    if (!controleerWachtwoord(code, eigenHash)) {
      return NextResponse.json({ fout: `Onjuist wachtwoord. Nog ${resterend} poging(en).` }, { status: 401 })
    }
  } else if (extraRol) {
    const juist = rolWachtwoord(extraRol)
    if (!juist) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
    if (code !== juist) {
      const wie = extraRol === 'beheerder' ? 'beheerderswachtwoord' : 'moderatorwachtwoord'
      return NextResponse.json({
        fout: `Als ${extraRol} heb je een eigen wachtwoord nodig. Log eenmalig in met het ${wie} en stel daarna je eigen wachtwoord in. Nog ${resterend} poging(en).`,
      }, { status: 401 })
    }
    rolWacht = extraRol
  } else {
    const juisteCode = process.env.READER_PASSWORD
    if (!juisteCode) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
    if (code !== juisteCode) return NextResponse.json({ fout: `Onjuiste toegangscode. Nog ${resterend} poging(en).` }, { status: 401 })
  }

  // Log de inlogpoging — met foutcontrole en één retry, zodat een mislukte
  // logregel niet stilletjes verdwijnt zonder dat iemand het ooit merkt.
  await schrijfLoginLog({ naam: gebruiker.naam, rol: gebruiker.rol })

  const response = NextResponse.json({ ok: true, naam: gebruiker.naam, rol: gebruiker.rol, moetWachtwoordInstellen: !!rolWacht })
  response.headers.append('Set-Cookie', await maakLezerCookie(gebruiker.naam, !!eigenHash, rolWacht))

  // Extra rechten alleen met een eigen wachtwoord
  if (eigenHash && gebruiker.rol === 'beheerder') {
    response.headers.append('Set-Cookie', await maakAdminCookie(gebruiker.naam))
  } else if (eigenHash && gebruiker.rol === 'moderator') {
    response.headers.append('Set-Cookie', await maakModeratorCookie(gebruiker.naam))
  }

  return response
}
