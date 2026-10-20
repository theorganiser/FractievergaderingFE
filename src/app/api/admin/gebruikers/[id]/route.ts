import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'
import { ROLLEN } from '../rollen'

// Body: { rol } en/of { actief }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await vereis(req, 'admin'); if (s instanceof NextResponse) return s
  const body = await req.json()
  const wijziging: Record<string, unknown> = {}
  if ('rol' in body) {
    if (!ROLLEN.includes(body.rol)) return NextResponse.json({ fout: 'Ongeldige rol.' }, { status: 400 })
    wijziging.rol = body.rol
  }
  if ('actief' in body) wijziging.actief = !!body.actief
  if (Object.keys(wijziging).length === 0) return NextResponse.json({ fout: 'Niets te wijzigen.' }, { status: 400 })
  const { error } = await db().from('gebruikers').update(wijziging).eq('id', params.id)
  if (error) { console.error(error); return NextResponse.json({ fout: 'Bijwerken mislukt.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await vereis(req, 'admin'); if (s instanceof NextResponse) return s
  const { error } = await db().from('gebruikers').delete().eq('id', params.id)
  if (error) { console.error(error); return NextResponse.json({ fout: 'Verwijderen mislukt.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
