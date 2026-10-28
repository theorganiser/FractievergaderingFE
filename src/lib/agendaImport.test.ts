import { describe, it, expect } from 'vitest'
import { stelStemlijstVoor, splitsMotieTitel, voegAgendaImportSamen, ImportRegel, MotieRegel } from './agendaImport'
import type { Subpunt } from './types'

let teller = 0
const key = () => `k${++teller}`

const punt = (nummer: string, titel: string, soort: ImportRegel['soort'] = 'besluitvormend'): ImportRegel =>
  ({ nummer, titel, soort, meenemen: true, inStemlijst: stelStemlijstVoor({ nummer, titel, soort }) })
const motie = (nummer: string, titel: string, gekoppeldAanRv: string): MotieRegel =>
  ({ nummer, titel, url: `https://x/${nummer}`, gekoppeldAanRv, meenemen: true })

describe('stelStemlijstVoor', () => {
  it('alleen besluitvormende subpunten en hamerstukken', () => {
    expect(stelStemlijstVoor({ nummer: '5d', titel: 'Begroting', soort: 'besluitvormend' })).toBe(true)
    expect(stelStemlijstVoor({ nummer: '6a', titel: 'Normenkader', soort: 'hamerstuk' })).toBe(true)
    expect(stelStemlijstVoor({ nummer: '3a', titel: 'Participatie', soort: 'oordeelvormend' })).toBe(false)
    expect(stelStemlijstVoor({ nummer: '5', titel: 'Besluitvormend', soort: 'besluitvormend' })).toBe(false)
    expect(stelStemlijstVoor({ nummer: '1', titel: 'Opening', soort: 'hamerstuk' })).toBe(false)
  })
})

describe('splitsMotieTitel', () => {
  it('haalt het nummer van de titel af', () => {
    expect(splitsMotieTitel('M26-91 Motie D66 - Geen sluiting')).toEqual({ nummer: 'M26-91', titel: 'Motie D66 - Geen sluiting' })
    expect(splitsMotieTitel('A24-93 Amendement PLEK - Bouwen')).toEqual({ nummer: 'A24-93', titel: 'Amendement PLEK - Bouwen' })
    expect(splitsMotieTitel('4a1 Motie VVD toilet')).toEqual({ nummer: '', titel: '4a1 Motie VVD toilet' })
  })
})

describe('voegAgendaImportSamen', () => {
  it('lege agenda: punten in volgorde, moties direct onder hun voorstel, losse onderaan', () => {
    const { subpunten, nieuw } = voegAgendaImportSamen([], [
      punt('5', 'Besluitvormend'), punt('5c', 'Voortgangsverslag'), punt('5d', 'Programmabegroting'), punt('8', 'Sluiting', 'hamerstuk'),
    ], [
      motie('M26-91', 'Motie D66 - Bibliotheek', '5d'),
      motie('A26-12', 'Amendement VVD - Riool', '5d'),
      motie('M26-99', 'Motie GDP - Vreemd', ''),
    ], key)
    expect(subpunten.map(s => s.rvNummer)).toEqual(['5', '5c', '5d', 'M26-91', 'A26-12', '8', 'M26-99'])
    expect(nieuw).toBe(7)
    expect(subpunten.find(s => s.rvNummer === 'A26-12')?.subtype).toBe('amendement')
    expect(subpunten.find(s => s.rvNummer === 'M26-91')).toMatchObject({ subtype: 'motie', inStemlijst: true, gekoppeldAanRv: '5d', url: 'https://x/M26-91' })
    expect(subpunten.find(s => s.rvNummer === '5d')?.inStemlijst).toBe(true)
    expect(subpunten.find(s => s.rvNummer === '5')?.inStemlijst).toBe(false)
    expect(new Set(subpunten.map(s => s.stemlijstKey)).size).toBe(7)
  })

  it('opnieuw importeren: bestaande punten behouden hun eigen velden en worden niet verdubbeld', () => {
    const bestaand: Subpunt[] = [
      { id: 'a', uid: 's-1', titel: 'Oude titel', rvNummer: '5D', subtype: 'normaal', inStemlijst: false, woordvoerder: 'Pieter', stemlijstKey: 'vast1', notities: [{ id: 'n', naam: 'x', tekst: 't', datum: '' }] },
      { id: 'b', uid: 's-2', titel: 'Motie D66 - Bibliotheek', rvNummer: 'M26-91', subtype: 'motie', inStemlijst: true, gekoppeldAanRv: '5d', woordvoerder: 'Vera', stemlijstKey: 'vast2' },
      { id: 'c', titel: 'Eigen punt', rvNummer: '9', subtype: 'normaal', stemlijstKey: 'vast3' },
    ]
    const { subpunten, nieuw, bijgewerkt } = voegAgendaImportSamen(bestaand,
      [punt('5d', 'Programmabegroting 2027')],
      [motie('M26-91', 'Motie D66 - Bibliotheek', '5d')], key)

    expect(subpunten.map(s => s.rvNummer)).toEqual(['5D', 'M26-91', '9'])
    expect(nieuw).toBe(0)
    expect(bijgewerkt).toBe(2) // titel 5d + url van de motie
    expect(subpunten[0]).toMatchObject({ uid: 's-1', titel: 'Programmabegroting 2027', woordvoerder: 'Pieter', stemlijstKey: 'vast1', inStemlijst: false })
    expect(subpunten[0].notities).toHaveLength(1)
    expect(subpunten[1]).toMatchObject({ uid: 's-2', woordvoerder: 'Vera', stemlijstKey: 'vast2' })
  })

  it('niet aangevinkte regels worden overgeslagen; bestaande moties buiten de import blijven bij hun voorstel', () => {
    const bestaand: Subpunt[] = [
      { id: 'x', titel: 'Oud amendement', rvNummer: 'A26-01', subtype: 'amendement', gekoppeldAanRv: '3a', stemlijstKey: 'k' },
    ]
    const p = punt('3a', 'Participatie', 'oordeelvormend')
    const { subpunten } = voegAgendaImportSamen(bestaand,
      [p, { ...punt('4', 'Schorsing', 'overig'), meenemen: false }],
      [{ ...motie('M26-50', 'Weg', '3a'), meenemen: false }], key)
    expect(subpunten.map(s => s.rvNummer)).toEqual(['3a', 'A26-01'])
  })
})
