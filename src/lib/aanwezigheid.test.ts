import { describe, it, expect } from 'vitest'
import { zetStatus, statusVan, alleGenoemdeNamen } from './aanwezigheid'

const leeg = { aanwezig: '', online: '', afwezig: '' }

describe('zetStatus', () => {
  it('verplaatst alleen de eigen naam en laat de rest staan', () => {
    const voor = { aanwezig: 'Pieter, Vera', online: 'Jan', afwezig: 'Bianca' }
    expect(zetStatus(voor, 'Vera', 'online')).toEqual({ aanwezig: 'Pieter', online: 'Jan, Vera', afwezig: 'Bianca' })
  })

  it('laat namen die niet in de ledenlijst staan (gasten, Piet) ongemoeid', () => {
    const voor = { aanwezig: 'Piet, Gast Jansen', online: '', afwezig: '' }
    expect(zetStatus(voor, 'Vera', 'aanwezig').aanwezig).toBe('Piet, Gast Jansen, Vera')
  })

  it('negeert hoofdletters en spaties bij het vergelijken', () => {
    expect(zetStatus({ ...leeg, afwezig: ' vera ' }, 'Vera', 'aanwezig')).toEqual({ aanwezig: 'Vera', online: '', afwezig: '' })
  })

  it('null haalt de naam overal weg', () => {
    expect(zetStatus({ aanwezig: 'Gast', online: '', afwezig: '' }, 'Gast', null)).toEqual(leeg)
  })
})

describe('statusVan', () => {
  it('vindt de status, of null als iemand nog niet heeft gereageerd', () => {
    const l = { aanwezig: 'Pieter', online: 'Vera', afwezig: '' }
    expect(statusVan(l, 'vera')).toBe('online')
    expect(statusVan(l, 'Jan')).toBeNull()
  })
})

describe('alleGenoemdeNamen', () => {
  it('geeft elke naam één keer', () => {
    expect(alleGenoemdeNamen({ aanwezig: 'A, B', online: 'b', afwezig: 'C' })).toEqual(['A', 'B', 'C'])
  })
})
