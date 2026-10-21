import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { haalPortefeuillesServer } from '@/lib/server/portefeuilles'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  return NextResponse.json(await haalPortefeuillesServer())
}
