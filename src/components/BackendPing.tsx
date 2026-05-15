'use client'

import { useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://datascraperraad.onrender.com'

export default function BackendPing() {
  useEffect(() => {
    // Stille ping om de backend wakker te maken - geen UI, geen wachten
    fetch(`${API_URL}/documenten/per-type`).catch(() => {})
  }, [])
  return null
}
