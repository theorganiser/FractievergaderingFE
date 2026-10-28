import type { Subpunt } from './types'

// Importeren van de raadsagenda (uit de PDF of geplakte tekst) in het raadsvergaderingpunt,
// plus moties/amendementen die automatisch onder het juiste voorstel worden gehangen.
// De AI-extractie zit in /api/agenda-import; hier staat alleen de deterministische logica.

export type AgendaSoort = 'hamerstuk' | 'besluitvormend' | 'oordeelvormend' | 'informerend' | 'overig'

/** Eén agendapunt zoals de extractie het teruggeeft. */
export interface GeimporteerdPunt {
  nummer: string   // "3a", "5", "6a"
  titel: string    // zonder zaaknummer en zonder tekens als *, # en ∞
  soort: AgendaSoort
}

/** Antwoord van /api/agenda-import. */
export interface AgendaImportAntwoord {
  datum: string        // YYYY-MM-DD of ''
  agendaUrl: string
  punten: GeimporteerdPunt[]
  koppelingen: { motie: string; agendapunt: string }[]
}

/** Eén motie/amendement uit de documentenlijst, met het voorgestelde agendapunt. */
export interface MotieVoorstel {
  nummer: string        // "M26-91" of "A26-12"
  titel: string         // zonder het nummer ervoor
  url: string
  gekoppeldAanRv: string // agendanummer, of '' = los
}

/** Regel in het voorbeeldscherm: wat de gebruiker aan- of uitvinkt voordat er iets wordt overgenomen. */
export interface ImportRegel extends GeimporteerdPunt {
  meenemen: boolean
  inStemlijst: boolean
}

export interface MotieRegel extends MotieVoorstel {
  meenemen: boolean
}

const schoonNr = (t: string | undefined) => (t || '').trim().toLocaleLowerCase('nl')

/**
 * Over besluitvormende punten en hamerstukken wordt gestemd, maar alleen over de echte voorstellen
 * (3a, 6a ...), niet over kopjes als "5 Besluitvormend" of over "1 Opening".
 */
export function stelStemlijstVoor(punt: GeimporteerdPunt): boolean {
  const isSubpunt = /^\d+[a-z]\d*$/i.test(punt.nummer.trim())
  return isSubpunt && (punt.soort === 'besluitvormend' || punt.soort === 'hamerstuk')
}

/** "M26-91 Motie D66 - Geen sluiting ..." → { nummer: "M26-91", titel: "Motie D66 - Geen sluiting ..." } */
export function splitsMotieTitel(titel: string): { nummer: string; titel: string } {
  const m = titel.trim().match(/^([MA]\d{2}-\d+)\s+(.*)$/)
  return m ? { nummer: m[1], titel: m[2].trim() } : { nummer: '', titel: titel.trim() }
}

const isNormaal = (s: Subpunt) => !s.subtype || s.subtype === 'normaal'

export interface ImportResultaat {
  subpunten: Subpunt[]
  nieuw: number
  bijgewerkt: number
}

/**
 * Voegt de import samen met de bestaande punten van het raadsvergaderingpunt.
 * - Bestaande punten worden op nummer herkend; titel en (bij nieuwe) stemlijst komen uit de import,
 *   woordvoerder, notities, bijlagen en stemlijstKey blijven staan.
 * - Moties komen direct onder het voorstel waaraan ze gekoppeld zijn. De koppeling komt uit het
 *   voorbeeldscherm; dat vult voor moties die al op de agenda staan de bestaande koppeling in.
 * - Punten die niet (meer) in de import staan, blijven staan, achteraan.
 */
export function voegAgendaImportSamen(
  bestaand: Subpunt[],
  punten: ImportRegel[],
  moties: MotieRegel[],
  nieuweKey: () => string,
): ImportResultaat {
  let nieuw = 0
  let bijgewerkt = 0
  const gebruikt = new Set<Subpunt>()

  const vindNormaal = (nr: string) => bestaand.find(s => isNormaal(s) && !gebruikt.has(s) && schoonNr(s.rvNummer) === schoonNr(nr))
  const vindMotie = (nr: string) => bestaand.find(s => !isNormaal(s) && !gebruikt.has(s) && schoonNr(s.rvNummer) === schoonNr(nr))

  // Moties eerst omzetten, zodat we per agendapunt weten welke eronder horen
  const motieSubs: Subpunt[] = []
  for (const m of moties.filter(m => m.meenemen)) {
    const oud = vindMotie(m.nummer)
    if (oud) {
      gebruikt.add(oud)
      const sub: Subpunt = { ...oud, titel: m.titel, url: m.url || oud.url, gekoppeldAanRv: m.gekoppeldAanRv }
      if (sub.titel !== oud.titel || sub.url !== oud.url || sub.gekoppeldAanRv !== oud.gekoppeldAanRv) bijgewerkt++
      motieSubs.push(sub)
    } else {
      nieuw++
      motieSubs.push({
        id: m.nummer, titel: m.titel, rvNummer: m.nummer, url: m.url, inStemlijst: true,
        subtype: m.nummer.toUpperCase().startsWith('A') ? 'amendement' : 'motie',
        gekoppeldAanRv: m.gekoppeldAanRv, stemlijstKey: nieuweKey(),
      })
    }
  }
  // Moties die al op de agenda stonden maar niet in deze import zitten, ook bij hun voorstel houden
  for (const s of bestaand) {
    if (!isNormaal(s) && !gebruikt.has(s)) { gebruikt.add(s); motieSubs.push(s) }
  }

  const uit: Subpunt[] = []
  const geplaatst = new Set<Subpunt>()
  const plaatsMotiesVan = (rvNummer: string | undefined) => {
    if (!rvNummer) return
    for (const m of motieSubs) {
      if (!geplaatst.has(m) && schoonNr(m.gekoppeldAanRv) === schoonNr(rvNummer)) { uit.push(m); geplaatst.add(m) }
    }
  }

  for (const p of punten.filter(p => p.meenemen)) {
    const oud = vindNormaal(p.nummer)
    if (oud) {
      gebruikt.add(oud)
      if (oud.titel !== p.titel) bijgewerkt++
      uit.push({ ...oud, titel: p.titel })
    } else {
      nieuw++
      uit.push({ id: p.nummer, titel: p.titel, rvNummer: p.nummer, inStemlijst: p.inStemlijst, subtype: 'normaal', url: '', stemlijstKey: nieuweKey() })
    }
    plaatsMotiesVan(p.nummer)
  }

  // Bestaande punten die niet in de import stonden, met hun eigen moties
  for (const s of bestaand) {
    if (isNormaal(s) && !gebruikt.has(s)) { uit.push(s); plaatsMotiesVan(s.rvNummer) }
  }
  // Losse moties (niet gekoppeld, of gekoppeld aan een nummer dat niet bestaat) onderaan
  for (const m of motieSubs) if (!geplaatst.has(m)) uit.push(m)

  return { subpunten: uit, nieuw, bijgewerkt }
}
