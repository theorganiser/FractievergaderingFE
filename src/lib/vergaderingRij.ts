import { Vergadering } from './types'

// Omzetting tussen de database-rij (snake_case) en het Vergadering-object in de app.
// vergaderingNaarRij is ook de whitelist van kolommen die de API laat schrijven.

export function rijNaarVergadering(rij: Record<string, unknown>): Vergadering {
  return {
    id: rij.id as string,
    titel: rij.titel as string,
    versie: (rij.versie as number) || 1,
    datum: (rij.datum as string) || '',
    aanvang: (rij.aanvang as string) || '20:00',
    locatie: (rij.locatie as string) || '',
    aanwezig: (rij.aanwezig as string) || '',
    online: (rij.online as string) || '',
    afwezig: (rij.afwezig as string) || '',
    punten: (rij.punten as Vergadering['punten']) || [],
    actielijst: (rij.actielijst as Vergadering['actielijst']) || [],
    kalender: (rij.kalender as Vergadering['kalender']) || [],
    heeftPolitiekeAvond: (rij.heeft_politieke_avond as boolean) || false,
    politiekeAvondDatum: (rij.politieke_avond_datum as string) || '',
    politiekeAvondUrl: (rij.politieke_avond_url as string) || '',
    heeftRaadsvergadering: (rij.heeft_raadsvergadering as boolean) || false,
    raadsvergaderingDatum: (rij.raadsvergadering_datum as string) || '',
    raadsvergaderingUrl: (rij.raadsvergadering_url as string) || '',
    deeltoken: rij.deeltoken as string,
    aangemaakt: rij.aangemaakt as string,
    bijgewerkt: rij.bijgewerkt as string,
    notulen: (rij.notulen as string) || '',
  }
}

export function vergaderingNaarRij(v: Vergadering): Record<string, unknown> {
  return {
    id: v.id,
    titel: v.titel,
    versie: v.versie,
    datum: v.datum,
    aanvang: v.aanvang,
    locatie: v.locatie,
    aanwezig: v.aanwezig,
    online: v.online,
    afwezig: v.afwezig,
    punten: v.punten,
    actielijst: v.actielijst,
    kalender: v.kalender,
    heeft_politieke_avond: v.heeftPolitiekeAvond,
    politieke_avond_datum: v.politiekeAvondDatum,
    politieke_avond_url: v.politiekeAvondUrl,
    heeft_raadsvergadering: v.heeftRaadsvergadering,
    raadsvergadering_datum: v.raadsvergaderingDatum,
    raadsvergadering_url: v.raadsvergaderingUrl,
    deeltoken: v.deeltoken,
    aangemaakt: v.aangemaakt,
    notulen: v.notulen || '',
  }
}
