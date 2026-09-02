import { NextRequest, NextResponse } from 'next/server'
import { maakLezerCookie, maakAdminCookie, maakModeratorCookie } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'onbekend'
  const { toegestaan, resterend, resetOver } = checkRateLimit(ip)

  if (!toegestaan) {
    return NextResponse.json(
      { fout: `Te veel pogingen. Probeer het over ${Math.ceil(resetOver / 1000)} seconden opnieuw.` },
      { status: 429 }
    )
  }

  const { naam, code } = await req.json()
  if (!naam?.trim()) return NextResponse.json({ fout: 'Vul je naam in.' }, { status: 400 })

  const juisteCode = process.env.READER_PASSWORD
  if (!juisteCode) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
  if (code !== juisteCode) return NextResponse.json({ fout: `Onjuiste toegangscode. Nog ${resterend} poging(en).` }, { status: 401 })

  const { data: gebruiker } = await supabase
    .from('gebruikers')
    .select('naam, rol, actief')
    .ilike('naam', naam.trim())
    .single()

  if (!gebruiker) {
    return NextResponse.json({ fout: 'Naam niet gevonden. Neem contact op met de beheerder.' }, { status: 401 })
  }
  if (!gebruiker.actief) {
    return NextResponse.json({ fout: 'Dit account is gedeactiveerd. Neem contact op met de beheerder.' }, { status: 401 })
  }

  // Log de inlogpoging
  await supabase.from('login_log').insert({
    naam: gebruiker.naam,
    rol: gebruiker.rol,
    ingelogd_op: new Date().toISOString(),
  })

  const lezerCookie = await maakLezerCookie(gebruiker.naam)
  const response = NextResponse.json({ ok: true, naam: gebruiker.naam, rol: gebruiker.rol })
  response.headers.append('Set-Cookie', lezerCookie)

  if (gebruiker.rol === 'beheerder') {
    const adminCookie = await maakAdminCookie()
    response.headers.append('Set-Cookie', adminCookie)
  } else if (gebruiker.rol === 'moderator') {
    const moderatorCookie = await maakModeratorCookie()
    response.headers.append('Set-Cookie', moderatorCookie)
  }

  return response
}
