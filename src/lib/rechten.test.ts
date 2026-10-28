import { describe, it, expect } from 'vitest'
import { fractielidWijzigingFout, gelijk } from './rechten'
import type { Vergadering } from './types'

function basis(): Vergadering {
  return {
    id: 'v1', titel: 'Fractie Vergadering', versie: 2, datum: '2026-11-02', aanvang: '20:00',
    locatie: 'Gemeentehuis', aanwezig: 'Anna', online: '', afwezig: '',
    punten: [
      { id: 1, uid: 'p-1', titel: 'Opening', subpunten: [] },
      { id: 2, uid: 'p-2', titel: 'Raadsvoorstellen', url: 'https://x/rv', minuten: 20, subpunten: [
        { id: 'a', uid: 's-1', titel: 'Begroting', url: 'https://x/1' },
        { id: 'b', uid: 's-2', titel: 'Parkeren', url: 'https://x/2' },
      ] },
      { id: 3, uid: 'p-3', titel: 'Raadsmededelingen', soort: 'informeer', subpunten: [
        { id: 'a', uid: 's-3', titel: 'Mededeling A', url: 'https://x/a' },
      ] },
    ],
    actielijst: [], kalender: [],
    heeftPolitiekeAvond: false, politiekeAvondDatum: '', politiekeAvondUrl: '',
    heeftRaadsvergadering: false, raadsvergaderingDatum: '', raadsvergaderingUrl: '',
    notulen: '', deeltoken: 'fractievergadering-02-11-2026',
    aangemaakt: '2026-10-01T10:00:00Z', bijgewerkt: '2026-10-28T10:00:00Z',
  }
}

const kopie = (v: Vergadering) => structuredClone(v)

describe('fractielidWijzigingFout — toegestaan', () => {
  it('ongewijzigd', () => {
    expect(fractielidWijzigingFout(basis(), basis())).toBeNull()
  })

  it('notulen', () => {
    const n = kopie(basis()); n.notulen = 'Besproken: begroting'
    expect(fractielidWijzigingFout(basis(), n)).toBeNull()
  })

  it('notities en bijlagen op punten en subpunten', () => {
    const n = kopie(basis())
    n.punten[1].notities = [{ id: 'n1', naam: 'Bas', tekst: 'Vraag', datum: '2026-10-28' }]
    n.punten[1].subpunten[0].bijlagen = [{ id: 'b1', naam: 'x.pdf', pad: 'v1/x.pdf', type: 'application/pdf', grootte: 1, uploader: 'Bas', datum: '2026-10-28' }]
    expect(fractielidWijzigingFout(basis(), n)).toBeNull()
  })

  it('eigen vrij subpunt toevoegen en daarna verwijderen', () => {
    const n = kopie(basis())
    n.punten[0].subpunten.push({ id: 'a', titel: 'Gesprek met wethouder', auteur: 'Bas', toelichting: 'Bas — 28 okt' })
    expect(fractielidWijzigingFout(basis(), n)).toBeNull()
    expect(fractielidWijzigingFout(n, basis())).toBeNull()
  })

  it('bespreekverzoek: "Te bespreken" aanmaken, kopie toevoegen en markering zetten (met hernummering)', () => {
    const n = kopie(basis())
    n.punten.splice(2, 0, { id: 0, titel: 'Te bespreken', toelichting: '', subpunten: [
      { id: 'a', titel: 'Mededeling A', url: 'https://x/a', bespreekKey: 'bk-1', bespreekKopie: true, bespreekDoor: 'Bas', auteur: 'Bas' },
    ] })
    n.punten.forEach((p, i) => { p.id = i + 1 })
    n.punten[3].subpunten[0].bespreekKey = 'bk-1'
    n.punten[3].subpunten[0].bespreekDoor = 'Bas'
    expect(fractielidWijzigingFout(basis(), n)).toBeNull()
  })

  it('titel van eigen bespreekpunt aanpassen past ook het origineel aan', () => {
    const oud = kopie(basis())
    oud.punten[2].subpunten[0].bespreekKey = 'bk-1'
    const n = kopie(oud)
    n.punten[2].subpunten[0].titel = 'Mededeling A (graag bespreken)'
    expect(fractielidWijzigingFout(oud, n)).toBeNull()
  })

  it('volgorde van sleutels en ontbrekende uid\'s maken niet uit', () => {
    const oud = kopie(basis())
    oud.punten = oud.punten.map(p => {
      const { uid: _u, ...rest } = p; void _u
      return Object.fromEntries(Object.entries(rest).reverse()) as unknown as typeof p
    })
    expect(fractielidWijzigingFout(oud, basis())).toBeNull()
  })
})

describe('fractielidWijzigingFout — geweigerd', () => {
  const geweigerd = (pas: (v: Vergadering) => void) => {
    const n = kopie(basis()); pas(n)
    return fractielidWijzigingFout(basis(), n)
  }

  it('vergadergegevens', () => {
    expect(geweigerd(v => { v.datum = '2026-11-09' })).toMatch(/datum/)
    expect(geweigerd(v => { v.versie = 3 })).toMatch(/versie/)
    expect(geweigerd(v => { v.deeltoken = 'iets-anders' })).toMatch(/deeltoken/)
    expect(geweigerd(v => { v.aanwezig = '' })).toMatch(/aanwezig/)
    expect(geweigerd(v => { v.actielijst = [{ id: 'x', naam: 'B', actie: 'x', afgedaan: false, datum: '' }] })).toMatch(/actielijst/)
  })

  it('agenda-structuur', () => {
    expect(geweigerd(v => { v.punten[1].titel = 'Anders' })).not.toBeNull()
    expect(geweigerd(v => { v.punten[1].url = 'https://kwaad' })).not.toBeNull()
    expect(geweigerd(v => { v.punten[1].minuten = 5 })).not.toBeNull()
    expect(geweigerd(v => { v.punten.reverse() })).not.toBeNull()
    expect(geweigerd(v => { v.punten.pop() })).not.toBeNull()
    expect(geweigerd(v => { v.punten = [] })).not.toBeNull()
    expect(geweigerd(v => { v.punten[1].subpunten.pop() })).not.toBeNull()
    expect(geweigerd(v => { v.punten[1].subpunten[0].titel = 'Anders' })).not.toBeNull()
    expect(geweigerd(v => { v.punten[1].subpunten[0].afgedaan = true })).not.toBeNull()
  })

  it('een editor-subpunt kan niet als "eigen punt" vermomd worden verwijderd', () => {
    // auteur toevoegen aan een bestaand editor-subpunt laat het uit de vergelijking vallen → telt als verwijderd
    expect(geweigerd(v => { v.punten[1].subpunten[0].auteur = 'Bas' })).not.toBeNull()
  })
})

describe('gelijk', () => {
  it('negeert sleutelvolgorde en undefined', () => {
    expect(gelijk({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1, d: undefined })).toBe(true)
    expect(gelijk({ a: 1 }, { a: '1' })).toBe(false)
    expect(gelijk([1, 2], [2, 1])).toBe(false)
  })
})
