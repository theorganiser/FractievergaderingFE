import { apiJson, stuur } from './dataApi'

export interface StemItem {
  vergadering_id: string
  item_key: string
  stem: string
  notitie: string
}

const pad = (vergaderingId: string) => `/api/stemlijst/${encodeURIComponent(vergaderingId)}`

// Laad alle stemmen voor een vergadering
export async function laadStemmen(vergaderingId: string): Promise<Record<string, { stem: string; notitie: string }>> {
  let data: { item_key: string; stem: string; notitie: string }[]
  try { data = await apiJson(pad(vergaderingId)) } catch { return {} }
  const result: Record<string, { stem: string; notitie: string }> = {}
  data.forEach(r => { result[r.item_key] = { stem: r.stem, notitie: r.notitie } })
  return result
}

// Sla een stem op (upsert)
export async function slaaStemOp(vergaderingId: string, itemKey: string, stem: string, notitie: string): Promise<void> {
  try { await apiJson(pad(vergaderingId), stuur('POST', { itemKey, stem, notitie })) }
  catch (err) { console.error(err) }
}
