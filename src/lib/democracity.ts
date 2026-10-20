import { apiJson } from './dataApi'

export interface DemocracityAanmelding { id: string; naam: string; aangemaakt_op: string }

export interface DemocracityDag {
  id: string
  datum: string          // YYYY-MM-DD
  tijd: string
  school: string
  max_personen: number
  democracity_aanmeldingen: DemocracityAanmelding[]
}

// Lezen, aanmelden en beheren gaat via /api/democracity.
export async function haalDemocracityDagen(): Promise<DemocracityDag[]> {
  try { return await apiJson<DemocracityDag[]>('/api/democracity') }
  catch (err) { console.error('Democracity laden fout:', err); throw err }
}
