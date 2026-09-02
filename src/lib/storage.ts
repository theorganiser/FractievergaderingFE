import { supabase } from './supabase'
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
  const { data, error } = await supabase
    .from('vergaderingen')
    .select('*')
    .order('datum', { ascending: false })
  if (error) { console.error(error); return [] }
  return (data || []).map(rijNaarVergadering)
}

export async function laadVergaderingOpToken(token: string): Promise<Vergadering | null> {
  const { data, error } = await supabase
    .from('vergaderingen')
    .select('*')
    .eq('deeltoken', token)
    .single()
  if (error) return null
  return rijNaarVergadering(data)
}

export async function slaVergaderingOp(vergadering: Vergadering): Promise<boolean> {
  const { error } = await supabase
    .from('vergaderingen')
    .upsert(vergaderingNaarRij(vergadering), { onConflict: 'id' })
  if (error) { console.error(error); return false }
  return true
}

export async function verwijderVergaderingDb(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('vergaderingen')
    .delete()
    .eq('id', id)
  if (error) { console.error(error); return false }
  return true
}

function rijNaarVergadering(rij: Record<string, unknown>): Vergadering {
  return {
    id: rij.id as string,
    titel: rij.titel as string,
    versie: (rij.versie as number) || 1,
    datum: (rij.datum as string) || '',
    aanvang: (rij.aanvang as string) || '20:00',
    locatie: (rij.locatie as string) || '',
    aanwezig: (rij.aanwezig as string) || '',
    online: (rij.online as string) || '',
    afwezig: (rij.afwezig as string) || '',
    punten: (rij.punten as Vergadering['punten']) || [],
    actielijst: (rij.actielijst as Vergadering['actielijst']) || [],
    kalender: (rij.kalender as Vergadering['kalender']) || [],
    heeftPolitiekeAvond: (rij.heeft_politieke_avond as boolean) || false,
    politiekeAvondDatum: (rij.politieke_avond_datum as string) || '',
    politiekeAvondUrl: (rij.politieke_avond_url as string) || '',
    heeftRaadsvergadering: (rij.heeft_raadsvergadering as boolean) || false,
    raadsvergaderingDatum: (rij.raadsvergadering_datum as string) || '',
    raadsvergaderingUrl: (rij.raadsvergadering_url as string) || '',
    deeltoken: rij.deeltoken as string,
    aangemaakt: rij.aangemaakt as string,
    bijgewerkt: rij.bijgewerkt as string,
    notulen: (rij.notulen as string) || '',
  }
}

function vergaderingNaarRij(v: Vergadering): Record<string, unknown> {
  return {
    id: v.id,
    titel: v.titel,
    versie: v.versie,
    datum: v.datum,
    aanvang: v.aanvang,
    locatie: v.locatie,
    aanwezig: v.aanwezig,
    online: v.online,
    afwezig: v.afwezig,
    punten: v.punten,
    actielijst: v.actielijst,
    kalender: v.kalender,
    heeft_politieke_avond: v.heeftPolitiekeAvond,
    politieke_avond_datum: v.politiekeAvondDatum,
    politieke_avond_url: v.politiekeAvondUrl,
    heeft_raadsvergadering: v.heeftRaadsvergadering,
    raadsvergadering_datum: v.raadsvergaderingDatum,
    raadsvergadering_url: v.raadsvergaderingUrl,
    deeltoken: v.deeltoken,
    aangemaakt: v.aangemaakt,
    notulen: v.notulen || '',
  }
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
