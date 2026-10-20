import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { db } from '@/lib/server/db'

export const dynamic = 'force-dynamic'

const PAGINA_GROOTTE = 50

// ?pagina=0,1,2…
export async function GET(req: NextRequest) {
  const s = await vereis(req, 'admin'); if (s instanceof NextResponse) return s
  const pagina = Math.max(0, parseInt(req.nextUrl.searchParams.get('pagina') || '0', 10) || 0)
  const van = pagina * PAGINA_GROOTTE
  const { data, error } = await db().from('login_log')
    .select('*')
    .order('ingelogd_op', { ascending: false })
    .range(van, van + PAGINA_GROOTTE - 1)
  if (error) { console.error(error); return NextResponse.json({ fout: 'Laden mislukt.' }, { status: 500 }) }
  return NextResponse.json(data || [])
}
