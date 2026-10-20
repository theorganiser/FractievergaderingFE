import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseDatum, formatDatum, formatDatumNL, sorteerOpDatum, eersteVolgendeMaandag } from './datum'

describe('parseDatum', () => {
  it('leest ISO-datums', () => {
    const d = parseDatum('2026-03-09')!
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 2, 9])
  })

  it('leest Nederlandse notatie, ook afgekort en met punt', () => {
    for (const invoer of ['9 maart 2026', '9 mrt 2026', '9 mrt. 2026', '9 Maart 2026']) {
      const d = parseDatum(invoer)!
      expect([d.getFullYear(), d.getMonth(), d.getDate()], invoer).toEqual([2026, 2, 9])
    }
  })

  it('geeft null bij lege of onleesbare invoer', () => {
    expect(parseDatum('')).toBeNull()
    expect(parseDatum('geen datum')).toBeNull()
  })
})

describe('formatteren', () => {
  it('formatDatum schrijft dag en maand uit', () => {
    expect(formatDatum('2026-03-09')).toBe('maandag 9 maart 2026')
  })

  it('formatDatumNL geeft dd-mm-jjjj', () => {
    expect(formatDatumNL('2026-03-09')).toBe('09-03-2026')
  })

  it('laat onleesbare invoer ongemoeid', () => {
    expect(formatDatum('binnenkort')).toBe('binnenkort')
    expect(formatDatumNL('')).toBe('')
  })
})

describe('sorteerOpDatum', () => {
  it('zet de nieuwste bovenaan en lege datums onderaan', () => {
    const lijst = [{ datum: '2026-01-01' }, { datum: '' }, { datum: '2026-05-01' }]
    expect(lijst.sort(sorteerOpDatum).map(v => v.datum)).toEqual(['2026-05-01', '2026-01-01', ''])
  })
})

describe('eersteVolgendeMaandag', () => {
  afterEach(() => { vi.useRealTimers() })

  it.each([
    ['woensdag', '2026-10-21T10:00:00', '2026-10-26'],
    ['zondag', '2026-10-25T10:00:00', '2026-10-26'],
    ['maandag zelf → week later', '2026-10-19T10:00:00', '2026-10-26'],
  ])('%s', (_, nu, verwacht) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(nu))
    expect(eersteVolgendeMaandag()).toBe(verwacht)
  })
})
