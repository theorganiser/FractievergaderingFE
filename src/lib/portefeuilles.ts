import { apiJson } from './dataApi'

export interface Portefeuille {
  id: string
  volgorde: number
  onderwerp: string
  programma: string
  woordvoerder_1: string
  woordvoerder_2: string
  woordvoerder_3: string
}

// Alleen lezen — wijzigen kan uitsluitend via SQL in Supabase
export async function haalPortefeuilles(): Promise<Portefeuille[]> {
  try { return await apiJson<Portefeuille[]>('/api/portefeuilles') }
  catch (err) { console.error('Portefeuilles laden fout:', err); return [] }
}
