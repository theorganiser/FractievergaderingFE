import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'
import { rijNaarVergadering, vergaderingNaarRij } from '@/lib/vergaderingRij'
import type { Vergadering } from '@/lib/types'
import { fractielidWijzigingFout } from '@/lib/rechten'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { data, error } = await db().from('vergaderingen').select('*').order('datum', { ascending: false })
  if (error) { console.error(error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
  return NextResponse.json((data || []).map(rijNaarVergadering))
}

// Opslaan. Body: { vergadering, verwachtBijgewerkt? }
// - Met verwachtBijgewerkt wordt alleen geschreven als de rij nog precies die versie is; anders
//   409, zodat de browser de verse versie ophaalt en het opnieuw probeert. Zo overschrijft
//   niemand meer de wijzigingen van een ander.
// - Zonder verwachtBijgewerkt: gewoon upsert (nieuwe vergadering) — alleen moderator/beheerder.
// - Een gewoon fractielid mag alleen toevoegen wat de leesweergave toevoegt (notulen, notities,
//   bijlagen, eigen punten, bespreekverzoeken); zie fractielidWijzigingFout in lib/rechten.ts.
export async function POST(req: NextRequest) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const body = await req.json().catch(() => null)
  const v: Vergadering = body?.vergadering ?? body
  const verwacht: string | undefined = body?.vergadering ? body.verwachtBijgewerkt : undefined
  if (!v?.id || !v.deeltoken) return NextResponse.json({ fout: 'Ongeldige vergadering.' }, { status: 400 })

  const rij = vergaderingNaarRij(v)

  if (!s.isModerator) {
    if (!verwacht) return NextResponse.json({ fout: 'Alleen moderators en beheerders kunnen een vergadering aanmaken.' }, { status: 403 })
    const { data: huidig, error } = await db().from('vergaderingen').select('*').eq('id', v.id).maybeSingle()
    if (error) { console.error(error); return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 }) }
    if (!huidig) return NextResponse.json({ fout: 'Deze vergadering bestaat niet meer.' }, { status: 404 })
    if (huidig.bijgewerkt !== verwacht) return NextResponse.json({ fout: 'Iemand anders heeft deze vergadering net gewijzigd.' }, { status: 409 })
    const fout = fractielidWijzigingFout(rijNaarVergadering(huidig), v)
    if (fout) {
      console.warn(`Wijziging geweigerd voor ${s.naam} (${v.id}): ${fout}`)
      return NextResponse.json({ fout }, { status: 403 })
    }
  }

  if (verwacht) {
    // id en aangemaakt veranderen nooit; bijgewerkt zet de database-trigger zelf
    const { id: _id, aangemaakt: _aangemaakt, ...velden } = rij
    void _id; void _aangemaakt
    const { data, error } = await db().from('vergaderingen')
      .update(velden).eq('id', v.id).eq('bijgewerkt', verwacht).select('bijgewerkt')
    if (error) { console.error(error); return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 }) }
    if (!data || data.length === 0) {
      const { data: bestaat } = await db().from('vergaderingen').select('id').eq('id', v.id).maybeSingle()
      if (!bestaat) return NextResponse.json({ fout: 'Deze vergadering bestaat niet meer.' }, { status: 404 })
      return NextResponse.json({ fout: 'Iemand anders heeft deze vergadering net gewijzigd.' }, { status: 409 })
    }
    return NextResponse.json({ ok: true, bijgewerkt: data[0].bijgewerkt })
  }

  const { data, error } = await db().from('vergaderingen').upsert(rij, { onConflict: 'id' }).select('bijgewerkt').single()
  if (error) { console.error(error); return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 }) }
  return NextResponse.json({ ok: true, bijgewerkt: data?.bijgewerkt })
}
