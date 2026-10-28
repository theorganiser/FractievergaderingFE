import { describe, it, expect } from 'vitest'
import { voegPuntenSamen, zorgVoorSleutels, zonderVergaderingInhoud } from './samenvoegen'
import type { Agendapunt } from './types'

const notitie = (id: string, naam = 'Vera') => ({ id, naam, tekst: `tekst ${id}`, datum: '2026-10-25T09:00:00Z' })
const punt = (id: number, titel: string, extra: Partial<Agendapunt> = {}): Agendapunt => ({ id, titel, subpunten: [], ...extra })

describe('voegPuntenSamen', () => {
  it('behoudt wijzigingen van de editor én notities van fractieleden', () => {
    const basis = [punt(1, 'Mededelingen')]
    const lokaal = [punt(1, 'Mededelingen', { toelichting: 'Korte ronde' })]
    const server = [punt(1, 'Mededelingen', { notities: [notitie('n1')] })]
    expect(voegPuntenSamen(basis, lokaal, server)).toEqual([punt(1, 'Mededelingen', { toelichting: 'Korte ronde', notities: [notitie('n1')] })])
  })

  it('vindt het punt terug als de editor het hernoemt (via vaste sleutel)', () => {
    const basis = zorgVoorSleutels([punt(1, 'Mededelingen')])
    const lokaal = [{ ...basis[0], titel: 'Mededelingen voorzitter' }]
    const server = [{ ...basis[0], bijlagen: [{ id: 'b1', naam: 'x.pdf', pad: 'p', type: 'application/pdf', grootte: 1, uploader: 'Vera', datum: '' }] }]
    const uit = voegPuntenSamen(basis, lokaal, server)
    expect(uit[0].titel).toBe('Mededelingen voorzitter')
    expect(uit[0].bijlagen).toHaveLength(1)
  })

  it('vindt het punt terug als de editor punten herschikt', () => {
    const basis = [punt(1, 'A'), punt(2, 'B')]
    const lokaal = [punt(1, 'B'), punt(2, 'A')]
    const server = [punt(1, 'A'), punt(2, 'B', { notities: [notitie('n1')] })]
    const uit = voegPuntenSamen(basis, lokaal, server)
    expect(uit.map(p => p.titel)).toEqual(['B', 'A'])
    expect(uit[0].notities).toEqual([notitie('n1')])
  })

  it('voegt een nieuw subpunt van een fractielid toe', () => {
    const basis = [punt(1, 'Terugkoppeling gesprekken')]
    const lokaal = [punt(1, 'Terugkoppeling gesprekken', { toelichting: 'x' })]
    const vrij = { id: 'a', titel: 'Gesprek wethouder', auteur: 'Vera' }
    const server = [punt(1, 'Terugkoppeling gesprekken', { subpunten: [vrij] })]
    expect(voegPuntenSamen(basis, lokaal, server)[0].subpunten).toEqual([vrij])
  })

  it('zet een subpunt dat een fractielid zelf verwijderde niet terug', () => {
    const vrij = { id: 'a', titel: 'Gesprek wethouder', auteur: 'Vera' }
    const basis = [punt(1, 'Terugkoppeling', { subpunten: [vrij] })]
    const lokaal = [punt(1, 'Terugkoppeling', { subpunten: [vrij], toelichting: 'x' })]
    const server = [punt(1, 'Terugkoppeling', { subpunten: [] })]
    expect(voegPuntenSamen(basis, lokaal, server)[0].subpunten).toEqual([])
  })

  it('houdt een subpunt van de editor dat in de database nog niet bestaat', () => {
    const basis = [punt(1, 'Raadsmededelingen')]
    const nieuw = { id: 'a', titel: 'RM Treasurystatuut', url: 'https://x' }
    const lokaal = [punt(1, 'Raadsmededelingen', { subpunten: [nieuw] })]
    const server = [punt(1, 'Raadsmededelingen', { notities: [notitie('n1')] })]
    const uit = voegPuntenSamen(basis, lokaal, server)
    expect(uit[0].subpunten).toEqual([nieuw])
    expect(uit[0].notities).toHaveLength(1)
  })

  it('neemt een bespreekverzoek mee (markering + kopie onder "Te bespreken")', () => {
    const origineel = { id: 'a', titel: 'RM Parkeren' }
    const basis = [punt(1, 'Te bespreken'), punt(2, 'Raadsmededelingen', { soort: 'informeer', subpunten: [origineel] })]
    const lokaal = structuredClone(basis)
    lokaal[0].toelichting = 'max 30 min'
    const server = structuredClone(basis)
    server[1].subpunten[0] = { ...origineel, bespreekKey: 'bk1', bespreekDoor: 'Vera' }
    server[0].subpunten = [{ id: 'a', titel: 'RM Parkeren', bespreekKey: 'bk1', bespreekKopie: true, auteur: 'Vera' }]
    const uit = voegPuntenSamen(basis, lokaal, server)
    expect(uit[0].toelichting).toBe('max 30 min')
    expect(uit[0].subpunten).toHaveLength(1)
    expect(uit[1].subpunten[0]).toMatchObject({ bespreekKey: 'bk1', bespreekDoor: 'Vera' })
  })

  it('voegt een punt "Te bespreken" in dat een fractielid aanmaakte, vóór de informeerpunten', () => {
    const basis = [punt(1, 'Opening'), punt(2, 'RM', { soort: 'informeer' })]
    const server = [punt(1, 'Opening'), punt(2, 'Te bespreken', { subpunten: [{ id: 'a', titel: 'x', bespreekKopie: true, bespreekKey: 'k', auteur: 'Vera' }] }), punt(3, 'RM', { soort: 'informeer' })]
    const uit = voegPuntenSamen(basis, structuredClone(basis), server)
    expect(uit.map(p => `${p.id}:${p.titel}`)).toEqual(['1:Opening', '2:Te bespreken', '3:RM'])
  })

  it('laat een door de editor verwijderd punt verwijderd', () => {
    const basis = [punt(1, 'A'), punt(2, 'B')]
    const lokaal = [punt(1, 'A')]
    const server = [punt(1, 'A'), punt(2, 'B', { notities: [notitie('n1')] })]
    expect(voegPuntenSamen(basis, lokaal, server).map(p => p.titel)).toEqual(['A'])
  })
})

describe('zorgVoorSleutels', () => {
  it('is deterministisch en laat bestaande sleutels staan', () => {
    const p = [punt(1, 'A', { subpunten: [{ id: 'a', titel: 'x' }] })]
    expect(zorgVoorSleutels(p)).toEqual(zorgVoorSleutels(structuredClone(p)))
    const eenmaal = zorgVoorSleutels(p)
    expect(zorgVoorSleutels(eenmaal)).toEqual(eenmaal)
    expect(eenmaal[0].uid).toBeTruthy()
    expect(eenmaal[0].subpunten[0].uid).toBeTruthy()
  })
})

describe('zonderVergaderingInhoud', () => {
  it('haalt notities, bijlagen en bespreekmarkeringen weg', () => {
    const p = punt(1, 'A', {
      uid: 'p1', notities: [notitie('n1')],
      bijlagen: [{ id: 'b', naam: '', pad: 'v1/x.pdf', type: '', grootte: 1, uploader: '', datum: '' }],
      subpunten: [{ id: 'a', uid: 's1', titel: 'x', notities: [notitie('n2')], bespreekKey: 'k', bespreekDoor: 'Vera' }],
    })
    expect(zonderVergaderingInhoud(p)).toEqual({ id: 1, titel: 'A', subpunten: [{ id: 'a', titel: 'x' }] })
  })
})
