import type { Agendapunt, Subpunt, Vergadering } from './types'
import { vergaderingNaarRij } from './vergaderingRij'

// Wat mag een gewoon fractielid (geen moderator/beheerder) aan een vergadering veranderen?
//
// Toegestaan, zoals de leesweergave en het notulenscherm dat doen:
// - notulen
// - notities en bijlagen, bij elk punt en subpunt
// - eigen subpunten (auteur gezet) en bespreek-kopieën onder "Te bespreken"
// - bespreek-markeringen (bespreekKey/bespreekDoor) en de titel van een subpunt met zo'n markering
//   (wijzigEigenPunt past de titel aan beide kanten aan)
// - een leeg punt "Te bespreken" aanmaken
// - nummering (id's) en vaste sleutels (uid's)
//
// Al het andere (agenda-structuur, titels, volgorde, links, tijdsblokken, datum, deellink,
// versie/publicatie, actielijst, kalender, aanwezigheid) is van de editor. Aanwezigheid loopt
// via een eigen route.

// Kolommen die een fractielid via deze route nooit mag veranderen
const VASTE_KOLOMMEN = [
  'id', 'titel', 'versie', 'datum', 'aanvang', 'locatie', 'aanwezig', 'online', 'afwezig',
  'actielijst', 'kalender', 'heeft_politieke_avond', 'politieke_avond_datum', 'politieke_avond_url',
  'heeft_raadsvergadering', 'raadsvergadering_datum', 'raadsvergadering_url', 'deeltoken', 'aangemaakt',
] as const

const isVanFractielid = (s: Subpunt) => !!s.auteur || !!s.bespreekKopie
const isTeBespreken = (p: Agendapunt) => p.soort !== 'informeer' && (p.titel || '').toLowerCase().includes('te bespreken')

type EditorSub = Record<string, unknown> & { titel?: string; _bespreek: boolean }
type EditorPunt = Record<string, unknown> & { subpunten: EditorSub[] }

// Alleen het deel van de agenda dat van de editor is
function editorDeel(punten: Agendapunt[]): EditorPunt[] {
  return (punten || [])
    .map(p => {
      const { id: _i, uid: _u, notities: _n, bijlagen: _b, subpunten, ...rest } = p
      void _i; void _u; void _n; void _b
      const subs = (subpunten || []).filter(s => !isVanFractielid(s)).map(s => {
        const { id: _si, uid: _su, notities: _sn, bijlagen: _sb, bespreekKey, bespreekDoor: _sd, ...srest } = s
        void _si; void _su; void _sn; void _sb; void _sd
        return { ...srest, _bespreek: !!bespreekKey } as EditorSub
      })
      return { ...rest, subpunten: subs } as EditorPunt
    })
    // Een (leeg) "Te bespreken"-punt mag een fractielid aanmaken via een bespreekverzoek
    .filter(p => !(isTeBespreken(p as unknown as Agendapunt) && p.subpunten.length === 0))
}

// Titel van een subpunt met een bespreekverzoek (aan één van beide kanten) mag mee veranderen
// via het eigen punt van het fractielid; de markering zelf telt niet mee.
function zonderVrijeTitels(a: EditorPunt[], b: EditorPunt[]): [unknown[], unknown[]] {
  const kaal = (s: EditorSub, vrij: boolean) => {
    const { _bespreek: _x, titel, ...rest } = s
    void _x
    return vrij ? rest : { ...rest, titel }
  }
  const pas = (lijst: EditorPunt[], ander: EditorPunt[]) => lijst.map((p, pi) => ({
    ...p,
    subpunten: p.subpunten.map((s, si) => kaal(s, s._bespreek || !!ander[pi]?.subpunten?.[si]?._bespreek)),
  }))
  return [pas(a, b), pas(b, a)]
}

// Vergelijkt inhoud, ongeacht de volgorde van sleutels (jsonb in de database sorteert die anders)
// en zonder onderscheid tussen een ontbrekend veld en undefined.
export function gelijk(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => gelijk(x, b[i]))
  }
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const sleutels = new Set([...Object.keys(ao), ...Object.keys(bo)])
  for (const k of sleutels) {
    if (ao[k] === undefined && bo[k] === undefined) continue
    if (!gelijk(ao[k], bo[k])) return false
  }
  return true
}

/**
 * Controleert of een fractielid van `oud` (de huidige versie in de database) naar `nieuw` mag.
 * Geeft null als het mag, anders een reden.
 */
export function fractielidWijzigingFout(oud: Vergadering, nieuw: Vergadering): string | null {
  const o = vergaderingNaarRij(oud)
  const n = vergaderingNaarRij(nieuw)
  for (const k of VASTE_KOLOMMEN) {
    if (!gelijk(o[k], n[k])) return `Alleen moderators en beheerders kunnen dit wijzigen (${k}).`
  }
  const [eo, en] = zonderVrijeTitels(editorDeel(oud.punten), editorDeel(nieuw.punten))
  if (!gelijk(eo, en)) {
    return 'Alleen moderators en beheerders kunnen de agenda zelf wijzigen.'
  }
  return null
}
