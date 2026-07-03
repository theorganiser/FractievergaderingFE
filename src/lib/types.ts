export interface Subpunt {
  id: string
  titel: string
  url?: string
  afgedaan?: boolean
  toelichting?: string
  publicatiedatum?: string
  // Politieke Avond velden
  starttijd?: string
  woordvoerder?: string
  // Raadsvergadering velden
  rvNummer?: string        // bijv. "3a", "M26-57", "A26-58"
  inStemlijst?: boolean   // opnemen in stemlijst
  subtype?: 'motie' | 'amendement' | 'normaal'
  gekoppeldAanRv?: string  // rvNummer van het gekoppelde raadsvoorstel (voor moties/amendementen)
  stemlijstKey?: string    // unieke key voor stemlijst opslag (UUID, nooit veranderend)
}

export interface Agendapunt {
  id: number
  titel: string
  toelichting?: string
  url?: string
  subpunten: Subpunt[]
  apiType?: 'raadsmededelingen' | 'vragen'
  // Punt type voor speciale weergave
  puntType?: 'algemeen' | 'politieke_avond' | 'raadsvergadering'
  // Raadsvergadering datum
  rvDatum?: string
}

export interface ActieItem {
  id: string
  naam: string
  actie: string
  afgedaan: boolean
  datum: string
  deadline?: string
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
  notulen?: string
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
