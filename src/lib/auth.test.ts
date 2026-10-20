import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { maakToken, verifieerToken, maakLezerCookie, verwijderCookies, COOKIE_LEZER } from './auth'

describe('auth', () => {
  beforeEach(() => { vi.stubEnv('JWT_SECRET', 'test-geheim-van-minstens-32-tekens!!') })
  afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers() })

  it('een gemaakt token is te verifiëren en bevat de payload', async () => {
    const token = await maakToken({ rol: 'admin' }, '1h')
    expect(await verifieerToken(token)).toMatchObject({ rol: 'admin' })
  })

  it('weigert een token met een ander geheim', async () => {
    const token = await maakToken({ rol: 'admin' }, '1h')
    vi.stubEnv('JWT_SECRET', 'een-heel-ander-geheim-van-32-tekens!')
    expect(await verifieerToken(token)).toBeNull()
  })

  it('weigert een gemanipuleerd token', async () => {
    const token = await maakToken({ rol: 'lezer' }, '1h')
    const [kop, , handtekening] = token.split('.')
    const nepPayload = Buffer.from(JSON.stringify({ rol: 'admin' })).toString('base64url')
    expect(await verifieerToken(`${kop}.${nepPayload}.${handtekening}`)).toBeNull()
  })

  it('weigert een verlopen token', async () => {
    const token = await maakToken({ rol: 'lezer' }, '1h')
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000)
    expect(await verifieerToken(token)).toBeNull()
  })

  it('weigert rommel', async () => {
    expect(await verifieerToken('geen-token')).toBeNull()
  })

  it('gooit als JWT_SECRET ontbreekt', async () => {
    vi.stubEnv('JWT_SECRET', '')
    await expect(maakToken({ rol: 'admin' }, '1h')).rejects.toThrow('JWT_SECRET')
  })

  it('lezer-cookie is HttpOnly en bevat naam en eigen-vlag', async () => {
    const cookie = await maakLezerCookie('Anna', true)
    expect(cookie).toMatch(new RegExp(`^${COOKIE_LEZER}=`))
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Strict')
    const token = cookie.split(';')[0].split('=')[1]
    expect(await verifieerToken(token)).toMatchObject({ rol: 'lezer', naam: 'Anna', eigen: '1' })
  })

  it('verwijderCookies wist alle drie de cookies', () => {
    const cookies = verwijderCookies()
    expect(cookies).toHaveLength(3)
    cookies.forEach(c => expect(c).toContain('Max-Age=0'))
  })
})
