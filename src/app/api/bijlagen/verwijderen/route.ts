import { NextRequest, NextResponse } from 'next/server'
import { vereis } from '@/lib/sessie'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

// Verwijdert het bestand van een bijlage uit Storage. Body: { pad, vergaderingId }
// Alleen als het bestand in de map van díe vergadering staat. Een gekopieerde vergadering of
// een overgenomen punt kan nog naar het bestand van een andere vergadering verwijzen; dan
// wordt alleen de verwijzing weggehaald (door de aanroeper) en blijft het bestand bestaan.
export async function POST(req: NextRequest) {
  const s = await vereis(req); if (s instanceof NextResponse) return s
  const { pad, vergaderingId } = await req.json().catch(() => ({}))
  if (typeof pad !== 'string' || !pad || pad.includes('..')) return NextResponse.json({ fout: 'Ongeldig pad.' }, { status: 400 })
  if (typeof vergaderingId !== 'string' || !vergaderingId) return NextResponse.json({ fout: 'Ontbrekende vergadering.' }, { status: 400 })

  if (!pad.startsWith(`${vergaderingId}/`)) {
    return NextResponse.json({ ok: true, bestandBehouden: true })
  }

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
