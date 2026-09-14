import { NextRequest, NextResponse } from 'next/server'
import { haalOngelezenMails, MailSoort } from '@/lib/mail'

function foutDetail(err: unknown): string {
  if (err instanceof Error) {
    // @ts-expect-error -- ImapFlow errors carry extra diagnostic fields not in the base Error type
    const extra = err.code || err.responseStatus || err.authenticationFailed
    const basis = err.message?.trim() || err.name || 'onbekende fout (leeg error-object)'
    return extra ? `${basis} [${extra}]` : basis
  }
  try { return JSON.stringify(err) } catch { return String(err) }
}

export async function POST(req: NextRequest) {
  const { soort } = await req.json() as { soort: MailSoort }

  if (soort !== 'events' && soort !== 'ingekomen') {
    return NextResponse.json({ fout: 'Ongeldige soort.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ fout: 'ANTHROPIC_API_KEY ontbreekt.' }, { status: 500 })
  }

  let mails
  try {
    mails = await haalOngelezenMails(soort)
  } catch (err) {
    // Volledige details in de server-log (terminal bij `npm run dev`, of Vercel function-log in productie) —
    // inclusief alle eigen properties van het error-object, niet alleen .message.
    console.error('IMAP fout — volledig object:', err)
    if (err && typeof err === 'object') {
      console.error('IMAP fout — eigen properties:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    }
    return NextResponse.json({ fout: `Kon de mailbox niet uitlezen: ${foutDetail(err)}` }, { status: 500 })
  }

  if (mails.length === 0) {
    return NextResponse.json({ voorstellen: [] })
  }

  const systeemPrompt = soort === 'events'
    ? `Je haalt agenda-gegevens voor evenementen uit e-mails voor een gemeenteraadsfractie (GDP, Gooise Meren). Voor elke e-mail hieronder, geef terug: datum (YYYY-MM-DD, gok 2026 als het jaar niet genoemd wordt), starttijd (HH:MM, leeg als onduidelijk), locatie, omschrijving (korte titel, max 10 woorden) en categorie (exact een van: "belangrijk", "uitnodiging_regio", "overige_uitnodigingen" — of leeg als echt onduidelijk). Antwoord ALLEEN met geldige JSON: een array met exact ${mails.length} objecten, in dezelfde volgorde als de e-mails, elk in het formaat {"datum": "...", "starttijd": "...", "locatie": "...", "omschrijving": "...", "categorie": "..."}. Geen andere tekst, geen markdown-codeblokken.`
    : `Je vat inkomende e-mails samen voor de "Ingekomen stukken"-lijst van een gemeenteraadsfractie (GDP, Gooise Meren). Voor elke e-mail hieronder, geef terug: afzender (naam van persoon/organisatie, geen e-mailadres) en onderwerp (korte samenvatting waar het stuk over gaat, max 12 woorden). Antwoord ALLEEN met geldige JSON: een array met exact ${mails.length} objecten, in dezelfde volgorde als de e-mails, elk in het formaat {"afzender": "...", "onderwerp": "..."}. Geen andere tekst, geen markdown-codeblokken.`

  const gebruikersPrompt = mails.map((m, i) =>
    `--- E-MAIL ${i + 1} ---\nVan: ${m.van}\nOnderwerp: ${m.onderwerp}\nOntvangen: ${m.datum}\nTekst:\n${m.tekst}`
  ).join('\n\n')

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        system: systeemPrompt,
        messages: [{ role: 'user', content: gebruikersPrompt }],
      }),
    })

    if (!response.ok) {
      const errTekst = await response.text()
      console.error('Anthropic API fout:', response.status, errTekst)
      let detail = errTekst
      try { detail = JSON.parse(errTekst)?.error?.message || errTekst } catch { /* errTekst blijft de raw tekst */ }
      return NextResponse.json({ fout: `AI-extractie mislukt (${response.status}): ${detail}` }, { status: 500 })
    }

    const data = await response.json()
    const inhoud = (data.content?.[0]?.text || '').trim()
    const schoon = inhoud.replace(/^```json\s*|\s*```$/g, '').trim()

    let geëxtraheerd: Record<string, string>[]
    try {
      geëxtraheerd = JSON.parse(schoon)
    } catch (parseErr) {
      console.error('Kon AI-antwoord niet parsen:', inhoud, parseErr)
      return NextResponse.json({ fout: 'Kon het AI-antwoord niet verwerken. Probeer het opnieuw.' }, { status: 500 })
    }

    const voorstellen = mails.map((m, i) => ({
      uid: m.uid,
      van: m.van,
      onderwerp: m.onderwerp,
      ontvangen: m.datum,
      voorstel: geëxtraheerd[i] || {},
    }))

    return NextResponse.json({ voorstellen })
  } catch (err) {
    console.error('Fout bij mail verwerken:', err)
    return NextResponse.json({ fout: `Er ging iets mis: ${foutDetail(err)}` }, { status: 500 })
  }
}
