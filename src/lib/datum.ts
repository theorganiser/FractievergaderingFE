const DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const MAANDEN = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
]

export function formatDatum(datum: string): string {
  if (!datum) return ''
  const dt = new Date(datum + 'T12:00:00')
  return `${DAGEN[dt.getDay()]} ${dt.getDate()} ${MAANDEN[dt.getMonth()]} ${dt.getFullYear()}`
}

export function vandaag(): string {
  return new Date().toISOString().split('T')[0]
}

export function sorteerOpDatum(a: { datum: string }, b: { datum: string }): number {
  return (b.datum || '').localeCompare(a.datum || '')
}
