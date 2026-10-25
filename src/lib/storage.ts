import { apiJson, stuur, ApiFout, SESSIE_VERLOPEN } from './dataApi'
import { zorgVoorSleutels } from './samenvoegen'
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

// ok true: bijgewerkt is gezet. ok false: reden en melding zijn gezet.
export interface OpslaanResultaat {
  ok: boolean
  bijgewerkt?: string
  reden?: 'conflict' | 'sessie' | 'fout'
  melding?: string
}

function naarResultaat(err: unknown): OpslaanResultaat {
  console.error(err)
  if (err instanceof ApiFout && err.status === 409) return { ok: false, reden: 'conflict', melding: 'Iemand anders heeft net iets gewijzigd.' }
  if (err instanceof ApiFout && err.status === 401) return { ok: false, reden: 'sessie', melding: SESSIE_VERLOPEN }
  if (err instanceof ApiFout) return { ok: false, reden: 'fout', melding: err.message }
  return { ok: false, reden: 'fout', melding: 'Opslaan mislukt. Controleer je verbinding.' }
}

/**
 * Slaat een vergadering op.
 * Met verwachtBijgewerkt (de 'bijgewerkt' van de versie waarop je wijziging gebaseerd is) weigert
 * de server het opslaan (reden 'conflict') als iemand anders er intussen iets aan veranderd heeft.
 * Zonder verwachtBijgewerkt: gewoon opslaan (alleen voor nieuwe vergaderingen).
 */
export async function slaVergaderingOp(vergadering: Vergadering, verwachtBijgewerkt?: string): Promise<OpslaanResultaat> {
  const schoon = { ...vergadering, punten: zorgVoorSleutels(vergadering.punten || []) }
  try {
    const res = await apiJson<{ ok: true; bijgewerkt: string }>('/api/vergaderingen', stuur('POST', { vergadering: schoon, verwachtBijgewerkt }))
    return { ok: true, bijgewerkt: res.bijgewerkt }
  } catch (err) { return naarResultaat(err) }
}

/**
 * Lees-wijzig-schrijf met versiecontrole: haalt de verse versie op, past de wijziging toe en
 * schrijft alleen weg als niemand er tussendoor iets aan heeft veranderd. Zo niet, dan opnieuw
 * (met de nieuwe versie), tot een paar keer. wijzig() mag null teruggeven = niets te doen.
 */
export async function wijzigVergadering(
  laad: () => Promise<Vergadering | null>,
  wijzig: (v: Vergadering) => Vergadering | null,
): Promise<{ resultaat: OpslaanResultaat; vergadering: Vergadering | null }> {
  let laatste: OpslaanResultaat = { ok: false, reden: 'fout', melding: 'Opslaan mislukt.' }
  for (let poging = 0; poging < 4; poging++) {
    const vers = await laad()
    if (!vers) return { resultaat: { ok: false, reden: 'fout', melding: 'Kon de vergadering niet ophalen. Controleer je verbinding of log opnieuw in.' }, vergadering: null }
    const nieuw = wijzig(structuredClone(vers))
    if (!nieuw) return { resultaat: { ok: true, bijgewerkt: vers.bijgewerkt }, vergadering: vers }
    laatste = await slaVergaderingOp(nieuw, vers.bijgewerkt)
    if (laatste.ok) return { resultaat: laatste, vergadering: { ...nieuw, punten: zorgVoorSleutels(nieuw.punten), bijgewerkt: laatste.bijgewerkt } }
    if (laatste.reden !== 'conflict') break
  }
  return { resultaat: laatste, vergadering: null }
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

export interface AanwezigheidResultaat {
  ok: boolean
  aanwezig?: string; online?: string; afwezig?: string; bijgewerkt?: string
  melding?: string
}

export async function zetAanwezigheidDb(vergaderingId: string, naam: string, status: 'aanwezig' | 'online' | 'afwezig' | null): Promise<AanwezigheidResultaat> {
  try {
    const res = await apiJson<{ aanwezig: string; online: string; afwezig: string; bijgewerkt: string }>(
      `/api/vergaderingen/${encodeURIComponent(vergaderingId)}/aanwezigheid`, stuur('POST', { naam, status }))
    return { ok: true, ...res }
  } catch (err) {
    return { ok: false, melding: naarResultaat(err).melding }
  }
}
