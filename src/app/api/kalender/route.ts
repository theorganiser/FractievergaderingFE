import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'
import { kalenderVelden } from './velden'

export const dynamic = 'force-dynamic'

// ?vanaf=YYYY-MM-DD&tot=YYYY-MM-DD (beide optioneel)
export async function GET(req: NextRequest) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const vanaf = req.nextUrl.searchParams.get('vanaf')
  const tot = req.nextUrl.searchParams.get('tot')
  let query = db().from('kalender_items').select('*').order('datum', { ascending: true })
  if (vanaf) query = query.gte('datum', vanaf)
  if (tot) query = query.lte('datum', tot)
  const { data, error } = await query
  if (error) { console.error('Kalender laden fout:', error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { data, error } = await db().from('kalender_items').insert(kalenderVelden(await req.json())).select().single()
  if (error) { console.error('Kalender toevoegen fout:', error); return NextResponse.json({ fout: 'Toevoegen mislukt.' }, { status: 500 }) }
  return NextResponse.json(data)
}
