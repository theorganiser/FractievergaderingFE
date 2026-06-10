import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { tekst } = await req.json()

  if (!tekst?.trim()) {
    return NextResponse.json({ fout: 'Geen tekst opgegeven.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ fout: 'ANTHROPIC_API_KEY ontbreekt in omgevingsvariabelen.' }, { status: 500 })
  }

  // Haal system prompt op uit Supabase
  const { data: instructieData } = await supabase
    .from('persbericht_instructies')
    .select('systeem_prompt')
    .limit(1)
    .single()

  const systeemPrompt = instructieData?.systeem_prompt || 
    'Je bent een communicatiemedewerker van GDP – Goois Democratisch Platform.'

  const gebruikersPrompt = `Genereer op basis van de volgende ruwe tekst drie versies van een persbericht voor GDP – Goois Democratisch Platform.

RUWE TEKST:
${tekst}

Genereer precies drie versies in dit formaat (gebruik exact deze scheidingstekens):

===WEBSITE===
[Uitgebreid artikel, informatief en formeel, met een koptitel en alinea's, minimaal 300 woorden]

===LINKEDIN===
[Zakelijk en professioneel, lichte structuur met korte alinea's, hashtags onderaan, 150-250 woorden]

===FACEBOOK===
[Kort, toegankelijke taal, uitnodigend voor reacties, eindig met een vraag of oproep, 80-150 woorden]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systeemPrompt,
        messages: [{ role: 'user', content: gebruikersPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API fout:', response.status, err)
      let foutBericht = 'AI-generatie mislukt.'
      if (response.status === 401) foutBericht = 'API key ongeldig of ontbreekt. Controleer ANTHROPIC_API_KEY in Vercel.'
      if (response.status === 529) foutBericht = 'Anthropic API overbelast. Probeer opnieuw.'
      if (response.status === 400) foutBericht = 'Verzoek ongeldig: ' + err.substring(0, 100)
      return NextResponse.json({ fout: foutBericht }, { status: 500 })
    }

    const data = await response.json()
    const inhoud = data.content?.[0]?.text || ''

    // Parse de drie versies
    const website = inhoud.match(/===WEBSITE===\n([\s\S]*?)(?====LINKEDIN===|$)/)?.[1]?.trim() || ''
    const linkedin = inhoud.match(/===LINKEDIN===\n([\s\S]*?)(?====FACEBOOK===|$)/)?.[1]?.trim() || ''
    const facebook = inhoud.match(/===FACEBOOK===\n([\s\S]*?)$/)?.[1]?.trim() || ''

    return NextResponse.json({ website, linkedin, facebook })
  } catch (err) {
    console.error('Fout bij genereren:', err)
    return NextResponse.json({ fout: 'Er ging iets mis.' }, { status: 500 })
  }
}
