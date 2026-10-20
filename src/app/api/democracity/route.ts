import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { data, error } = await db().from('democracity_dagen')
    .select('*, democracity_aanmeldingen(id, naam, aangemaakt_op)')
    .order('datum', { ascending: true })
    .order('tijd', { ascending: true })
  if (error) { console.error('Democracity laden fout:', error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
  return NextResponse.json(data || [])
}

// Aanmelden / afmelden (met de naam uit je login) en — alleen beheerder — dagen toevoegen/verwijderen.
export async function POST(req: NextRequest) {
  const sessie = await vereis(req); if (sessie instanceof NextResponse) return sessie
  const { naam, isAdmin } = sessie
  if (!naam) return NextResponse.json({ fout: 'Je bent niet ingelogd.' }, { status: 401 })

  const body = await req.json()
  const actie = body.actie as string

  try {
    if (actie === 'aanmelden') {
      if (!body.dagId) return NextResponse.json({ fout: 'Geen dag opgegeven.' }, { status: 400 })
      const { data: dag } = await db().from('democracity_dagen').select('datum').eq('id', body.dagId).maybeSingle()
      if (!dag) return NextResponse.json({ fout: 'Deze dag bestaat niet meer.' }, { status: 404 })
      const { error } = await db().from('democracity_aanmeldingen').insert({ dag_id: body.dagId, naam })
      if (error) {
        if (/DAG_VOL/.test(error.message)) return NextResponse.json({ fout: 'Deze dag is al vol (2 personen). Kies een andere dag.' }, { status: 409 })
        if (error.code === '23505') return NextResponse.json({ ok: true }) // al aangemeld
        throw error
      }
      return NextResponse.json({ ok: true })
    }

    if (actie === 'afmelden') {
      if (!body.dagId) return NextResponse.json({ fout: 'Geen dag opgegeven.' }, { status: 400 })
      // Je kunt jezelf afmelden; de beheerder mag ook iemand anders afmelden (body.naam).
      const wie = isAdmin && body.naam ? String(body.naam) : naam
      const { error } = await db().from('democracity_aanmeldingen').delete().eq('dag_id', body.dagId).eq('naam', wie)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (actie === 'dag-toevoegen' || actie === 'dag-verwijderen') {
      if (!isAdmin) return NextResponse.json({ fout: 'Alleen de beheerder kan dagen beheren.' }, { status: 403 })
      if (actie === 'dag-toevoegen') {
        const { datum, tijd, school } = body
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datum || '') || !String(school || '').trim()) {
          return NextResponse.json({ fout: 'Vul een datum en een school in.' }, { status: 400 })
        }
        const { error } = await db().from('democracity_dagen').insert({ datum, tijd: String(tijd || '').trim(), school: String(school).trim() })
        if (error) {
          if (error.code === '23505') return NextResponse.json({ fout: 'Deze dag (zelfde datum, tijd en school) staat er al.' }, { status: 409 })
          throw error
        }
        return NextResponse.json({ ok: true })
      }
      if (!body.dagId) return NextResponse.json({ fout: 'Geen dag opgegeven.' }, { status: 400 })
      const { error } = await db().from('democracity_dagen').delete().eq('id', body.dagId)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ fout: 'Onbekende actie.' }, { status: 400 })
  } catch (err) {
    console.error('Democracity-fout:', err)
    return NextResponse.json({ fout: 'Er ging iets mis. Is supabase-democracity.sql uitgevoerd?' }, { status: 500 })
  }
}
