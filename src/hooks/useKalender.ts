'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CentraalKalenderItem,
  haalKalenderItems,
  voegKalenderItemToe,
  updateKalenderItem,
  verwijderKalenderItem,
} from '@/lib/kalender'
import { eersteVolgendeMaandag } from '@/lib/datum'

export function useKalender(alleenToekomst = false) {
  const [items, setItems] = useState<CentraalKalenderItem[]>([])
  const [geladen, setGeladen] = useState(false)
  const [bezig, setBezig] = useState(false)

  const laad = useCallback(() => {
    setGeladen(false)
    haalKalenderItems(alleenToekomst)
      .then(data => { setItems(data); setGeladen(true) })
      .catch(() => setGeladen(true))
  }, [alleenToekomst])

  useEffect(() => { laad() }, [laad])

  const voegToe = useCallback(async (
    item: Omit<CentraalKalenderItem, 'id' | 'aangemaakt_op' | 'bijgewerkt_op'>
  ) => {
    setBezig(true)
    const nieuw = await voegKalenderItemToe(item)
    if (nieuw) setItems(prev => [...prev, nieuw].sort((a, b) => a.datum.localeCompare(b.datum)))
    setBezig(false)
    return nieuw
  }, [])

  const update = useCallback(async (id: string, wijzigingen: Partial<CentraalKalenderItem>) => {
    setBezig(true)
    const ok = await updateKalenderItem(id, wijzigingen)
    if (ok) setItems(prev => prev.map(i => i.id === id ? { ...i, ...wijzigingen } : i))
    setBezig(false)
  }, [])

  const verwijder = useCallback(async (id: string) => {
    setBezig(true)
    const ok = await verwijderKalenderItem(id)
    if (ok) setItems(prev => prev.filter(i => i.id !== id))
    setBezig(false)
  }, [])

  // Standaard leeg item voor nieuw formulier
  const nieuwItem = (): Omit<CentraalKalenderItem, 'id' | 'aangemaakt_op' | 'bijgewerkt_op'> => ({
    datum: eersteVolgendeMaandag(),
    starttijd: '',
    omschrijving: '',
    locatie: '',
    personen: '',
  })

  return { items, geladen, bezig, laad, voegToe, update, verwijder, nieuwItem }
}
