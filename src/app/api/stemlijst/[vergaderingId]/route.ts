import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ vergaderingId: string }> }) {
  const { vergaderingId } = await params
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { data, error } = await db().from('stemlijst_stemmen')
    .select('item_key, stem, notitie')
    .eq('vergadering_id', vergaderingId)
  if (error) { console.error(error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ vergaderingId: string }> }) {
  const { vergaderingId } = await params
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { itemKey, stem, notitie } = await req.json()
  if (!itemKey) return NextResponse.json({ fout: 'Geen item opgegeven.' }, { status: 400 })
  const { error } = await db().from('stemlijst_stemmen').upsert({
    vergadering_id: vergaderingId,
    item_key: String(itemKey),
    stem: String(stem ?? ''),
    notitie: String(notitie ?? ''),
    bijgewerkt_op: new Date().toISOString(),
  }, { onConflict: 'vergadering_id,item_key' })
  if (error) { console.error(error); return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
