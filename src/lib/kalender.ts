import { apiJson, stuur } from './dataApi'

export type KalenderCategorie = 'belangrijk' | 'uitnodiging_regio' | 'overige_uitnodigingen' | ''

export interface CentraalKalenderItem {
  id: string
  datum: string
  starttijd: string
  omschrijving: string
  locatie: string
  personen: string
  categorie: KalenderCategorie
  aangemaakt_op: string
  bijgewerkt_op: string
}

// Haal alle kalenderitems op gesorteerd op datum
// maxDagenVooruit: beperkt tot items binnen dat aantal dagen vanaf vandaag (alleen met alleenToekomst)
export async function haalKalenderItems(alleenToekomst = false, maxDagenVooruit?: number): Promise<CentraalKalenderItem[]> {
  const params = new URLSearchParams()
  if (alleenToekomst) {
    params.set('vanaf', new Date().toISOString().split('T')[0])
    if (maxDagenVooruit !== undefined) {
      const eind = new Date()
      eind.setDate(eind.getDate() + maxDagenVooruit)
      params.set('tot', eind.toISOString().split('T')[0])
    }
  }
  try { return await apiJson<CentraalKalenderItem[]>(`/api/kalender?${params}`) }
  catch (err) { console.error('Kalender laden fout:', err); return [] }
}

// Voeg nieuw item toe
export async function voegKalenderItemToe(
  item: Omit<CentraalKalenderItem, 'id' | 'aangemaakt_op' | 'bijgewerkt_op'>
): Promise<CentraalKalenderItem | null> {
  try { return await apiJson<CentraalKalenderItem>('/api/kalender', stuur('POST', item)) }
  catch (err) { console.error('Kalender toevoegen fout:', err); return null }
}

// Update bestaand item
export async function updateKalenderItem(
  id: string,
  wijzigingen: Partial<Omit<CentraalKalenderItem, 'id' | 'aangemaakt_op' | 'bijgewerkt_op'>>
): Promise<boolean> {
  try { await apiJson(`/api/kalender/${encodeURIComponent(id)}`, stuur('PATCH', wijzigingen)); return true }
  catch (err) { console.error('Kalender update fout:', err); return false }
}

// Verwijder item
export async function verwijderKalenderItem(id: string): Promise<boolean> {
  try { await apiJson(`/api/kalender/${encodeURIComponent(id)}`, stuur('DELETE')); return true }
  catch (err) { console.error('Kalender verwijderen fout:', err); return false }
}
