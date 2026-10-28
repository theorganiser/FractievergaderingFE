import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { vereis } from '@/lib/sessie'
import { AgendaInvoer, AgendaImportFout, leesAgenda } from '@/lib/server/agendaImport'

// Een agenda van ~7 pagina's plus de motielijst duurt meestal 20-60 seconden.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const s = await vereis(req, 'moderator'); if (s instanceof NextResponse) return s
  const invoer = await req.json() as AgendaInvoer

  if (!invoer.pdf && !invoer.tekst?.trim()) {
    return NextResponse.json({ fout: 'Geen agenda opgegeven (PDF of tekst).' }, { status: 400 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ fout: 'ANTHROPIC_API_KEY ontbreekt.' }, { status: 500 })
  }

  try {
    return NextResponse.json(await leesAgenda(invoer))
  } catch (err) {
    console.error('Agenda-import mislukt:', err)
    if (err instanceof AgendaImportFout) {
      return NextResponse.json({ fout: err.message }, { status: 500 })
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ fout: 'Te veel verzoeken bij de AI — probeer het over een minuut opnieuw.' }, { status: 503 })
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ fout: `AI-extractie mislukt (${err.status}): ${err.message}` }, { status: 500 })
    }
    return NextResponse.json({ fout: 'Kon het AI-antwoord niet verwerken. Probeer het opnieuw.' }, { status: 500 })
  }
}
