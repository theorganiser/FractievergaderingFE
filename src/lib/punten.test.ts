import { describe, it, expect } from 'vitest'
import { auteurVan, isTeBespreken } from './punten'
import type { Agendapunt, Subpunt } from './types'

const sub = (velden: Partial<Subpunt>): Subpunt => ({ id: 'a', titel: 'x', ...velden }) as Subpunt
const punt = (velden: Partial<Agendapunt>): Agendapunt => ({ id: 1, titel: '', toelichting: '', subpunten: [], ...velden }) as Agendapunt

describe('auteurVan', () => {
  it('gebruikt het auteur-veld als dat er is', () => {
    expect(auteurVan(sub({ auteur: 'Anna', toelichting: 'Bert — 01-02-2026' }))).toBe('Anna')
  })

  it('herkent oude toelichting "Naam — dd-mm-jjjj"', () => {
    expect(auteurVan(sub({ toelichting: 'Bert de Vries — 01-02-2026' }))).toBe('Bert de Vries')
  })

  it('herkent oude kopie "Ingebracht door Naam vanuit ..."', () => {
    expect(auteurVan(sub({ toelichting: 'Ingebracht door Carla vanuit "Fractie 3 maart"' }))).toBe('Carla')
  })

  it('geeft lege string als er geen auteur te vinden is', () => {
    expect(auteurVan(sub({ toelichting: 'gewone toelichting' }))).toBe('')
    expect(auteurVan(sub({}))).toBe('')
  })
})

describe('isTeBespreken', () => {
  it('herkent het bespreekpunt ongeacht hoofdletters', () => {
    expect(isTeBespreken(punt({ titel: 'Te bespreken' }))).toBe(true)
    expect(isTeBespreken(punt({ titel: 'Overige punten TE BESPREKEN' }))).toBe(true)
  })

  it('niet voor andere punten of informeerpunten', () => {
    expect(isTeBespreken(punt({ titel: 'Rondvraag' }))).toBe(false)
    expect(isTeBespreken(punt({ titel: 'Te bespreken', soort: 'informeer' }))).toBe(false)
  })
})
