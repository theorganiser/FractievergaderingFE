import { NextRequest, NextResponse } from 'next/server'
import { verifieerToken, COOKIE_ADMIN } from '@/lib/auth'
import { namenMetWachtwoord, verwijderWachtwoord } from '@/lib/wachtwoord'

async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_ADMIN)?.value
  return !!token && !!(await verifieerToken(token))
}

// Welke gebruikers hebben een eigen wachtwoord? (alleen namen, nooit de hashes)
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ fout: 'Alleen voor beheerders.' }, { status: 403 })
  try {
    return NextResponse.json({ namen: await namenMetWachtwoord() })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ fout: 'Ophalen mislukt.' }, { status: 500 })
  }
}

// Reset: het eigen wachtwoord wordt verwijderd, de persoon kan weer met de gedeelde code inloggen.
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ fout: 'Alleen voor beheerders.' }, { status: 403 })
  const { naam } = await req.json()
  if (!naam) return NextResponse.json({ fout: 'Geen naam opgegeven.' }, { status: 400 })
  try {
    await verwijderWachtwoord(naam)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ fout: 'Resetten mislukt.' }, { status: 500 })
  }
}
