import { NextRequest, NextResponse } from 'next/server'
import { maakLezerCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { naam, code } = await req.json()
  if (!naam?.trim()) return NextResponse.json({ fout: 'Vul je naam in.' }, { status: 400 })
  const juisteCode = process.env.READER_PASSWORD
  if (!juisteCode) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
  if (code !== juisteCode) return NextResponse.json({ fout: 'Onjuiste toegangscode.' }, { status: 401 })
  const cookie = await maakLezerCookie(naam.trim())
  const response = NextResponse.json({ ok: true, naam: naam.trim() })
  response.headers.set('Set-Cookie', cookie)
  return response
}
