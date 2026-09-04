import { supabase } from './supabase'

export interface Portefeuille {
  id: string
  volgorde: number
  onderwerp: string
  programma: string
  woordvoerder_1: string
  woordvoerder_2: string
  woordvoerder_3: string
}

// Alleen lezen — wijzigen kan uitsluitend via SQL in Supabase (zie supabase-portefeuilles.sql)
export async function haalPortefeuilles(): Promise<Portefeuille[]> {
  const { data, error } = await supabase
    .from('portefeuilles')
    .select('*')
    .order('volgorde', { ascending: true })

  if (error) { console.error('Portefeuilles laden fout:', error); return [] }
  return data || []
}
