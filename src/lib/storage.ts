import { supabase } from './supabase'
import { Vergadering } from './types'

// Auth blijft in sessionStorage (alleen beheerder-vlag, geen gevoelige data)
const AUTH_SLEUTEL = 'gm_is_beheerder'

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

// ── Supabase CRUD ──────────────────────────────────────────────

export async function laadVergaderingen(): Promise<Vergadering[]> {
  const { data, error } = await supabase
    .from('vergaderingen')
    .select('*')
    .order('datum', { ascending: false })

  if (error) {
    console.error('Fout bij laden vergaderingen:', error)
    return []
  }

  return (data || []).map(rijNaarVergadering)
}

export async function laadVergadering(id: string): Promise<Vergadering | null> {
  const { data, error } = await supabase
    .from('vergaderingen')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return rijNaarVergadering(data)
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

  if (error) {
    console.error('Fout bij opslaan vergadering:', error)
    return false
  }
  return true
}

export async function verwijderVergaderingDb(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('vergaderingen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Fout bij verwijderen vergadering:', error)
    return false
  }
  return true
}

// ── Type conversie ─────────────────────────────────────────────

function rijNaarVergadering(rij: Record<string, unknown>): Vergadering {
  return {
    id: rij.id as string,
    titel: rij.titel as string,
    datum: (rij.datum as string) || '',
    aanvang: (rij.aanvang as string) || '20:00',
    locatie: (rij.locatie as string) || '',
    aanwezig: (rij.aanwezig as string) || '',
    online: (rij.online as string) || '',
    afwezig: (rij.afwezig as string) || '',
    punten: (rij.punten as Vergadering['punten']) || [],
    deeltoken: rij.deeltoken as string,
    aangemaakt: rij.aangemaakt as string,
    bijgewerkt: rij.bijgewerkt as string,
  }
}

function vergaderingNaarRij(v: Vergadering): Record<string, unknown> {
  return {
    id: v.id,
    titel: v.titel,
    datum: v.datum,
    aanvang: v.aanvang,
    locatie: v.locatie,
    aanwezig: v.aanwezig,
    online: v.online,
    afwezig: v.afwezig,
    punten: v.punten,
    deeltoken: v.deeltoken,
    aangemaakt: v.aangemaakt,
  }
}
