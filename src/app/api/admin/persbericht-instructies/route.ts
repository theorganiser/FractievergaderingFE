import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const s = await vereis(req, 'admin'); if (s instanceof NextResponse) return s
  const { data, error } = await db().from('persbericht_instructies').select('systeem_prompt').limit(1).maybeSingle()
  if (error) { console.error(error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
  return NextResponse.json({ systeemPrompt: data?.systeem_prompt || '' })
}

export async function PUT(req: NextRequest) {
  const s = await vereis(req, 'admin'); if (s instanceof NextResponse) return s
  const { systeemPrompt } = await req.json()
  const { error } = await db().from('persbericht_instructies').update({
    systeem_prompt: String(systeemPrompt ?? ''),
    bijgewerkt_op: new Date().toISOString(),
    bijgewerkt_door: s.naam || 'Beheerder',
  }).neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) { console.error(error); return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
