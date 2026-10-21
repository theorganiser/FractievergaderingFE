// Alleen deze kolommen mag de browser schrijven (id en tijdstempels zet de database zelf)
const VELDEN = ['datum', 'starttijd', 'omschrijving', 'locatie', 'personen', 'categorie'] as const

export function kalenderVelden(body: Record<string, unknown>): Record<string, unknown> {
  const uit: Record<string, unknown> = {}
  for (const veld of VELDEN) if (veld in body) uit[veld] = body[veld]
  return uit
}
