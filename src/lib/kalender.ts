import { supabase } from './supabase'

export interface CentraalKalenderItem {
  id: string
  datum: string
  starttijd: string
  omschrijving: string
  locatie: string
  personen: string
  aangemaakt_op: string
  bijgewerkt_op: string
}

// Haal alle kalenderitems op gesorteerd op datum
export async function haalKalenderItems(alleenToekomst = false): Promise<CentraalKalenderItem[]> {
  let query = supabase
    .from('kalender_items')
    .select('*')
    .order('datum', { ascending: true })

  if (alleenToekomst) {
    const vandaag = new Date().toISOString().split('T')[0]
    query = query.gte('datum', vandaag)
  }

  const { data, error } = await query
  if (error) { console.error('Kalender laden fout:', error); return [] }
  return data || []
}

// Voeg nieuw item toe
export async function voegKalenderItemToe(
  item: Omit<CentraalKalenderItem, 'id' | 'aangemaakt_op' | 'bijgewerkt_op'>
): Promise<CentraalKalenderItem | null> {
  const { data, error } = await supabase
    .from('kalender_items')
    .insert(item)
    .select()
    .single()

  if (error) { console.error('Kalender toevoegen fout:', error); return null }
  return data
}

// Update bestaand item
export async function updateKalenderItem(
  id: string,
  wijzigingen: Partial<Omit<CentraalKalenderItem, 'id' | 'aangemaakt_op' | 'bijgewerkt_op'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('kalender_items')
    .update(wijzigingen)
    .eq('id', id)

  if (error) { console.error('Kalender update fout:', error); return false }
  return true
}

// Verwijder item
export async function verwijderKalenderItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('kalender_items')
    .delete()
    .eq('id', id)

  if (error) { console.error('Kalender verwijderen fout:', error); return false }
  return true
}
