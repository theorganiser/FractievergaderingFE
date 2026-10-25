// Aanwezigheid staat in drie komma-gescheiden kolommen (aanwezig / online / afwezig).
// Deze functies veranderen altijd maar één naam, zodat antwoorden van anderen nooit
// verloren gaan — ook niet van namen die (nog) niet in de ledenlijst staan, zoals gasten.

export type AanwezigheidStatus = 'aanwezig' | 'online' | 'afwezig'
export const STATUSSEN: AanwezigheidStatus[] = ['aanwezig', 'online', 'afwezig']

export interface AanwezigheidLijsten {
  aanwezig: string
  online: string
  afwezig: string
}

export function parseNamen(str: string | null | undefined): string[] {
  return (str || '').split(',').map(n => n.trim()).filter(Boolean)
}

// Namen vergelijken zonder hoofdletters en spaties, zodat "vera " en "Vera" dezelfde persoon zijn.
export function zelfdeNaam(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('nl') === b.trim().toLocaleLowerCase('nl')
}

export function statusVan(lijsten: AanwezigheidLijsten, naam: string): AanwezigheidStatus | null {
  for (const s of STATUSSEN) {
    if (parseNamen(lijsten[s]).some(n => zelfdeNaam(n, naam))) return s
  }
  return null
}

/**
 * Zet de status van één persoon. status null = helemaal weghalen (bijv. een gast verwijderen).
 * Alle andere namen en hun volgorde blijven ongemoeid.
 */
export function zetStatus(lijsten: AanwezigheidLijsten, naam: string, status: AanwezigheidStatus | null): AanwezigheidLijsten {
  const schoon = naam.trim()
  const uit = {} as AanwezigheidLijsten
  for (const s of STATUSSEN) {
    const namen = parseNamen(lijsten[s]).filter(n => !zelfdeNaam(n, schoon))
    if (s === status) namen.push(schoon)
    uit[s] = namen.join(', ')
  }
  return uit
}

/** Alle namen die in een van de drie lijsten voorkomen. */
export function alleGenoemdeNamen(lijsten: AanwezigheidLijsten): string[] {
  const uit: string[] = []
  for (const s of STATUSSEN) {
    for (const n of parseNamen(lijsten[s])) if (!uit.some(x => zelfdeNaam(x, n))) uit.push(n)
  }
  return uit
}
