import { Agendapunt, Subpunt } from './types'

// Wie heeft dit subpunt toegevoegd? Nieuwere punten hebben een vast veld `auteur`.
// Oudere, door fractieleden toegevoegde punten herkennen we aan de toelichting
// "Naam — dd-mm-jjjj" die bij toevoegen werd weggeschreven.
const OUDE_TOELICHTING = /^(.+?) — \d{2}-\d{2}-\d{4}$/

const OUDE_KOPIE = /^Ingebracht door (.+?) vanuit "/

export function auteurVan(sub: Subpunt): string {
  if (sub.auteur) return sub.auteur
  const k = OUDE_KOPIE.exec((sub.toelichting || '').trim())
  if (k) return k[1]
  const m = OUDE_TOELICHTING.exec((sub.toelichting || '').trim())
  return m ? m[1] : ''
}

// Het bespreekpunt "Te bespreken" (geen informeerpunt)
export function isTeBespreken(punt: Agendapunt): boolean {
  return punt.soort !== 'informeer' && (punt.titel || '').toLowerCase().includes('te bespreken')
}
