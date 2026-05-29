'use client'

const NAAM_SLEUTEL = 'gdp_spreker_naam'

export function getSprekerNaam(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(NAAM_SLEUTEL) || ''
}

export function setSprekerNaam(naam: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(NAAM_SLEUTEL, naam)
}

export default function Toegangspoort({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
