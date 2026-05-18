'use client'

// Toegangspoort is nu een pass-through component
// Auth wordt afgehandeld door middleware + /api/login
// Naam helpers blijven hier voor backwards compatibility

const NAAM_SLEUTEL = 'gdp_spreker_naam'

export function getSprekerNaam(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(NAAM_SLEUTEL) || ''
}

export function setSprekerNaam(naam: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(NAAM_SLEUTEL, naam)
}

// Wrapper component - middleware doet nu de echte bescherming
export default function Toegangspoort({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
