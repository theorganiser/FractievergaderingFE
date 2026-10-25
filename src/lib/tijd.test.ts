import { describe, it, expect, vi, afterEach } from 'vitest'
import { datumInNL, vandaagNL, plusDagen, plusMaanden, weekdag, formatTijdstipTijd, formatTijdstipDatum, formatKalenderdatum } from './tijd'

afterEach(() => { vi.useRealTimers() })

describe('datumInNL', () => {
  it('na middernacht Nederlandse tijd is het al de volgende dag (ook al is het in UTC nog gisteren)', () => {
    // 25 okt 2026 23:30 UTC = 26 okt 00:30 in Nederland (wintertijd, UTC+1)
    expect(datumInNL(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-26')
    // zomertijd (UTC+2): 22:30 UTC = 00:30 de volgende dag
    expect(datumInNL(new Date('2026-07-01T22:30:00Z'))).toBe('2026-07-02')
    expect(datumInNL(new Date('2026-07-01T21:30:00Z'))).toBe('2026-07-01')
  })

  it('vandaagNL gebruikt de huidige tijd', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-31T23:15:00Z'))
    expect(vandaagNL()).toBe('2027-01-01')
  })
})

describe('rekenen met kalenderdatums', () => {
  it('plusDagen over maand- en jaargrens en over de wisseling naar wintertijd', () => {
    expect(plusDagen('2026-10-24', 2)).toBe('2026-10-26')
    expect(plusDagen('2026-12-31', 1)).toBe('2027-01-01')
    expect(plusDagen('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('plusMaanden kapt af op de laatste dag van de maand', () => {
    expect(plusMaanden('2026-03-31', -1)).toBe('2026-02-28')
    expect(plusMaanden('2026-10-25', -1)).toBe('2026-09-25')
    expect(plusMaanden('2026-01-15', -1)).toBe('2025-12-15')
  })

  it('weekdag', () => {
    expect(weekdag('2026-10-26')).toBe(1) // maandag
    expect(weekdag('2026-10-25')).toBe(0) // zondag
  })
})

describe('opmaak', () => {
  it('toont tijdstippen in Nederlandse tijd', () => {
    expect(formatTijdstipTijd('2026-10-25T19:05:00Z')).toBe('20:05')
    expect(formatTijdstipTijd('2026-07-01T19:05:00Z')).toBe('21:05')
    expect(formatTijdstipDatum('2026-10-25T23:30:00Z')).toBe('26-10-2026')
  })

  it('kalenderdatum schuift nooit een dag', () => {
    expect(formatKalenderdatum('2026-10-26', { weekday: 'long', day: 'numeric', month: 'long' })).toBe('maandag 26 oktober')
  })
})
