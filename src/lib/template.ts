import { Agendapunt } from './types'

export const TEMPLATE_PUNTEN: Agendapunt[] = [
  {
    id: 1,
    titel: 'Opening en vaststellen agenda',
    toelichting: '(besluitenlijst / notulist / opname band)',
    subpunten: [],
  },
  {
    id: 2,
    titel: 'Goedkeuring en behandeling besluitenlijst',
    toelichting: '',
    subpunten: [],
  },
  {
    id: 3,
    titel: 'Check-in',
    toelichting: '',
    subpunten: [],
  },
  {
    id: 4,
    titel: 'Mededelingen',
    toelichting: '',
    subpunten: [
      { id: 'a', titel: 'Presidium', url: '' },
      { id: 'b', titel: 'Agendacommissie', url: '' },
      { id: 'c', titel: 'Bestuur', url: '' },
      { id: 'd', titel: 'Overige', url: '' },
    ],
  },
  {
    id: 5,
    titel: 'Te bespreken',
    toelichting: '',
    subpunten: [],
  },
  // Politieke Avond en Raadsvergadering worden optioneel ingevoegd (id 6 en 7 worden dan verschoven)
  {
    id: 6,
    titel: 'Actualiteiten',
    toelichting: '',
    subpunten: [],
  },
  {
    id: 7,
    titel: 'Raadsmededelingen',
    toelichting: '',
    subpunten: [],
    apiType: 'raadsmededelingen',
  },
  {
    id: 8,
    titel: 'Technische en schriftelijke vragen',
    toelichting: '',
    subpunten: [],
    apiType: 'vragen',
  },
  {
    id: 9,
    titel: 'Ingekomen stukken / e-mails',
    toelichting: '',
    subpunten: [],
  },
  {
    id: 10,
    titel: 'Poll',
    toelichting: '',
    subpunten: [],
  },
  {
    id: 11,
    titel: 'Rondvraag',
    toelichting: '(geen nieuwe onderwerpen)',
    subpunten: [],
  },
  {
    id: 12,
    titel: 'Sluiting',
    toelichting: '',
    subpunten: [],
  },
]

export const POLITIEKE_AVOND_PUNT = (datum: string, url: string): Agendapunt => ({
  id: 0, // wordt hernummerd
  titel: `Politieke Avond ${datum}`,
  toelichting: '',
  url: url || undefined,  // link zit op het punt zelf
  subpunten: [],
})

export const RAADSVERGADERING_PUNT = (datum: string, url: string): Agendapunt => ({
  id: 0, // wordt hernummerd
  titel: `Raadsvergadering ${datum}`,
  toelichting: '',
  url: url || undefined,  // link zit op het punt zelf
  subpunten: [],
})

export function bouwPuntenMetOpties(
  heeftPA: boolean, paDatum: string, paUrl: string,
  heeftRV: boolean, rvDatum: string, rvUrl: string
): Agendapunt[] {
  const basis = JSON.parse(JSON.stringify(TEMPLATE_PUNTEN)) as Agendapunt[]
  const extra: Agendapunt[] = []

  if (heeftPA) extra.push(POLITIEKE_AVOND_PUNT(paDatum, paUrl))
  if (heeftRV) extra.push(RAADSVERGADERING_PUNT(rvDatum, rvUrl))

  if (extra.length === 0) {
    // Hernummer
    basis.forEach((p, i) => { p.id = i + 1 })
    return basis
  }

  // Voeg PA en RV in na "Te bespreken" (index 4, na punt 5)
  const invoegIndex = basis.findIndex(p => p.titel === 'Te bespreken') + 1
  const resultaat = [
    ...basis.slice(0, invoegIndex),
    ...extra,
    ...basis.slice(invoegIndex),
  ]
  // Hernummer alles
  resultaat.forEach((p, i) => { p.id = i + 1 })
  return resultaat
}
