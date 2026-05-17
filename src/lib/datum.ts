const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
const MAANDEN_KORT: Record<string, number> = {
  'jan': 0, 'feb': 1, 'mrt': 2, 'maa': 2, 'mar': 2,
  'apr': 3, 'mei': 4, 'jun': 5, 'jul': 6,
  'aug': 7, 'sep': 8, 'okt': 9, 'oct': 9,
  'nov': 10, 'dec': 11,
}

export function formatDatum(datum: string): string {
  if (!datum) return ''
  const dt = parseDatum(datum)
  if (!dt) return datum
  return `${DAGEN[dt.getDay()]} ${dt.getDate()} ${MAANDEN[dt.getMonth()]} ${dt.getFullYear()}`
}

export function formatDatumKort(datum: string): string {
  if (!datum) return ''
  const dt = parseDatum(datum)
  if (!dt) return datum
  return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Parst zowel ISO datums ("2026-04-21") als Nederlandse tekst ("16 mrt. 2026")
 */
export function parseDatum(datum: string): Date | null {
  if (!datum) return null

  // ISO formaat: 2026-04-21
  if (/^\d{4}-\d{2}-\d{2}/.test(datum)) {
    const d = new Date(datum + 'T12:00:00')
    return isNaN(d.getTime()) ? null : d
  }

  // Nederlands formaat: "16 mrt. 2026" of "16 maart 2026"
  const nlMatch = datum.match(/^(\d{1,2})\s+([a-zA-Zë\.]+)\.?\s+(\d{4})/)
  if (nlMatch) {
    const dag = parseInt(nlMatch[1])
    const maandStr = nlMatch[2].toLowerCase().replace('.', '').substring(0, 3)
    const jaar = parseInt(nlMatch[3])
    const maand = MAANDEN_KORT[maandStr]
    if (maand !== undefined) {
      const d = new Date(jaar, maand, dag, 12, 0, 0)
      return isNaN(d.getTime()) ? null : d
    }
  }

  // Probeer native parse als fallback
  const d = new Date(datum)
  return isNaN(d.getTime()) ? null : d
}

export function vandaag(): string {
  return new Date().toISOString().split('T')[0]
}

export function sorteerOpDatum(a: { datum: string }, b: { datum: string }): number {
  return (b.datum || '').localeCompare(a.datum || '')
}

export function eersteVolgendeMaandag(): string {
  const nu = new Date()
  const dag = nu.getDay()
  const dagenTotMaandag = dag === 1 ? 7 : (8 - dag) % 7 || 7
  const maandag = new Date(nu)
  maandag.setDate(nu.getDate() + dagenTotMaandag)
  return maandag.toISOString().split('T')[0]
}

export function formatDatumNL(datum: string): string {
  if (!datum) return ''
  const d = parseDatum(datum)
  if (!d) return datum
  const dag = String(d.getDate()).padStart(2, '0')
  const maand = String(d.getMonth() + 1).padStart(2, '0')
  const jaar = d.getFullYear()
  return `${dag}-${maand}-${jaar}`
}
