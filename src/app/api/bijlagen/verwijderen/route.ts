import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const { pad } = await req.json()
  if (!pad) return NextResponse.json({ fout: 'Ontbrekend pad.' }, { status: 400 })

  try {
    const { error } = await getSupabaseAdmin().storage.from('bijlagen').remove([pad])
    if (error) {
      // Niet fataal: de metadata wordt hierna alsnog verwijderd door de aanroeper,
      // een enkel weeswezen-bestand in Storage is minder erg dan een kapotte lijst.
      console.error('Kon bestand niet verwijderen uit storage:', error)
    }
  } catch (err) {
    console.error('supabaseAdmin fout:', err)
  }

  return NextResponse.json({ ok: true })
}
