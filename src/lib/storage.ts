import { apiJson, stuur } from './dataApi'
import { Vergadering } from './types'

const AUTH_SLEUTEL = 'gm_is_beheerder'

export function isBeheerder(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(AUTH_SLEUTEL) === 'true'
}

export function setBeheerder(waarde: boolean): void {
  if (typeof window === 'undefined') return
  if (waarde) sessionStorage.setItem(AUTH_SLEUTEL, 'true')
  else sessionStorage.removeItem(AUTH_SLEUTEL)
}

export function nieuweId(): string {
  return 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
}

export function nieuwToken(): string {
  return Math.random().toString(36).substr(2, 12)
}

export async function laadVergaderingen(): Promise<Vergadering[]> {
  try { return await apiJson<Vergadering[]>('/api/vergaderingen') }
  catch (err) { console.error(err); return [] }
}

export async function laadVergaderingOpToken(token: string): Promise<Vergadering | null> {
  try { return await apiJson<Vergadering>(`/api/vergaderingen/token/${encodeURIComponent(token)}`) }
  catch { return null }
}

export async function laadVergaderingOpId(id: string): Promise<Vergadering | null> {
  try { return await apiJson<Vergadering>(`/api/vergaderingen/${encodeURIComponent(id)}`) }
  catch { return null }
}

export async function slaVergaderingOp(vergadering: Vergadering): Promise<boolean> {
  try { await apiJson('/api/vergaderingen', stuur('POST', vergadering)); return true }
  catch (err) { console.error(err); return false }
}

export async function verwijderVergaderingDb(id: string): Promise<boolean> {
  try { await apiJson(`/api/vergaderingen/${encodeURIComponent(id)}`, stuur('DELETE')); return true }
  catch (err) { console.error(err); return false }
}

/**
 * Maakt een leesbare deeltoken op basis van de datum
 * bijv. "fractievergadering-18-05-2026"
 * Bij dubbele datum: "fractievergadering-18-05-2026-2"
 */
export function maakLeesbarToken(datum: string, bestaandeTokens: string[] = []): string {
  if (!datum) return nieuwToken()
  const [jaar, maand, dag] = datum.split('-')
  if (!jaar || !maand || !dag) return nieuwToken()
  const basis = `fractievergadering-${dag}-${maand}-${jaar}`
  if (!bestaandeTokens.includes(basis)) return basis
  let teller = 2
  while (bestaandeTokens.includes(`${basis}-${teller}`)) { teller++ }
  return `${basis}-${teller}`
}
