import { ApiDocument } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://datascraperraad.onrender.com'

export interface SyncLogItem {
  timestamp: string
  status: string
  nieuw?: number
  bijgewerkt?: number
  per_type?: Record<string, { nieuw: number; bijgewerkt: number }>
  [key: string]: unknown
}

// Raadsmededelingen — alle, nieuwste eerst
export async function haalRaadsmededelingen(): Promise<ApiDocument[]> {
  const resp = await fetch(`${API_URL}/documenten?type=raadsmededelingen`)
  if (!resp.ok) throw new Error(`API fout: ${resp.status}`)
  const data = await resp.json()
  return Array.isArray(data) ? data : (data.documenten || [])
}

// Vragen — alleen afgedaan, beide types
export async function haalAfgedaaneVragen(): Promise<ApiDocument[]> {
  const [tq, sq] = await Promise.all([
    fetch(`${API_URL}/documenten?type=technische_vragen&alleen_afgedaan=true`).then(r => r.json()).catch(() => []),
    fetch(`${API_URL}/documenten?type=schriftelijke_vragen&alleen_afgedaan=true`).then(r => r.json()).catch(() => []),
  ])
  const tqDocs: ApiDocument[] = Array.isArray(tq) ? tq : (tq.documenten || [])
  const sqDocs: ApiDocument[] = Array.isArray(sq) ? sq : (sq.documenten || [])
  // Combineer en sorteer op afgedaan-datum nieuwste eerst
  return [...tqDocs, ...sqDocs].sort((a, b) =>
    (b.afgedaan || '').localeCompare(a.afgedaan || '')
  )
}

// Sync starten + log ophalen
export async function startSyncEnWacht(): Promise<SyncLogItem[]> {
  await fetch(`${API_URL}/sync/nu`, { method: 'POST' })
  // Wacht even zodat de backend klaar is
  await new Promise(r => setTimeout(r, 3000))
  return haalSyncLog()
}

export async function haalSyncLog(): Promise<SyncLogItem[]> {
  const resp = await fetch(`${API_URL}/sync/log`)
  if (!resp.ok) throw new Error(`API fout: ${resp.status}`)
  const data = await resp.json()
  return Array.isArray(data) ? data : []
}

export async function testVerbinding(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_URL}/documenten/per-type`)
    return resp.ok
  } catch {
    return false
  }
}

// Demo data
export const DEMO_RM: ApiDocument[] = [
  {
    id: 'demo_rm1',
    type: 'raadsmededelingen',
    titel: '1522394 RM Treasurystatuut',
    doc_nummer: '1522394',
    publicatiedatum: '2026-04-21',
    sorteerdatum: '2026-04-21',
    indieners: '',
    fracties: '',
    url: 'https://bestuur.gooisemeren.nl/Documenten/raadsinstrumenten/1522394-RM-Treasurystatuut/',
  },
  {
    id: 'demo_rm2',
    type: 'raadsmededelingen',
    titel: '1520113 RM Uitspraak Rechtbank MN',
    doc_nummer: '1520113',
    publicatiedatum: '2026-04-10',
    sorteerdatum: '2026-04-10',
    indieners: '',
    fracties: '',
    url: 'https://bestuur.gooisemeren.nl/Documenten/raadsinstrumenten/1520113-RM-Uitspraak-Rechtbank/',
  },
]

export const DEMO_VRAGEN: ApiDocument[] = [
  {
    id: 'demo_tq1',
    type: 'technische_vragen',
    titel: 'Beantwoording technische vragen – Grondstoffenbeleid',
    doc_nummer: '1519900',
    publicatiedatum: '2026-03-15',
    sorteerdatum: '2026-04-01',
    afgedaan: '2026-04-01',
    indieners: 'Vera Kraaij',
    fracties: 'GDP',
    url: 'https://bestuur.gooisemeren.nl/Documenten/raadsinstrumenten/1519900-TQ-Grondstoffenbeleid/',
  },
  {
    id: 'demo_sq1',
    type: 'schriftelijke_vragen',
    titel: 'Schriftelijke vragen GDP – Herinrichting Muiderberg en warmtenet',
    doc_nummer: '1518500',
    publicatiedatum: '2026-02-20',
    sorteerdatum: '2026-03-31',
    afgedaan: '2026-03-31',
    indieners: 'Pieter Knecht',
    fracties: 'GDP',
    url: 'https://bestuur.gooisemeren.nl/Documenten/raadsinstrumenten/1518500-SQ-Muiderberg/',
  },
]

// ===== NIEUWS =====

export interface NieuwsArtikel {
  id: string
  bron: 'gooisemerennieuws' | 'nhgooi' | 'gooieneemlander' | 'gemeente_gooisemeren'
  titel: string
  intro: string
  categorie: string
  url: string
  afbeelding_url?: string
  gepubliceerd: string
  gevonden_op: string
  is_betaald: number
}

const BRON_LABELS: Record<string, string> = {
  gooisemerennieuws: 'GooiseMerenNieuws',
  nhgooi: 'NH Gooi',
  gooieneemlander: 'Gooi en Eemlander',
  gemeente_gooisemeren: 'Gemeente Gooise Meren',
}

export { BRON_LABELS }

export async function haalNieuws(bron?: string, categorie?: string): Promise<NieuwsArtikel[]> {
  try {
    const params = new URLSearchParams()
    if (bron) params.set('bron', bron)
    if (categorie) params.set('categorie', categorie)
    const query = params.toString() ? `?${params.toString()}` : ''
    const resp = await fetch(`${API_URL}/nieuws${query}`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!resp.ok) return []
    return await resp.json()
  } catch {
    return []
  }
}

export async function syncNieuws(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_URL}/sync/nieuws`, {
      method: 'POST',
      signal: AbortSignal.timeout(60000),
    })
    return resp.ok
  } catch {
    return false
  }
}
