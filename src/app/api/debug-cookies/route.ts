import { NextRequest, NextResponse } from 'next/server'
import { verifieerToken, COOKIE_LEZER, COOKIE_ADMIN } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const cookies = req.cookies.getAll()
  
  const lezerToken = req.cookies.get(COOKIE_LEZER)?.value
  const adminToken = req.cookies.get(COOKIE_ADMIN)?.value

  // Verifieer tokens
  const lezerPayload = lezerToken ? await verifieerToken(lezerToken) : null
  const adminPayload = adminToken ? await verifieerToken(adminToken) : null

  return NextResponse.json({
    cookies: cookies.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length })),
    lezerTokenGeldig: !!lezerPayload,
    adminTokenGeldig: !!adminPayload,
    lezerRol: lezerPayload?.rol || null,
    adminRol: adminPayload?.rol || null,
    nodeEnv: process.env.NODE_ENV,
    hasAdminPw: !!process.env.ADMIN_PASSWORD,
    hasReaderPw: !!process.env.READER_PASSWORD,
    hasJwtSecret: !!process.env.JWT_SECRET,
    jwtSecretLength: process.env.JWT_SECRET?.length || 0,
  })
}
