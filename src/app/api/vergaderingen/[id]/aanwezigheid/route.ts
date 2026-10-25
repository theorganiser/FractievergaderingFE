import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'
import { zetStatus, zelfdeNaam, STATUSSEN, AanwezigheidStatus } from '@/lib/aanwezigheid'

export const dynamic = 'force-dynamic'

// Zet de aanwezigheid van één persoon, op de verse versie uit de database.
// Body: { naam, status: 'aanwezig' | 'online' | 'afwezig' | null }  (null = naam weghalen)
// - Een fractielid mag alleen zijn eigen status zetten.
// - Moderator/beheerder mag iedereen zetten en gasten toevoegen/weghalen.
// Alleen de drie aanwezigheidskolommen worden geschreven, met versiecontrole op 'bijgewerkt',
// zodat gelijktijdige antwoorden van verschillende mensen elkaar nooit wissen.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const s = await vereis(req); if (s instanceof NextResponse) return s

  const body = await req.json().catch(() => ({}))
  const naam = String(body?.naam || '').trim()
  const status = body?.status as AanwezigheidStatus | null
  if (!naam || naam.length > 80 || naam.includes(',')) return NextResponse.json({ fout: 'Ongeldige naam.' }, { status: 400 })
  if (status !== null && !STATUSSEN.includes(status)) return NextResponse.json({ fout: 'Ongeldige status.' }, { status: 400 })
  if (!s.isModerator && (!zelfdeNaam(naam, s.naam) || status === null)) {
    return NextResponse.json({ fout: 'Je kunt alleen je eigen aanwezigheid doorgeven.' }, { status: 403 })
  }

  for (let poging = 0; poging < 5; poging++) {
    const { data: rij, error } = await db().from('vergaderingen')
      .select('aanwezig, online, afwezig, bijgewerkt').eq('id', id).maybeSingle()
    if (error) { console.error(error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
    if (!rij) return NextResponse.json({ fout: 'Vergadering niet gevonden.' }, { status: 404 })

    // Voor jezelf altijd de naam uit je login gebruiken (exacte schrijfwijze)
    const teZetten = zelfdeNaam(naam, s.naam) ? s.naam : naam
    const nieuw = zetStatus({ aanwezig: rij.aanwezig || '', online: rij.online || '', afwezig: rij.afwezig || '' }, teZetten, status)
    const { data, error: fout } = await db().from('vergaderingen')
      .update(nieuw).eq('id', id).eq('bijgewerkt', rij.bijgewerkt).select('bijgewerkt')
    if (fout) { console.error(fout); return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 }) }
    if (data && data.length > 0) return NextResponse.json({ ...nieuw, bijgewerkt: data[0].bijgewerkt })
    // Iemand schreef er net tussendoor: opnieuw met de verse versie
  }
  return NextResponse.json({ fout: 'Het is even druk; probeer het nog een keer.' }, { status: 503 })
}
