import { NextRequest, NextResponse } from 'next/server'
import { maakLezerCookie } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  // Rate limiting: max 5 pogingen per minuut per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'onbekend'
  const { toegestaan, resterend, resetOver } = checkRateLimit(ip)

  if (!toegestaan) {
    return NextResponse.json(
      { fout: `Te veel pogingen. Probeer het over ${Math.ceil(resetOver / 1000)} seconden opnieuw.` },
      { status: 429 }
    )
  }

  const { naam, code } = await req.json()
  if (!naam?.trim()) return NextResponse.json({ fout: 'Vul je naam in.' }, { status: 400 })

  const juisteCode = process.env.READER_PASSWORD
  if (!juisteCode) return NextResponse.json({ fout: 'Server configuratiefout.' }, { status: 500 })
  if (code !== juisteCode) return NextResponse.json({ fout: `Onjuiste toegangscode. Nog ${resterend} poging(en).` }, { status: 401 })

  const cookie = await maakLezerCookie(naam.trim())
  const response = NextResponse.json({ ok: true, naam: naam.trim() })
  response.headers.set('Set-Cookie', cookie)
  return response
}
