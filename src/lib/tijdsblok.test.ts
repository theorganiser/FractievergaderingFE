import { describe, it, expect } from 'vitest'
import { berekenTijden, EXTRA_MINUTEN_PER_INGEBRACHT_PUNT } from './tijdsblok'
import type { Agendapunt } from './types'

const punt = (velden: Partial<Agendapunt>): Agendapunt => ({ titel: '', toelichting: '', subpunten: [], ...velden }) as Agendapunt

describe('berekenTijden', () => {
  it('telt starttijden op vanaf de aanvang', () => {
    const r = berekenTijden([
      punt({ id: 1, titel: 'Opening', minuten: 10 }),
      punt({ id: 2, titel: 'Mededelingen', minuten: 15 }),
      punt({ id: 3, titel: 'Sluiting', minuten: 5 }),
    ], '20:00')
    expect(r.perPunt[1].start).toBe('20:00')
    expect(r.perPunt[2].start).toBe('20:10')
    expect(r.perPunt[3].start).toBe('20:25')
    expect(r.totaalMinuten).toBe(30)
    expect(r.einde).toBe('20:30')
  })

  it('reserveert extra tijd per ingebracht subpunt onder "Te bespreken"', () => {
    const r = berekenTijden([
      punt({
        id: 1, titel: 'Te bespreken', minuten: 10, subpunten: [
          { id: 'a', titel: 'met auteur', auteur: 'Anna' },
          { id: 'b', titel: 'kopie', bespreekKopie: true },
          { id: 'c', titel: 'zonder auteur' },
        ] as Agendapunt['subpunten'],
      }),
    ], '20:00')
    expect(r.perPunt[1].extra).toBe(2 * EXTRA_MINUTEN_PER_INGEBRACHT_PUNT)
    expect(r.perPunt[1].minuten).toBe(10 + 2 * EXTRA_MINUTEN_PER_INGEBRACHT_PUNT)
  })

  it('informeerpunten tellen niet mee in de planning', () => {
    const r = berekenTijden([
      punt({ id: 1, titel: 'Opening', minuten: 10 }),
      punt({ id: 2, titel: 'Raadsmededelingen', minuten: 30, soort: 'informeer' }),
      punt({ id: 3, titel: 'Sluiting', minuten: 5 }),
    ], '20:00')
    expect(r.perPunt[2].start).toBeNull()
    expect(r.perPunt[3].start).toBe('20:10')
    expect(r.totaalMinuten).toBe(15)
  })

  it('negeert lege, negatieve en niet-numerieke minuten', () => {
    const r = berekenTijden([
      punt({ id: 1, minuten: undefined }),
      punt({ id: 2, minuten: -5 }),
      punt({ id: 3, minuten: NaN }),
    ], '20:00')
    expect(r.totaalMinuten).toBe(0)
  })

  it('loopt door over middernacht', () => {
    const r = berekenTijden([punt({ id: 1, minuten: 90 })], '23:00')
    expect(r.einde).toBe('00:30')
  })

  it('zonder geldige aanvang wel duur, geen tijden', () => {
    for (const aanvang of ['', 'acht uur', '25:00']) {
      const r = berekenTijden([punt({ id: 1, minuten: 10 })], aanvang)
      expect(r.perPunt[1].start, aanvang).toBeNull()
      expect(r.einde, aanvang).toBeNull()
      expect(r.totaalMinuten).toBe(10)
    }
  })
})
