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
  type?: 'normaal' | 'actielijst' | 'kalender'
}

export interface ActieItem {
  id: string
  naam: string
  actie: string
  afgedaan: boolean
  datum: string // vergaderdatum waarop toegevoegd
}

export interface KalenderItem {
  id: string
  datum: string
  omschrijving: string
  personen?: string
}

export interface Vergadering {
  id: string
  titel: string
  versie: number
  datum: string
  aanvang: string
  locatie: string
  aanwezig: string
  online: string
  afwezig: string
  punten: Agendapunt[]
  actielijst: ActieItem[]
  kalender: KalenderItem[]
  heeftPolitiekeAvond: boolean
  politiekeAvondDatum: string
  politiekeAvondUrl: string
  heeftRaadsvergadering: boolean
  raadsvergaderingDatum: string
  raadsvergaderingUrl: string
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
  sorteerdatum?: string
  status?: string
  afgedaan?: string
  indieners?: string
  fracties?: string
  url: string
  gevonden_op?: string
}
