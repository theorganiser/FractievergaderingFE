import { Vergadering } from './types'

const SLEUTEL = 'gm_vergaderingen'
const AUTH_SLEUTEL = 'gm_is_beheerder'

export function laadVergaderingen(): Vergadering[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SLEUTEL)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function slaVergaderingenOp(vergaderingen: Vergadering[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SLEUTEL, JSON.stringify(vergaderingen))
}

export function isBeheerder(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(AUTH_SLEUTEL) === 'true'
}

export function setBeheerder(waarde: boolean): void {
  if (typeof window === 'undefined') return
  if (waarde) {
    sessionStorage.setItem(AUTH_SLEUTEL, 'true')
  } else {
    sessionStorage.removeItem(AUTH_SLEUTEL)
  }
}

export function nieuweId(): string {
  return 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
}

export function nieuwToken(): string {
  return Math.random().toString(36).substr(2, 12)
}
