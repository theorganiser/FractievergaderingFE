'use client'

import { useState, useEffect, useCallback } from 'react'
import { Vergadering, Agendapunt, Subpunt } from '@/lib/types'
import {
  laadVergaderingen as dbLaad,
  laadVergaderingOpToken as dbLaadOpToken,
  slaVergaderingOp,
  verwijderVergaderingDb,
  nieuweId,
  nieuwToken,
} from '@/lib/storage'
import { TEMPLATE_PUNTEN } from '@/lib/template'

export function useVergaderingen() {
  const [vergaderingen, setVergaderingen] = useState<Vergadering[]>([])
  const [geladen, setGeladen] = useState(false)
  const [opslaan, setOpslaan] = useState(false)

  // Laad alle vergaderingen bij mount
  useEffect(() => {
    dbLaad().then(data => {
      setVergaderingen(data)
      setGeladen(true)
    })
  }, [])

  // Helper: sla op in Supabase en update lokale state
  const slaOp = useCallback(async (vergadering: Vergadering) => {
    setOpslaan(true)
    await slaVergaderingOp(vergadering)
    setVergaderingen(huidig =>
      huidig.some(v => v.id === vergadering.id)
        ? huidig.map(v => v.id === vergadering.id ? vergadering : v)
        : [vergadering, ...huidig]
    )
    setOpslaan(false)
  }, [])

  const maakNieuwe = useCallback(async (vanTemplate: boolean): Promise<Vergadering> => {
    const v: Vergadering = {
      id: nieuweId(),
      titel: 'Nieuwe vergadering',
      datum: '',
      aanvang: '20:00',
      locatie: 'gemeentehuis',
      aanwezig: '',
      online: '',
      afwezig: '',
      punten: vanTemplate ? JSON.parse(JSON.stringify(TEMPLATE_PUNTEN)) : [],
      deeltoken: nieuwToken(),
      aangemaakt: new Date().toISOString(),
      bijgewerkt: new Date().toISOString(),
    }
    await slaOp(v)
    return v
  }, [slaOp])

  const kopieer = useCallback(async (id: string): Promise<Vergadering | null> => {
    const orig = vergaderingen.find(v => v.id === id)
    if (!orig) return null
    const kop: Vergadering = {
      ...JSON.parse(JSON.stringify(orig)),
      id: nieuweId(),
      titel: 'Kopie van ' + orig.titel,
      datum: '',
      deeltoken: nieuwToken(),
      aangemaakt: new Date().toISOString(),
      bijgewerkt: new Date().toISOString(),
    }
    await slaOp(kop)
    return kop
  }, [vergaderingen, slaOp])

  const verwijder = useCallback(async (id: string) => {
    await verwijderVergaderingDb(id)
    setVergaderingen(huidig => huidig.filter(v => v.id !== id))
  }, [])

  const update = useCallback(async (id: string, wijzigingen: Partial<Vergadering>) => {
    const v = vergaderingen.find(x => x.id === id)
    if (!v) return
    const bijgewerkt = { ...v, ...wijzigingen, bijgewerkt: new Date().toISOString() }
    await slaOp(bijgewerkt)
  }, [vergaderingen, slaOp])

  const updatePunten = useCallback(async (id: string, punten: Agendapunt[]) => {
    await update(id, { punten })
  }, [update])

  const voegPuntToe = useCallback(async (vergaderingId: string) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuwPunt: Agendapunt = {
      id: v.punten.length + 1,
      titel: 'Nieuw agendapunt',
      toelichting: '',
      subpunten: [],
    }
    await updatePunten(vergaderingId, [...v.punten, nieuwPunt])
  }, [vergaderingen, updatePunten])

  const verwijderPunt = useCallback(async (vergaderingId: string, puntIndex: number) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuw = v.punten.filter((_, i) => i !== puntIndex)
    nieuw.forEach((p, i) => { p.id = i + 1 })
    await updatePunten(vergaderingId, nieuw)
  }, [vergaderingen, updatePunten])

  const updatePunt = useCallback(async (
    vergaderingId: string,
    puntIndex: number,
    wijzigingen: Partial<Agendapunt>
  ) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuw = v.punten.map((p, i) =>
      i === puntIndex ? { ...p, ...wijzigingen } : p
    )
    await updatePunten(vergaderingId, nieuw)
  }, [vergaderingen, updatePunten])

  const voegSubpuntToe = useCallback(async (vergaderingId: string, puntIndex: number) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const punt = v.punten[puntIndex]
    const nieuwSubpunt: Subpunt = {
      id: String.fromCharCode(97 + punt.subpunten.length),
      titel: '',
      url: '',
      afgedaan: false,
    }
    await updatePunt(vergaderingId, puntIndex, {
      subpunten: [...punt.subpunten, nieuwSubpunt],
    })
  }, [vergaderingen, updatePunt])

  const verwijderSubpunt = useCallback(async (
    vergaderingId: string,
    puntIndex: number,
    subIndex: number
  ) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuweSubs = v.punten[puntIndex].subpunten.filter((_, i) => i !== subIndex)
    nieuweSubs.forEach((s, i) => { s.id = String.fromCharCode(97 + i) })
    await updatePunt(vergaderingId, puntIndex, { subpunten: nieuweSubs })
  }, [vergaderingen, updatePunt])

  const updateSubpunt = useCallback(async (
    vergaderingId: string,
    puntIndex: number,
    subIndex: number,
    wijzigingen: Partial<Subpunt>
  ) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuweSubs = v.punten[puntIndex].subpunten.map((s, i) =>
      i === subIndex ? { ...s, ...wijzigingen } : s
    )
    await updatePunt(vergaderingId, puntIndex, { subpunten: nieuweSubs })
  }, [vergaderingen, updatePunt])

  const vindOpToken = useCallback((token: string): Vergadering | undefined => {
    return vergaderingen.find(v => v.deeltoken === token)
  }, [vergaderingen])

  return {
    vergaderingen,
    geladen,
    opslaan,
    maakNieuwe,
    kopieer,
    verwijder,
    update,
    updatePunten,
    voegPuntToe,
    verwijderPunt,
    updatePunt,
    voegSubpuntToe,
    verwijderSubpunt,
    updateSubpunt,
    vindOpToken,
  }
}

// Aparte hook voor de leespagina: laad één vergadering op token
export function useVergaderingOpToken(token: string) {
  const [vergadering, setVergadering] = useState<Vergadering | null>(null)
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    if (!token) return
    dbLaadOpToken(token).then(data => {
      setVergadering(data)
      setGeladen(true)
    })
  }, [token])

  return { vergadering, geladen }
}
