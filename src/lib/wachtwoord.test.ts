import { describe, it, expect, vi } from 'vitest'

// Alleen de pure hash-functies; de database-functies hebben een echte Supabase nodig.
vi.mock('./supabaseAdmin', () => ({ getSupabaseAdmin: () => { throw new Error('niet in unittests') } }))

import { hashWachtwoord, controleerWachtwoord } from './wachtwoord'

describe('wachtwoord-hashing', () => {
  it('juist wachtwoord klopt, fout wachtwoord niet', () => {
    const hash = hashWachtwoord('geheim123')
    expect(controleerWachtwoord('geheim123', hash)).toBe(true)
    expect(controleerWachtwoord('Geheim123', hash)).toBe(false)
  })

  it('gebruikt elke keer een nieuwe salt', () => {
    expect(hashWachtwoord('zelfde')).not.toBe(hashWachtwoord('zelfde'))
  })

  it('slaat het wachtwoord niet leesbaar op', () => {
    const hash = hashWachtwoord('geheim123')
    expect(hash).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
    expect(hash).not.toContain('geheim123')
  })

  it('weigert een onbekend of kapot formaat', () => {
    expect(controleerWachtwoord('x', '')).toBe(false)
    expect(controleerWachtwoord('x', 'bcrypt$abc$def')).toBe(false)
    expect(controleerWachtwoord('x', 'scrypt$$')).toBe(false)
  })
})
