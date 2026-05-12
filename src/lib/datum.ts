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

export function eersteVolgendeMaandag(): string {
  const nu = new Date()
  const dag = nu.getDay() // 0=zo, 1=ma, ..., 6=za
  const dagenTotMaandag = dag === 1 ? 7 : (8 - dag) % 7 || 7
  const maandag = new Date(nu)
  maandag.setDate(nu.getDate() + dagenTotMaandag)
  return maandag.toISOString().split('T')[0]
}
