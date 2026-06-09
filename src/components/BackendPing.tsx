'use client'

import { useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://datascraperraad.onrender.com'

export default function BackendPing() {
  useEffect(() => {
    // Ping 1: wakker maken + documenten ophalen
    fetch(`${API_URL}/documenten/per-type`).catch(() => {})

    // Ping 2: nieuws ophalen (GET, niet sync - gewoon bestaande artikelen laden)
    fetch(`${API_URL}/nieuws`).catch(() => {})

    // Ping 3: na 5 seconden nieuws sync starten op achtergrond
    const timer = setTimeout(() => {
      fetch(`${API_URL}/sync/nieuws`, { method: 'POST' }).catch(() => {})
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  return null
}
