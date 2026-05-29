import { NextRequest, NextResponse } from 'next/server'
import { verifieerToken, COOKIE_LEZER, COOKIE_ADMIN } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const lezerToken = req.cookies.get(COOKIE_LEZER)?.value
  const adminToken = req.cookies.get(COOKIE_ADMIN)?.value
  const lezerPayload = lezerToken ? await verifieerToken(lezerToken) : null
  const adminPayload = adminToken ? await verifieerToken(adminToken) : null
  return NextResponse.json({
    heeftToegang: !!lezerPayload,
    isAdmin: !!adminPayload,
    naam: lezerPayload?.naam as string || '',
  })
}
