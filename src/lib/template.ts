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
    titel: 'Mededelingen',
    toelichting: '',
    subpunten: [
      { id: 'a', titel: 'Presidium – terugkoppeling', url: '' },
    ],
  },
  {
    id: 4,
    titel: 'Te bespreken',
    toelichting: '',
    subpunten: [],
  },
  {
    id: 5,
    titel: 'Actualiteiten',
    toelichting: '',
    subpunten: [],
  },
  {
    id: 6,
    titel: 'Raadsmededelingen',
    toelichting: '',
    subpunten: [],
    apiType: 'raadsmededelingen',
  },
  {
    id: 7,
    titel: 'Technische en schriftelijke vragen',
    toelichting: '',
    subpunten: [],
    apiType: 'vragen',
  },
  {
    id: 8,
    titel: 'Rondvraag',
    toelichting: '',
    subpunten: [],
  },
  {
    id: 9,
    titel: 'Sluiting',
    toelichting: '',
    subpunten: [],
  },
]
