import { supabase } from './supabase'

export interface DemocracityAanmelding { id: string; naam: string; aangemaakt_op: string }

export interface DemocracityDag {
  id: string
  datum: string          // YYYY-MM-DD
  tijd: string
  school: string
  max_personen: number
  democracity_aanmeldingen: DemocracityAanmelding[]
}

// Lezen mag via de browser; aanmelden en beheren gaat via /api/democracity.
export async function haalDemocracityDagen(): Promise<DemocracityDag[]> {
  const { data, error } = await supabase
    .from('democracity_dagen')
    .select('*, democracity_aanmeldingen(id, naam, aangemaakt_op)')
    .order('datum', { ascending: true })
    .order('tijd', { ascending: true })
  if (error) { console.error('Democracity laden fout:', error); throw error }
  return (data || []) as DemocracityDag[]
}
