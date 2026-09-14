import { NextRequest, NextResponse } from 'next/server'
import { markeerAlsGelezen, MailSoort } from '@/lib/mail'

export async function POST(req: NextRequest) {
  const { soort, uid } = await req.json() as { soort: MailSoort; uid: number }

  if (soort !== 'events' && soort !== 'ingekomen') {
    return NextResponse.json({ fout: 'Ongeldige soort.' }, { status: 400 })
  }
  if (typeof uid !== 'number') {
    return NextResponse.json({ fout: 'Ongeldige uid.' }, { status: 400 })
  }

  try {
    await markeerAlsGelezen(soort, uid)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('IMAP markeer fout:', err)
    return NextResponse.json({ fout: 'Kon de mail niet als gelezen markeren.' }, { status: 500 })
  }
}
