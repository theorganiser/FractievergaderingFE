import { describe, it, expect } from 'vitest'
import { bouwPuntenMetOpties, TEMPLATE_PUNTEN } from './template'

describe('bouwPuntenMetOpties', () => {
  it('zonder opties: het template met doorlopende ids', () => {
    const punten = bouwPuntenMetOpties(false, '', '', false, '', '')
    expect(punten.map(p => p.titel)).toEqual(TEMPLATE_PUNTEN.map(p => p.titel))
    expect(punten.map(p => p.id)).toEqual(punten.map((_, i) => i + 1))
  })

  it('voegt Politieke Avond en Raadsvergadering direct na "Te bespreken" in', () => {
    const punten = bouwPuntenMetOpties(true, '12 maart', 'https://pa', true, '19 maart', '')
    const i = punten.findIndex(p => p.titel === 'Te bespreken')
    expect(punten[i + 1]).toMatchObject({ titel: 'Politieke Avond 12 maart', puntType: 'politieke_avond', url: 'https://pa' })
    expect(punten[i + 2]).toMatchObject({ titel: 'Raadsvergadering 19 maart', puntType: 'raadsvergadering', url: undefined })
    expect(punten[i + 3].titel).toBe('Rondvraag')
    expect(punten.map(p => p.id)).toEqual(punten.map((_, i) => i + 1))
  })

  it('past het template zelf niet aan', () => {
    const voor = JSON.stringify(TEMPLATE_PUNTEN)
    const punten = bouwPuntenMetOpties(true, 'x', '', false, '', '')
    punten[3].subpunten.push({ id: 'z', titel: 'nieuw' })
    expect(JSON.stringify(TEMPLATE_PUNTEN)).toBe(voor)
  })
})
