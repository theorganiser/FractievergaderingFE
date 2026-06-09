import { supabase } from './supabase'

export interface StemItem {
  vergadering_id: string
  item_key: string
  stem: string
  notitie: string
}

// Laad alle stemmen voor een vergadering
export async function laadStemmen(vergaderingId: string): Promise<Record<string, { stem: string; notitie: string }>> {
  const { data, error } = await supabase
    .from('stemlijst_stemmen')
    .select('item_key, stem, notitie')
    .eq('vergadering_id', vergaderingId)

  if (error || !data) return {}
  const result: Record<string, { stem: string; notitie: string }> = {}
  data.forEach(r => { result[r.item_key] = { stem: r.stem, notitie: r.notitie } })
  return result
}

// Sla een stem op (upsert)
export async function slaaStemOp(vergaderingId: string, itemKey: string, stem: string, notitie: string): Promise<void> {
  await supabase.from('stemlijst_stemmen').upsert({
    vergadering_id: vergaderingId,
    item_key: itemKey,
    stem,
    notitie,
    bijgewerkt_op: new Date().toISOString(),
  }, { onConflict: 'vergadering_id,item_key' })
}
