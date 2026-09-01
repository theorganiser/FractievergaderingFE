import { NextRequest, NextResponse } from 'next/server'
import { verifieerToken, COOKIE_LEZER, COOKIE_ADMIN, COOKIE_MODERATOR } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const lezerToken = req.cookies.get(COOKIE_LEZER)?.value
  const adminToken = req.cookies.get(COOKIE_ADMIN)?.value
  const moderatorToken = req.cookies.get(COOKIE_MODERATOR)?.value
  const lezerPayload = lezerToken ? await verifieerToken(lezerToken) : null
  const adminPayload = adminToken ? await verifieerToken(adminToken) : null
  const moderatorPayload = moderatorToken ? await verifieerToken(moderatorToken) : null
  return NextResponse.json({
    heeftToegang: !!lezerPayload,
    isAdmin: !!adminPayload,
    isModerator: !!moderatorPayload || !!adminPayload, // admin heeft ook moderator rechten
    naam: lezerPayload?.naam as string || '',
  })
}
