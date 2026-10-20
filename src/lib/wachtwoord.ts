import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from './supabaseAdmin'

// Ongetypeerde client (we hebben geen gegenereerde database-types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => getSupabaseAdmin() as unknown as SupabaseClient<any, 'public', any>

// Persoonlijke wachtwoorden staan in een aparte tabel (gebruiker_wachtwoorden) die voor de
// browser/anon-key volledig dicht zit (RLS aan, geen policies). Alleen de server (service-role)
// kan er bij. Zo kan niemand de hashes uitlezen via de publieke Supabase-key.
// Alleen importeren in API-routes (server-side).

const TABEL = 'gebruiker_wachtwoorden'
export const MIN_LENGTE = 8

export function hashWachtwoord(wachtwoord: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(wachtwoord, salt, 64)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function controleerWachtwoord(wachtwoord: string, opgeslagen: string): boolean {
  const [type, saltHex, hashHex] = opgeslagen.split('$')
  if (type !== 'scrypt' || !saltHex || !hashHex) return false
  const verwacht = Buffer.from(hashHex, 'hex')
  const berekend = scryptSync(wachtwoord, Buffer.from(saltHex, 'hex'), verwacht.length)
  return verwacht.length === berekend.length && timingSafeEqual(verwacht, berekend)
}

// Is de tabel er nog niet (SQL nog niet uitgevoerd)? Dan werkt alles als voorheen met de gedeelde code.
function isTabelOntbreekt(error: { code?: string; message?: string }): boolean {
  return error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || '')
}

// null = geen persoonlijk wachtwoord. Gooit bij echte fouten, zodat inloggen niet stilletjes
// terugvalt op de gedeelde code (dat zou een achterdeur zijn).
export async function haalWachtwoordHash(naam: string): Promise<string | null> {
  const { data, error } = await db().from(TABEL).select('hash').eq('naam', naam).maybeSingle()
  if (error) {
    if (isTabelOntbreekt(error)) return null
    throw new Error(`Wachtwoord ophalen mislukt: ${error.message}`)
  }
  return (data as { hash?: string } | null)?.hash || null
}

export async function zetWachtwoord(naam: string, wachtwoord: string): Promise<void> {
  const { error } = await db().from(TABEL).upsert({
    naam, hash: hashWachtwoord(wachtwoord), gewijzigd: new Date().toISOString(),
  })
  if (error) throw new Error(`Wachtwoord opslaan mislukt: ${error.message}`)
}

export async function verwijderWachtwoord(naam: string): Promise<void> {
  const { error } = await db().from(TABEL).delete().eq('naam', naam)
  if (error) throw new Error(`Wachtwoord resetten mislukt: ${error.message}`)
}

export async function namenMetWachtwoord(): Promise<string[]> {
  const { data, error } = await db().from(TABEL).select('naam')
  if (error) {
    if (isTabelOntbreekt(error)) return []
    throw new Error(`Wachtwoorden ophalen mislukt: ${error.message}`)
  }
  return ((data || []) as { naam: string }[]).map(r => r.naam)
}

// Staat 'persoonlijk wachtwoord verplicht' aan? (env WACHTWOORD_VERPLICHT=true)
export function wachtwoordVerplicht(): boolean {
  return process.env.WACHTWOORD_VERPLICHT === 'true'
}
