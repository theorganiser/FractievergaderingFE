import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'
import { kalenderVelden } from '../velden'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { error } = await db().from('kalender_items').update(kalenderVelden(await req.json())).eq('id', params.id)
  if (error) { console.error('Kalender update fout:', error); return NextResponse.json({ fout: 'Bijwerken mislukt.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { error } = await db().from('kalender_items').delete().eq('id', params.id)
  if (error) { console.error('Kalender verwijderen fout:', error); return NextResponse.json({ fout: 'Verwijderen mislukt.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
