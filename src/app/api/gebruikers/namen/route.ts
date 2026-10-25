import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'

export const dynamic = 'force-dynamic'

// Namen van de actieve fractieleden (voor de aanwezigheidslijst). Geen rollen of andere velden.
export async function GET(req: NextRequest) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { data, error } = await db().from('gebruikers').select('naam').eq('actief', true).order('naam')
  if (error) { console.error(error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
  return NextResponse.json((data || []).map(r => r.naam as string))
}
