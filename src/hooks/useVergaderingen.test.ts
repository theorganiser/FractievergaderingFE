// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Vergadering } from '@/lib/types'

// "Database" in het geheugen, zodat we kunnen zien wat er werkelijk weggeschreven wordt.
const db = new Map<string, Vergadering>()

vi.mock('@/lib/storage', () => ({
  laadVergaderingen: vi.fn(async () => Array.from(db.values()).map(v => structuredClone(v))),
  laadVergaderingOpToken: vi.fn(async () => null),
  laadVergaderingOpId: vi.fn(async (id: string) => (db.has(id) ? structuredClone(db.get(id)!) : null)),
  slaVergaderingOp: vi.fn(async (v: Vergadering) => { db.set(v.id, structuredClone(v)); return true }),
  verwijderVergaderingDb: vi.fn(async () => true),
  nieuweId: () => 'nieuw',
  maakLeesbarToken: () => 'token',
  nieuwToken: () => 'token',
}))

import { useVergaderingen } from './useVergaderingen'
import { slaVergaderingOp } from '@/lib/storage'

const vergadering = (id: string, velden: Partial<Vergadering> = {}): Vergadering => ({
  id, titel: `Vergadering ${id}`, datum: '2026-10-20', aanvang: '20:00', locatie: '', versie: 1,
  aanwezig: '', online: '', afwezig: '', punten: [], actielijst: [], kalender: [],
  deeltoken: `t-${id}`, aangemaakt: '', bijgewerkt: '', notulen: '',
  ...velden,
}) as Vergadering

async function start() {
  const hook = renderHook(() => useVergaderingen())
  await act(async () => { await vi.runOnlyPendingTimersAsync() })
  expect(hook.result.current.geladen).toBe(true)
  return hook
}

const wachtOpDebounce = () => act(async () => { await vi.advanceTimersByTimeAsync(3500) })

describe('useVergaderingen – opslaan', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    db.clear()
    vi.mocked(slaVergaderingOp).mockClear()
    db.set('A', vergadering('A'))
    db.set('B', vergadering('B'))
  })
  afterEach(() => { vi.useRealTimers() })

  it('werkt de UI direct bij en schrijft pas na de debounce', async () => {
    const { result } = await start()
    act(() => { result.current.update('A', { titel: 'Nieuw' }) })

    expect(result.current.vergaderingen.find(v => v.id === 'A')!.titel).toBe('Nieuw')
    expect(slaVergaderingOp).not.toHaveBeenCalled()

    await wachtOpDebounce()
    expect(slaVergaderingOp).toHaveBeenCalledTimes(1)
    expect(db.get('A')!.titel).toBe('Nieuw')
  })

  it('voegt snelle wijzigingen op dezelfde vergadering samen tot één schrijfactie', async () => {
    const { result } = await start()
    act(() => {
      result.current.update('A', { titel: 'Nieuw' })
      result.current.update('A', { aanvang: '19:30' })
    })
    await wachtOpDebounce()

    expect(slaVergaderingOp).toHaveBeenCalledTimes(1)
    expect(db.get('A')).toMatchObject({ titel: 'Nieuw', aanvang: '19:30' })
  })

  it('overschrijft geen wijziging die een ander intussen heeft gedaan', async () => {
    const { result } = await start()
    act(() => { result.current.update('A', { titel: 'Nieuw' }) })

    // Een ander fractielid schrijft notulen terwijl onze debounce loopt
    db.set('A', { ...db.get('A')!, notulen: 'Notulen van iemand anders' })

    await wachtOpDebounce()
    expect(db.get('A')).toMatchObject({ titel: 'Nieuw', notulen: 'Notulen van iemand anders' })
  })

  it('meldt een fout als de vergadering niet meer bestaat', async () => {
    const { result } = await start()
    act(() => { result.current.update('A', { titel: 'Nieuw' }) })
    db.delete('A')

    await wachtOpDebounce()
    expect(result.current.opslaanFout).toBe(true)
    expect(result.current.opslaan).toBe(false)
  })

  // Regressie: vroeger annuleerde een wijziging op B de nog lopende opslag van A.
  it('slaat wijzigingen op twee verschillende vergaderingen allebei op', async () => {
    const { result } = await start()
    act(() => {
      result.current.update('A', { titel: 'Nieuw A' })
      result.current.update('B', { titel: 'Nieuw B' })
    })
    await wachtOpDebounce()

    expect(db.get('B')!.titel).toBe('Nieuw B')
    expect(db.get('A')!.titel).toBe('Nieuw A')
  })

  it('"opslaan" blijft aan zolang er voor een andere vergadering nog iets openstaat', async () => {
    const { result } = await start()
    act(() => { result.current.update('A', { titel: 'Nieuw A' }) })
    await act(async () => { await vi.advanceTimersByTimeAsync(2000) })
    act(() => { result.current.update('B', { titel: 'Nieuw B' }) })

    await act(async () => { await vi.advanceTimersByTimeAsync(1500) }) // A is geschreven, B nog niet
    expect(db.get('A')!.titel).toBe('Nieuw A')
    expect(result.current.opslaan).toBe(true)

    await wachtOpDebounce()
    expect(db.get('B')!.titel).toBe('Nieuw B')
    expect(result.current.opslaan).toBe(false)
  })
})
