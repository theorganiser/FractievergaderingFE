'use client'

import { useState, useEffect, useCallback } from 'react'
import { Vergadering, Agendapunt, Subpunt } from '@/lib/types'
import { laadVergaderingen, slaVergaderingenOp, nieuweId, nieuwToken } from '@/lib/storage'
import { TEMPLATE_PUNTEN } from '@/lib/template'

export function useVergaderingen() {
  const [vergaderingen, setVergaderingen] = useState<Vergadering[]>([])
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    setVergaderingen(laadVergaderingen())
    setGeladen(true)
  }, [])

  const sla = useCallback((nieuw: Vergadering[]) => {
    setVergaderingen(nieuw)
    slaVergaderingenOp(nieuw)
  }, [])

  const maakNieuwe = useCallback((vanTemplate: boolean): Vergadering => {
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
    sla([v, ...vergaderingen])
    return v
  }, [vergaderingen, sla])

  const kopieer = useCallback((id: string): Vergadering | null => {
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
    sla([kop, ...vergaderingen])
    return kop
  }, [vergaderingen, sla])

  const verwijder = useCallback((id: string) => {
    sla(vergaderingen.filter(v => v.id !== id))
  }, [vergaderingen, sla])

  const update = useCallback((id: string, wijzigingen: Partial<Vergadering>) => {
    sla(vergaderingen.map(v =>
      v.id === id ? { ...v, ...wijzigingen, bijgewerkt: new Date().toISOString() } : v
    ))
  }, [vergaderingen, sla])

  const updatePunten = useCallback((id: string, punten: Agendapunt[]) => {
    update(id, { punten })
  }, [update])

  const voegPuntToe = useCallback((vergaderingId: string) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuwPunt: Agendapunt = {
      id: v.punten.length + 1,
      titel: 'Nieuw agendapunt',
      toelichting: '',
      subpunten: [],
    }
    updatePunten(vergaderingId, [...v.punten, nieuwPunt])
  }, [vergaderingen, updatePunten])

  const verwijderPunt = useCallback((vergaderingId: string, puntIndex: number) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuw = v.punten.filter((_, i) => i !== puntIndex)
    nieuw.forEach((p, i) => { p.id = i + 1 })
    updatePunten(vergaderingId, nieuw)
  }, [vergaderingen, updatePunten])

  const updatePunt = useCallback((
    vergaderingId: string,
    puntIndex: number,
    wijzigingen: Partial<Agendapunt>
  ) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuw = v.punten.map((p, i) =>
      i === puntIndex ? { ...p, ...wijzigingen } : p
    )
    updatePunten(vergaderingId, nieuw)
  }, [vergaderingen, updatePunten])

  const voegSubpuntToe = useCallback((vergaderingId: string, puntIndex: number) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const punt = v.punten[puntIndex]
    const nieuwSubpunt: Subpunt = {
      id: String.fromCharCode(97 + punt.subpunten.length),
      titel: '',
      url: '',
      afgedaan: false,
    }
    updatePunt(vergaderingId, puntIndex, {
      subpunten: [...punt.subpunten, nieuwSubpunt],
    })
  }, [vergaderingen, updatePunt])

  const verwijderSubpunt = useCallback((
    vergaderingId: string,
    puntIndex: number,
    subIndex: number
  ) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuweSubs = v.punten[puntIndex].subpunten.filter((_, i) => i !== subIndex)
    nieuweSubs.forEach((s, i) => { s.id = String.fromCharCode(97 + i) })
    updatePunt(vergaderingId, puntIndex, { subpunten: nieuweSubs })
  }, [vergaderingen, updatePunt])

  const updateSubpunt = useCallback((
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
    updatePunt(vergaderingId, puntIndex, { subpunten: nieuweSubs })
  }, [vergaderingen, updatePunt])

  const vindOpToken = useCallback((token: string): Vergadering | undefined => {
    return vergaderingen.find(v => v.deeltoken === token)
  }, [vergaderingen])

  return {
    vergaderingen,
    geladen,
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
