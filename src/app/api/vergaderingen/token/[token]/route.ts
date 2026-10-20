import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'
import { rijNaarVergadering } from '@/lib/vergaderingRij'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { data, error } = await db().from('vergaderingen').select('*').eq('deeltoken', params.token).maybeSingle()
  if (error) { console.error(error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
  if (!data) return NextResponse.json({ fout: 'Niet gevonden.' }, { status: 404 })
  return NextResponse.json(rijNaarVergadering(data))
}
