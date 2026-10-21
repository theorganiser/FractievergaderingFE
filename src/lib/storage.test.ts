import { describe, it, expect } from 'vitest'
import { maakLeesbarToken } from './storage'

describe('maakLeesbarToken', () => {
  it('maakt een leesbare token van de datum', () => {
    expect(maakLeesbarToken('2026-05-18')).toBe('fractievergadering-18-05-2026')
  })

  it('nummert door bij een dubbele datum', () => {
    const bestaand = ['fractievergadering-18-05-2026', 'fractievergadering-18-05-2026-2']
    expect(maakLeesbarToken('2026-05-18', bestaand)).toBe('fractievergadering-18-05-2026-3')
  })

  it('valt terug op een willekeurige token zonder bruikbare datum', () => {
    expect(maakLeesbarToken('')).not.toMatch(/^fractievergadering/)
    expect(maakLeesbarToken('18 mei')).not.toMatch(/^fractievergadering/)
  })
})
