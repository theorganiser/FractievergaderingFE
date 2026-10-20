import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'
import { rijNaarVergadering, vergaderingNaarRij } from '@/lib/vergaderingRij'
import type { Vergadering } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { data, error } = await db().from('vergaderingen').select('*').order('datum', { ascending: false })
  if (error) { console.error(error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
  return NextResponse.json((data || []).map(rijNaarVergadering))
}

// Opslaan (upsert). Voor nu mag elk ingelogd fractielid schrijven, net als vóór de API-routes.
export async function POST(req: NextRequest) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const v = await req.json() as Vergadering
  if (!v?.id || !v.deeltoken) return NextResponse.json({ fout: 'Ongeldige vergadering.' }, { status: 400 })
  const { error } = await db().from('vergaderingen').upsert(vergaderingNaarRij(v), { onConflict: 'id' })
  if (error) { console.error(error); return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
