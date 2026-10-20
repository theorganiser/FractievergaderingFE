import { Agendapunt } from './types'
import { auteurVan, isTeBespreken } from './punten'

// Tijd die automatisch gereserveerd wordt voor elk bespreekpunt dat een fractielid onder
// "Te bespreken" heeft gezet of ingebracht (bovenop het tijdsblok van het punt zelf).
export const EXTRA_MINUTEN_PER_INGEBRACHT_PUNT = 5

export interface PuntTijd {
  minuten: number        // duur van dit punt, inclusief extra (0 = niet opgegeven)
  extra: number          // waarvan automatisch gereserveerd voor ingebrachte punten
  start: string | null   // verwachte starttijd "HH:MM", of null als aanvang onbekend is
}

export interface TijdOverzicht {
  perPunt: Record<number, PuntTijd>
  totaalMinuten: number
  einde: string | null
}

export function isInformeer(punt: Agendapunt): boolean {
  return punt.soort === 'informeer'
}

function naarMinuten(tijd: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec((tijd || '').trim())
  if (!m) return null
  const u = Number(m[1]), min = Number(m[2])
  if (u > 23 || min > 59) return null
  return u * 60 + min
}

function naarTijd(minutenSindsMiddernacht: number): string {
  const m = ((minutenSindsMiddernacht % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// Verwachte starttijden van de bespreekpunten, op volgorde, vanaf de aanvang van de vergadering.
// Informeerpunten staan buiten de planning (die zijn ter kennisgeving).
export function berekenTijden(punten: Agendapunt[], aanvang: string): TijdOverzicht {
  const begin = naarMinuten(aanvang)
  const perPunt: Record<number, PuntTijd> = {}
  let lopend = 0
  for (const punt of punten) {
    const basis = Number.isFinite(punt.minuten) && (punt.minuten as number) > 0 ? Math.round(punt.minuten as number) : 0
    if (isInformeer(punt)) {
      perPunt[punt.id] = { minuten: basis, extra: 0, start: null }
      continue
    }
    const ingebracht = isTeBespreken(punt)
      ? (punt.subpunten || []).filter(s => !!auteurVan(s) || s.bespreekKopie).length
      : 0
    const extra = ingebracht * EXTRA_MINUTEN_PER_INGEBRACHT_PUNT
    const minuten = basis + extra
    perPunt[punt.id] = { minuten, extra, start: begin === null ? null : naarTijd(begin + lopend) }
    lopend += minuten
  }
  return { perPunt, totaalMinuten: lopend, einde: begin === null ? null : naarTijd(begin + lopend) }
}
