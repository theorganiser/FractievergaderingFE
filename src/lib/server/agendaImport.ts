import Anthropic from '@anthropic-ai/sdk'
import type { AgendaImportAntwoord, AgendaSoort } from '../agendaImport'

// AI-extractie van de raadsagenda en de koppeling van concept-moties aan agendapunten.
// Los van de route, zodat hij ook zonder login te testen is.

export interface AgendaInvoer {
  pdf?: string     // base64, zonder "data:"-voorvoegsel
  tekst?: string   // of: de agenda als geplakte tekst
  moties?: { nummer: string; titel: string }[]
}

/** Fout met een melding die zo aan de gebruiker getoond kan worden. */
export class AgendaImportFout extends Error {}

const SOORTEN: AgendaSoort[] = ['hamerstuk', 'besluitvormend', 'oordeelvormend', 'informerend', 'overig']

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['datum', 'agendaUrl', 'punten', 'koppelingen'],
  properties: {
    datum: { type: 'string', description: 'Datum van de vergadering als YYYY-MM-DD, of leeg' },
    agendaUrl: { type: 'string', description: 'Link naar de agenda op bestuur.gooisemeren.nl zonder /print aan het eind, of leeg' },
    punten: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nummer', 'titel', 'soort'],
        properties: {
          nummer: { type: 'string' },
          titel: { type: 'string' },
          soort: { type: 'string', enum: SOORTEN },
        },
      },
    },
    koppelingen: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['motie', 'agendapunt'],
        properties: {
          motie: { type: 'string' },
          agendapunt: { type: 'string' },
        },
      },
    },
  },
}

const SYSTEEM = `Je leest de agenda van een gemeenteraadsvergadering van Gooise Meren uit voor de fractie-app van GDP.

Agendapunten:
- Geef elk agendapunt in de volgorde van de agenda, inclusief kopjes zoals "3 Meningsvormend", "Opening" en "Sluiting".
- nummer: precies zoals op de agenda ("1", "3a", "5d").
- titel: de titel zonder het zaaknummer tussen haakjes (zoals "(1553270)") en zonder de tekens *, # en ∞ aan het eind. Neem de omschrijving/toelichting niet over.
- soort: afgeleid van het label onder de titel: "Hamerstuk" → hamerstuk, "Besluitvormende bespreking" → besluitvormend, "Oordeelvormende bespreking" → oordeelvormend, "Informeren van de raad" → informerend, anders overig.
- De losse brieven in de lijst ingekomen stukken zijn geen agendapunten.

Moties en amendementen:
- Je krijgt ook een lijst moties/amendementen die nu in concept zijn ingediend. Koppel elk ervan aan het nummer van het besluitvormende agendapunt waar het het meest waarschijnlijk bij wordt ingediend, op basis van het onderwerp.
- Moties bij een begrotingsvergadering horen meestal bij de programmabegroting, tenzij het onderwerp duidelijk bij een ander voorstel hoort.
- Hoort een motie bij geen enkel agendapunt (een motie vreemd aan de orde van de dag), gebruik dan een lege string als agendapunt.
- Geef voor elke motie in de lijst precies één koppeling, met het motienummer exact zoals gegeven.`

export async function leesAgenda({ pdf, tekst, moties = [] }: AgendaInvoer): Promise<AgendaImportAntwoord> {
  const motieLijst = moties.length
    ? moties.map(m => `${m.nummer} | ${m.titel}`).join('\n')
    : '(geen moties)'

  const inhoud: Anthropic.Beta.BetaContentBlockParam[] = pdf
    ? [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf } }]
    : [{ type: 'text', text: `AGENDA:\n${tekst}` }]
  inhoud.push({ type: 'text', text: `MOTIES EN AMENDEMENTEN (nummer | titel):\n${motieLijst}` })

  const response = await new Anthropic().beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEEM,
    messages: [{ role: 'user', content: inhoud }],
  })

  if (response.stop_reason === 'refusal') {
    throw new AgendaImportFout('De AI weigerde dit document te verwerken. Probeer het met geplakte tekst.')
  }
  if (response.stop_reason === 'max_tokens') {
    throw new AgendaImportFout('De agenda is te lang om in één keer te verwerken.')
  }
  const tekstBlok = response.content.find(b => b.type === 'text')
  return JSON.parse(tekstBlok?.type === 'text' ? tekstBlok.text : '') as AgendaImportAntwoord
}
