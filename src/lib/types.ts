export interface Subpunt {
  id: string
  titel: string
  url?: string
  afgedaan?: boolean
  toelichting?: string
}

export interface Agendapunt {
  id: number
  titel: string
  toelichting?: string
  subpunten: Subpunt[]
  apiType?: 'raadsmededelingen' | 'vragen'
}

export interface Vergadering {
  id: string
  titel: string
  datum: string
  aanvang: string
  locatie: string
  aanwezig: string
  online: string
  afwezig: string
  punten: Agendapunt[]
  deeltoken: string
  aangemaakt: string
  bijgewerkt: string
}

export interface ApiDocument {
  id: string
  type: 'raadsmededelingen' | 'technische_vragen' | 'schriftelijke_vragen'
  titel: string
  doc_nummer: string
  publicatiedatum: string
  status?: string
  afgedaan?: string
  indieners?: string
  fracties?: string
  url: string
  gevonden_op?: string
}

export interface SyncLog {
  timestamp: string
  status: string
  aantalNieuw: number
}
