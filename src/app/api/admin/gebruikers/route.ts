import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'
import { ROLLEN } from './rollen'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const s = await vereis(req, 'admin'); if (s instanceof NextResponse) return s
  const { data, error } = await db().from('gebruikers').select('*').order('naam')
  if (error) { console.error(error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const s = await vereis(req, 'admin'); if (s instanceof NextResponse) return s
  const { naam, rol } = await req.json()
  if (!String(naam || '').trim()) return NextResponse.json({ fout: 'Vul een naam in.' }, { status: 400 })
  if (!ROLLEN.includes(rol)) return NextResponse.json({ fout: 'Ongeldige rol.' }, { status: 400 })
  const { error } = await db().from('gebruikers').insert({ naam: String(naam).trim(), rol })
  if (error) {
    if (error.code === '23505') return NextResponse.json({ fout: 'Deze naam bestaat al.' }, { status: 409 })
    console.error(error); return NextResponse.json({ fout: 'Toevoegen mislukt.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
