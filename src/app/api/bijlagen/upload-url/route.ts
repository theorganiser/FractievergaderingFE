import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const TOEGESTANE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_GROOTTE = 10 * 1024 * 1024 // 10MB

function sanitiseerBestandsnaam(naam: string): string {
  return naam.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(-100)
}

export async function POST(req: NextRequest) {
  const { vergaderingId, type, grootte, bestandsnaam } = await req.json()

  if (!vergaderingId || !bestandsnaam) {
    return NextResponse.json({ fout: 'Ontbrekende gegevens.' }, { status: 400 })
  }
  if (!TOEGESTANE_TYPES.includes(type)) {
    return NextResponse.json({ fout: 'Alleen PDF of afbeeldingen (jpg, png, webp, gif) zijn toegestaan.' }, { status: 400 })
  }
  if (typeof grootte !== 'number' || grootte > MAX_GROOTTE) {
    return NextResponse.json({ fout: `Bestand is te groot (max ${MAX_GROOTTE / 1024 / 1024}MB).` }, { status: 400 })
  }

  const pad = `${vergaderingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitiseerBestandsnaam(bestandsnaam)}`

  try {
    const { data, error } = await getSupabaseAdmin().storage.from('bijlagen').createSignedUploadUrl(pad)
    if (error || !data) {
      console.error('Kon signed upload url niet aanmaken:', error)
      return NextResponse.json({ fout: 'Kon geen upload-link aanmaken.' }, { status: 500 })
    }
    return NextResponse.json({ pad, token: data.token })
  } catch (err) {
    console.error('supabaseAdmin fout:', err)
    return NextResponse.json({ fout: 'Serverconfiguratiefout (service-role key).' }, { status: 500 })
  }
}
