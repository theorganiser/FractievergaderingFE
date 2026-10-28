// Alle datum- en tijdberekeningen in Nederlandse tijd (Europe/Amsterdam), ongeacht waar de
// code draait: de Vercel-server staat op UTC en een telefoon kan in het buitenland zijn.
// Datums zonder tijd zijn overal 'YYYY-MM-DD'-strings; die rekenen we puur als kalenderdatum
// (via UTC 12:00), zodat zomer-/wintertijd er nooit een dag naast kan zitten.

export const TIJDZONE = 'Europe/Amsterdam'

const isoDatumFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIJDZONE, year: 'numeric', month: '2-digit', day: '2-digit',
})

/** Kalenderdatum (YYYY-MM-DD) van een moment, zoals die in Nederland geldt. */
export function datumInNL(moment: Date = new Date()): string {
  return isoDatumFormat.format(moment)
}

/** Vandaag in Nederland, als YYYY-MM-DD. */
export function vandaagNL(): string {
  return datumInNL(new Date())
}

function naarUtcMiddag(datum: string): Date {
  const [j, m, d] = datum.split('-').map(Number)
  return new Date(Date.UTC(j, m - 1, d, 12))
}

function utcNaarDatum(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Telt dagen op bij een YYYY-MM-DD-datum (negatief mag). */
export function plusDagen(datum: string, dagen: number): string {
  const d = naarUtcMiddag(datum)
  d.setUTCDate(d.getUTCDate() + dagen)
  return utcNaarDatum(d)
}

/** Telt maanden op; valt de dag niet in de doelmaand (31 maart − 1 maand) dan de laatste dag. */
export function plusMaanden(datum: string, maanden: number): string {
  const [j, m, d] = datum.split('-').map(Number)
  const doel = new Date(Date.UTC(j, m - 1 + maanden, 1, 12))
  const laatsteDag = new Date(Date.UTC(doel.getUTCFullYear(), doel.getUTCMonth() + 1, 0, 12)).getUTCDate()
  doel.setUTCDate(Math.min(d, laatsteDag))
  return utcNaarDatum(doel)
}

/** Dag van de week (0 = zondag) van een YYYY-MM-DD-datum. */
export function weekdag(datum: string): number {
  return naarUtcMiddag(datum).getUTCDay()
}

/** Huidig jaar in Nederland. */
export function jaarNL(): number {
  return Number(vandaagNL().slice(0, 4))
}

/** Datum van een tijdstip (ISO-timestamp) in NL-notatie, bijv. 25-10-2026. */
export function formatTijdstipDatum(iso: string, opties: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('nl-NL', { ...opties, timeZone: TIJDZONE })
}

/** Kloktijd van een tijdstip (ISO-timestamp) in Nederlandse tijd, bijv. 20:15. */
export function formatTijdstipTijd(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: TIJDZONE })
}

/** Een YYYY-MM-DD-datum opmaken (geen tijdzoneverschuiving mogelijk). */
export function formatKalenderdatum(datum: string, opties: Intl.DateTimeFormatOptions): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(datum || '')) return datum || ''
  return naarUtcMiddag(datum.slice(0, 10)).toLocaleDateString('nl-NL', { ...opties, timeZone: 'UTC' })
}
