import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextResponse } from 'next/server'
import { leesSessie, vereis } from './sessie'
import { maakToken, COOKIE_LEZER, COOKIE_ADMIN, COOKIE_MODERATOR } from './auth'

const koekjes = (waarden: Record<string, string>) => ({
  get: (naam: string) => (naam in waarden ? { value: waarden[naam] } : undefined),
})

const lezer = (naam = 'Anna') => maakToken({ rol: 'lezer', naam, eigen: '0' }, '1h')
const admin = (naam = 'Anna') => maakToken({ rol: 'admin', naam }, '1h')
const moderator = (naam = 'Anna') => maakToken({ rol: 'moderator', naam }, '1h')

describe('leesSessie', () => {
  beforeEach(() => { vi.stubEnv('JWT_SECRET', 'test-geheim-van-minstens-32-tekens!!') })
  afterEach(() => { vi.unstubAllEnvs() })

  it('geen cookies → geen sessie', async () => {
    expect(await leesSessie(koekjes({}))).toBeNull()
  })

  it('geldige lezer-cookie → gewone sessie met naam', async () => {
    const s = await leesSessie(koekjes({ [COOKIE_LEZER]: await lezer('Bert') }))
    expect(s).toEqual({ naam: 'Bert', isAdmin: false, isModerator: false, eigenWachtwoord: false, rolWacht: '' })
  })

  it('vervalste cookie-waarde → geen sessie', async () => {
    expect(await leesSessie(koekjes({ [COOKIE_LEZER]: 'x' }))).toBeNull()
  })

  it('admin-cookie geeft admin- én moderatorrechten', async () => {
    const s = await leesSessie(koekjes({ [COOKIE_LEZER]: await lezer(), [COOKIE_ADMIN]: await admin() }))
    expect(s).toMatchObject({ isAdmin: true, isModerator: true })
  })

  it('moderator-cookie geeft alleen moderatorrechten', async () => {
    const s = await leesSessie(koekjes({ [COOKIE_LEZER]: await lezer(), [COOKIE_MODERATOR]: await moderator() }))
    expect(s).toMatchObject({ isAdmin: false, isModerator: true })
  })

  it('admin-cookie zonder lezer-cookie → geen sessie', async () => {
    expect(await leesSessie(koekjes({ [COOKIE_ADMIN]: await admin() }))).toBeNull()
  })

  // Het gat dat hiermee dicht is: alle tokens zijn met hetzelfde geheim ondertekend
  it('lezer-token in de admin-cookie geplakt → géén admin', async () => {
    const t = await lezer()
    const s = await leesSessie(koekjes({ [COOKIE_LEZER]: t, [COOKIE_ADMIN]: t, [COOKIE_MODERATOR]: t }))
    expect(s).toMatchObject({ isAdmin: false, isModerator: false })
  })

  // Rol-cookies horen bij één persoon: niet te combineren met een login onder een andere naam
  it('admin-cookie van iemand anders → géén admin', async () => {
    const s = await leesSessie(koekjes({ [COOKIE_LEZER]: await lezer('Vera'), [COOKIE_ADMIN]: await admin('Pieter') }))
    expect(s).toMatchObject({ naam: 'Vera', isAdmin: false, isModerator: false })
  })

  it('oude admin-cookie zonder naam → géén admin', async () => {
    const s = await leesSessie(koekjes({ [COOKIE_LEZER]: await lezer('Pieter'), [COOKIE_ADMIN]: await maakToken({ rol: 'admin' }, '1h') }))
    expect(s).toMatchObject({ isAdmin: false })
  })

  it('beheerder die nog een eigen wachtwoord moet instellen', async () => {
    const t = await maakToken({ rol: 'lezer', naam: 'Pieter', eigen: '0', rolWacht: 'beheerder' }, '1h')
    expect(await leesSessie(koekjes({ [COOKIE_LEZER]: t }))).toMatchObject({ isAdmin: false, rolWacht: 'beheerder' })
  })

  it('admin-token in de lezer-cookie → geen sessie', async () => {
    expect(await leesSessie(koekjes({ [COOKIE_LEZER]: await admin() }))).toBeNull()
  })
})

describe('vereis', () => {
  beforeEach(() => { vi.stubEnv('JWT_SECRET', 'test-geheim-van-minstens-32-tekens!!') })
  afterEach(() => { vi.unstubAllEnvs() })

  const req = (waarden: Record<string, string>) => ({ cookies: koekjes(waarden) })

  it('401 zonder login', async () => {
    const r = await vereis(req({}))
    expect(r).toBeInstanceOf(NextResponse)
    expect((r as NextResponse).status).toBe(401)
  })

  it('403 voor een fractielid op een beheerdersroute', async () => {
    const r = await vereis(req({ [COOKIE_LEZER]: await lezer() }), 'admin')
    expect((r as NextResponse).status).toBe(403)
  })

  it('403 voor een moderator op een beheerdersroute, maar toegang tot moderatorroutes', async () => {
    const cookies = { [COOKIE_LEZER]: await lezer(), [COOKIE_MODERATOR]: await moderator() }
    expect(((await vereis(req(cookies), 'admin')) as NextResponse).status).toBe(403)
    expect(await vereis(req(cookies), 'moderator')).not.toBeInstanceOf(NextResponse)
  })

  it('geeft de sessie terug als het niveau klopt', async () => {
    const r = await vereis(req({ [COOKIE_LEZER]: await lezer('Carla'), [COOKIE_ADMIN]: await admin('Carla') }), 'admin')
    expect(r).toMatchObject({ naam: 'Carla', isAdmin: true })
  })
})
