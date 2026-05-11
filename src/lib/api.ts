import { ApiDocument } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://datascraperraad.onrender.com'

export async function haalDocumentenOp(type?: string): Promise<ApiDocument[]> {
  const url = type ? `${API_URL}/documenten?type=${type}` : `${API_URL}/documenten`
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`API fout: ${resp.status}`)
  const data = await resp.json()
  return Array.isArray(data) ? data : (data.documenten || [])
}

export async function haalNieuweDocumenten(sindsDatum: string): Promise<ApiDocument[]> {
  const resp = await fetch(`${API_URL}/documenten/nieuw?sinds_vergadering=${sindsDatum}`)
  if (!resp.ok) throw new Error(`API fout: ${resp.status}`)
  const data = await resp.json()
  return Array.isArray(data) ? data : (data.documenten || [])
}

export async function startSync(): Promise<void> {
  await fetch(`${API_URL}/sync/nu`, { method: 'POST' })
}

export async function haalSyncLog(): Promise<unknown[]> {
  const resp = await fetch(`${API_URL}/sync/log`)
  if (!resp.ok) throw new Error(`API fout: ${resp.status}`)
  return resp.json()
}

export async function testVerbinding(): Promise<boolean> {
  try {
    const resp = await fetch(`${API_URL}/documenten/per-type`)
    return resp.ok
  } catch {
    return false
  }
}

// Demo data voor als de API niet bereikbaar is
export const DEMO_DOCUMENTEN: ApiDocument[] = [
  {
    id: 'demo1',
    type: 'raadsmededelingen',
    titel: '1521110 RM Treasurystatuut',
    doc_nummer: '1521110',
    publicatiedatum: '06-05-2026',
    indieners: 'Richard de Rooy',
    fracties: 'Hart Voor Gooise Meren',
    url: 'https://bestuur.gooisemeren.nl/Documenten/Raadsmededelingen/1521110',
  },
  {
    id: 'demo2',
    type: 'raadsmededelingen',
    titel: '1520768 RM Deelfietsensysteem',
    doc_nummer: '1520768',
    publicatiedatum: '04-05-2026',
    indieners: '',
    fracties: '',
    url: 'https://bestuur.gooisemeren.nl/Documenten/Raadsmededelingen/1520768',
  },
  {
    id: 'demo3',
    type: 'technische_vragen',
    titel: 'Beantwoording technische vragen grondstoffenbeleid',
    doc_nummer: '1519900',
    publicatiedatum: '02-05-2026',
    indieners: 'Vera Kraaij',
    fracties: 'D66',
    url: 'https://bestuur.gooisemeren.nl/Documenten/Vragen/1519900',
    afgedaan: 'Afgedaan',
  },
  {
    id: 'demo4',
    type: 'schriftelijke_vragen',
    titel: 'Schriftelijke vragen over parkeerbeleid Bussum',
    doc_nummer: '1519750',
    publicatiedatum: '01-05-2026',
    indieners: 'Marga Streefland',
    fracties: 'VVD',
    url: 'https://bestuur.gooisemeren.nl/Documenten/Vragen/1519750',
  },
]
