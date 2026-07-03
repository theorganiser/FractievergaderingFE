import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { tekst, modus } = await req.json()
  // modus: 'genereer' | 'feedback' | 'sociaal'

  if (!tekst?.trim()) {
    return NextResponse.json({ fout: 'Geen tekst opgegeven.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ fout: 'ANTHROPIC_API_KEY ontbreekt.' }, { status: 500 })
  }

  const { data: instructieData } = await supabase
    .from('persbericht_instructies')
    .select('systeem_prompt')
    .limit(1)
    .single()

  const systeemPrompt = instructieData?.systeem_prompt ||
    'Je bent een communicatiemedewerker van GDP – Goois Democratisch Platform.'

  let gebruikersPrompt = ''

  if (modus === 'genereer') {
    gebruikersPrompt = `Genereer op basis van de volgende ruwe tekst drie versies van een persbericht voor GDP – Goois Democratisch Platform.

RUWE TEKST:
${tekst}

Genereer precies drie versies in dit formaat (gebruik exact deze scheidingstekens):

===WEBSITE===
[Uitgebreid artikel, informatief en formeel, met een koptitel en alinea's, minimaal 300 woorden]

===LINKEDIN===
[Zakelijk en professioneel, lichte structuur met korte alinea's, hashtags onderaan, 150-250 woorden]

===FACEBOOK===
[Kort, toegankelijke taal, uitnodigend voor reacties, eindig met een vraag of oproep, 80-150 woorden]`

  } else if (modus === 'feedback') {
    gebruikersPrompt = `Geef feedback op de volgende tekst. Pas de tekst NIET aan. Geef alleen tips, opmerkingen en verbeterpunten.

Geef je feedback in dit formaat:

===FEEDBACK===
[Puntsgewijze tips en opmerkingen. Benoem sterke punten en verbeterpunten. Geef concrete suggesties zonder de tekst zelf te herschrijven. Max 300 woorden.]

TEKST:
${tekst}`

  } else if (modus === 'sociaal') {
    gebruikersPrompt = `Maak op basis van de volgende goedgekeurde tekst een Facebook-bericht en een LinkedIn-bericht voor GDP – Goois Democratisch Platform.

TEKST:
${tekst}

Genereer precies twee versies in dit formaat:

===LINKEDIN===
[Zakelijk en professioneel, lichte structuur, hashtags onderaan, 150-250 woorden]

===FACEBOOK===
[Kort, toegankelijke taal, uitnodigend voor reacties, eindig met een vraag of oproep, 80-150 woorden]`
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: systeemPrompt,
        messages: [{ role: 'user', content: gebruikersPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API fout:', response.status, err)
      let foutBericht = 'AI-generatie mislukt.'
      if (response.status === 401) foutBericht = 'API key ongeldig of ontbreekt.'
      if (response.status === 529) foutBericht = 'Anthropic API overbelast. Probeer opnieuw.'
      return NextResponse.json({ fout: foutBericht }, { status: 500 })
    }

    const data = await response.json()
    const inhoud = data.content?.[0]?.text || ''

    if (modus === 'genereer') {
      const website = inhoud.match(/===WEBSITE===\n([\s\S]*?)(?====LINKEDIN===|$)/)?.[1]?.trim() || ''
      const linkedin = inhoud.match(/===LINKEDIN===\n([\s\S]*?)(?====FACEBOOK===|$)/)?.[1]?.trim() || ''
      const facebook = inhoud.match(/===FACEBOOK===\n([\s\S]*?)$/)?.[1]?.trim() || ''
      return NextResponse.json({ modus: 'genereer', website, linkedin, facebook })

    } else if (modus === 'feedback') {
      const feedback = inhoud.match(/===FEEDBACK===\n([\s\S]*?)$/)?.[1]?.trim() || inhoud.trim()
      return NextResponse.json({ modus: 'feedback', feedback })

    } else if (modus === 'sociaal') {
      const linkedin = inhoud.match(/===LINKEDIN===\n([\s\S]*?)(?====FACEBOOK===|$)/)?.[1]?.trim() || ''
      const facebook = inhoud.match(/===FACEBOOK===\n([\s\S]*?)$/)?.[1]?.trim() || ''
      return NextResponse.json({ modus: 'sociaal', linkedin, facebook })
    }

    return NextResponse.json({ fout: 'Onbekende modus.' }, { status: 400 })
  } catch (err) {
    console.error('Fout bij genereren:', err)
    return NextResponse.json({ fout: 'Er ging iets mis.' }, { status: 500 })
  }
}
