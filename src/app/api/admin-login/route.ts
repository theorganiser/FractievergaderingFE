import { NextRequest, NextResponse } from 'next/server'
import { maakAdminCookie, maakLezerCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { wachtwoord, naam } = await req.json()
  const juistWachtwoord = process.env.ADMIN_PASSWORD
  if (!juistWachtwoord) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
  if (wachtwoord !== juistWachtwoord) return NextResponse.json({ fout: 'Onjuist wachtwoord.' }, { status: 401 })
  const adminCookie = await maakAdminCookie()
  const lezerCookie = await maakLezerCookie(naam || 'Beheerder')
  const response = NextResponse.json({ ok: true })
  response.headers.append('Set-Cookie', adminCookie)
  response.headers.append('Set-Cookie', lezerCookie)
  return response
}
