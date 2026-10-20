import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkRateLimit } from './ratelimit'

describe('checkRateLimit', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('staat max pogingen toe en blokkeert daarna', () => {
    const ip = 'ip-blokkeer'
    for (let i = 0; i < 5; i++) expect(checkRateLimit(ip).toegestaan).toBe(true)
    const zesde = checkRateLimit(ip)
    expect(zesde.toegestaan).toBe(false)
    expect(zesde.resterend).toBe(0)
  })

  it('telt resterend af', () => {
    const ip = 'ip-resterend'
    expect(checkRateLimit(ip, 3).resterend).toBe(2)
    expect(checkRateLimit(ip, 3).resterend).toBe(1)
    expect(checkRateLimit(ip, 3).resterend).toBe(0)
  })

  it('opent een nieuw venster na verloop van tijd', () => {
    const ip = 'ip-venster'
    for (let i = 0; i < 5; i++) checkRateLimit(ip)
    expect(checkRateLimit(ip).toegestaan).toBe(false)
    vi.advanceTimersByTime(60_001)
    expect(checkRateLimit(ip).toegestaan).toBe(true)
  })

  it('houdt IP-adressen gescheiden', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('ip-a')
    expect(checkRateLimit('ip-a').toegestaan).toBe(false)
    expect(checkRateLimit('ip-b').toegestaan).toBe(true)
  })
})
