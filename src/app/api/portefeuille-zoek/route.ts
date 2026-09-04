import { NextRequest, NextResponse } from 'next/server'
import { haalPortefeuilles } from '@/lib/portefeuilles'

export async function POST(req: NextRequest) {
  const { vraag } = await req.json()

  if (!vraag?.trim()) {
    return NextResponse.json({ fout: 'Geen vraag opgegeven.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ fout: 'ANTHROPIC_API_KEY ontbreekt.' }, { status: 500 })
  }

  // Altijd vers uit de database — nooit vertrouwen op wat de client meestuurt
  const portefeuilles = await haalPortefeuilles()
  if (portefeuilles.length === 0) {
    return NextResponse.json({ fout: 'Geen portefeuilleverdeling gevonden.' }, { status: 500 })
  }

  const lijstTekst = portefeuilles
    .map(p => `${p.volgorde}. ${p.onderwerp}${p.programma ? ` [programma ${p.programma}]` : ''} — woordvoerders: ${[p.woordvoerder_1, p.woordvoerder_2, p.woordvoerder_3].filter(Boolean).join(', ')}`)
    .join('\n')

  const systeemPrompt = `Je helpt fractieleden van GDP – Goois Democratisch Platform de juiste woordvoerder(s) te vinden voor een onderwerp, op basis van de portefeuilleverdeling. Antwoord ALLEEN met geldige JSON, zonder markdown-codeblokken en zonder andere tekst, in exact dit formaat:
{"gevonden": true, "treffers": [{"onderwerp": "...", "woordvoerders": ["...", "..."]}], "toelichting": "korte uitleg in 1-2 zinnen waarom dit past"}

Als er geen enkel onderwerp goed past, geef dan: {"gevonden": false, "treffers": [], "toelichting": "korte uitleg waarom niets past"}
Geef maximaal 3 treffers, op volgorde van relevantie.`

  const gebruikersPrompt = `PORTEFEUILLEVERDELING:
${lijstTekst}

VRAAG: ${vraag.trim()}`

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
        max_tokens: 500,
        system: systeemPrompt,
        messages: [{ role: 'user', content: gebruikersPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API fout:', response.status, err)
      let foutBericht = 'AI-zoeken mislukt.'
      if (response.status === 401) foutBericht = 'API key ongeldig of ontbreekt.'
      if (response.status === 529) foutBericht = 'Anthropic API overbelast. Probeer opnieuw.'
      return NextResponse.json({ fout: foutBericht }, { status: 500 })
    }

    const data = await response.json()
    const inhoud = (data.content?.[0]?.text || '').trim()

    try {
      const schoon = inhoud.replace(/^```json\s*|\s*```$/g, '').trim()
      const resultaat = JSON.parse(schoon)
      return NextResponse.json(resultaat)
    } catch (parseErr) {
      console.error('Kon AI-antwoord niet parsen:', inhoud, parseErr)
      return NextResponse.json({ fout: 'Kon het AI-antwoord niet verwerken. Probeer het opnieuw.' }, { status: 500 })
    }
  } catch (err) {
    console.error('Fout bij portefeuille-zoeken:', err)
    return NextResponse.json({ fout: 'Er ging iets mis.' }, { status: 500 })
  }
}
