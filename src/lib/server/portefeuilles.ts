import { db } from './db'
import type { Portefeuille } from '../portefeuilles'

// Alleen lezen — wijzigen kan uitsluitend via SQL in Supabase
export async function haalPortefeuillesServer(): Promise<Portefeuille[]> {
  const { data, error } = await db().from('portefeuilles').select('*').order('volgorde', { ascending: true })
  if (error) { console.error('Portefeuilles laden fout:', error); return [] }
  return data || []
}
