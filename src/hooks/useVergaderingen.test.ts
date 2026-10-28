// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { Vergadering } from '@/lib/types'

// "Database" in het geheugen, zodat we kunnen zien wat er werkelijk weggeschreven wordt.
// Net als de echte database krijgt elke schrijfactie een nieuwe 'bijgewerkt', en weigert
// opslaan met een verouderde 'verwachtBijgewerkt' (conflict).
const db = new Map<string, Vergadering>()
let teller = 0
const nieuweVersie = () => `2026-10-25T10:00:00.${String(++teller).padStart(6, '0')}+00:00`
// Schrijft "als iemand anders" (bijv. een fractielid in de leesweergave)
const ander = (id: string, velden: Partial<Vergadering>) => db.set(id, { ...db.get(id)!, ...velden, bijgewerkt: nieuweVersie() })

vi.mock('@/lib/storage', () => {
  const slaVergaderingOp = vi.fn(async (v: Vergadering, verwacht?: string) => {
    if (verwacht && db.get(v.id)?.bijgewerkt !== verwacht) return { ok: false, reden: 'conflict', melding: 'conflict' }
    const bijgewerkt = nieuweVersie()
    db.set(v.id, structuredClone({ ...v, bijgewerkt }))
    return { ok: true, bijgewerkt }
  })
  const laadVergaderingOpId = vi.fn(async (id: string) => (db.has(id) ? structuredClone(db.get(id)!) : null))
  return {
    laadVergaderingen: vi.fn(async () => Array.from(db.values()).map(v => structuredClone(v))),
    laadVergaderingOpToken: vi.fn(async () => null),
    laadVergaderingOpId,
    slaVergaderingOp,
    wijzigVergadering: vi.fn(async (laad: () => Promise<Vergadering | null>, wijzig: (v: Vergadering) => Vergadering | null) => {
      for (let i = 0; i < 4; i++) {
        const vers = await laad()
        if (!vers) return { resultaat: { ok: false, reden: 'fout', melding: 'weg' }, vergadering: null }
        const nieuw = wijzig(structuredClone(vers))
        if (!nieuw) return { resultaat: { ok: true, bijgewerkt: vers.bijgewerkt }, vergadering: vers }
        const r = await slaVergaderingOp(nieuw, vers.bijgewerkt)
        if (r.ok) return { resultaat: r, vergadering: { ...nieuw, bijgewerkt: r.bijgewerkt } }
        if (r.reden !== 'conflict') return { resultaat: r, vergadering: null }
      }
      return { resultaat: { ok: false, reden: 'conflict', melding: 'conflict' }, vergadering: null }
    }),
    zetAanwezigheidDb: vi.fn(async () => ({ ok: true, aanwezig: 'Vera', online: '', afwezig: '', bijgewerkt: nieuweVersie() })),
    verwijderVergaderingDb: vi.fn(async () => true),
    nieuweId: () => 'nieuw',
    maakLeesbarToken: () => 'token',
    nieuwToken: () => 'token',
  }
})

import { useVergaderingen } from './useVergaderingen'
import { slaVergaderingOp } from '@/lib/storage'

const vergadering = (id: string, velden: Partial<Vergadering> = {}): Vergadering => ({
  id, titel: `Vergadering ${id}`, datum: '2026-10-20', aanvang: '20:00', locatie: '', versie: 1,
  aanwezig: '', online: '', afwezig: '', punten: [], actielijst: [], kalender: [],
  deeltoken: `t-${id}`, aangemaakt: '', bijgewerkt: nieuweVersie(), notulen: '',
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

  // De echte oorzaak van verdwenen notities: de editor schreef de hele agenda terug vanuit
  // een kopie die bij het openen was geladen.
  it('editor overschrijft geen notitie die een fractielid intussen heeft toegevoegd', async () => {
    db.set('A', vergadering('A', { punten: [{ id: 1, titel: 'Mededelingen', subpunten: [] }] }))
    const { result } = await start()

    // Fractielid plaatst een notitie terwijl de editor openstaat
    const notitie = { id: 'n1', naam: 'Vera', tekst: 'Graag bespreken', datum: '2026-10-25T09:00:00Z' }
    ander('A', { punten: [{ id: 1, titel: 'Mededelingen', subpunten: [], notities: [notitie] }] })

    // Editor past (op zijn oude kopie) de toelichting aan
    act(() => { result.current.updatePunt('A', 0, { toelichting: 'Korte ronde' }) })
    await wachtOpDebounce()

    const opgeslagen = db.get('A')!.punten[0]
    expect(opgeslagen.toelichting).toBe('Korte ronde')
    expect(opgeslagen.notities).toEqual([notitie])
    // en de editor ziet de notitie nu ook
    expect(result.current.vergaderingen.find(v => v.id === 'A')!.punten[0].notities).toEqual([notitie])
  })

  it('editor schrijft geen verouderde aanwezigheid terug', async () => {
    const { result } = await start()
    ander('A', { aanwezig: 'Vera' })   // Vera antwoordt via de pop-up
    act(() => { result.current.update('A', { titel: 'Nieuw' }) })
    await wachtOpDebounce()
    expect(db.get('A')).toMatchObject({ titel: 'Nieuw', aanwezig: 'Vera' })
  })

  it('probeert opnieuw als iemand precies tussen ophalen en schrijven iets opslaat', async () => {
    const { result } = await start()
    const storage = await import('@/lib/storage')
    const echt = vi.mocked(storage.laadVergaderingOpId).getMockImplementation()!
    let eerste = true
    vi.mocked(storage.laadVergaderingOpId).mockImplementation(async (id: string) => {
      const v = await echt(id)
      if (eerste) { eerste = false; ander(id, { notulen: 'tussendoor' }) }
      return v
    })
    act(() => { result.current.update('A', { titel: 'Nieuw' }) })
    await wachtOpDebounce()
    vi.mocked(storage.laadVergaderingOpId).mockImplementation(echt)

    expect(db.get('A')).toMatchObject({ titel: 'Nieuw', notulen: 'tussendoor' })
    expect(result.current.opslaanFout).toBe(false)
  })
})
