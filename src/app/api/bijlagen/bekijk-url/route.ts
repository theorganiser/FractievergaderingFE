import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  const { pad } = await req.json()
  if (!pad) return NextResponse.json({ fout: 'Ontbrekend pad.' }, { status: 400 })

  try {
    const { data, error } = await getSupabaseAdmin().storage.from('bijlagen').createSignedUrl(pad, 3600)
    if (error || !data) {
      console.error('Kon signed url niet aanmaken:', error)
      return NextResponse.json({ fout: 'Kon geen link naar het bestand maken.' }, { status: 500 })
    }
    return NextResponse.json({ url: data.signedUrl })
  } catch (err) {
    console.error('supabaseAdmin fout:', err)
    return NextResponse.json({ fout: 'Serverconfiguratiefout (service-role key).' }, { status: 500 })
  }
}
