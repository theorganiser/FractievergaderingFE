'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Vergadering, Agendapunt, Subpunt, ActieItem, KalenderItem } from '@/lib/types'
import {
  laadVergaderingen as dbLaad,
  laadVergaderingOpToken as dbLaadOpToken,
  laadVergaderingOpId as dbLaadOpId,
  slaVergaderingOp,
  verwijderVergaderingDb,
  nieuweId,
  maakLeesbarToken,
  nieuwToken,
} from '@/lib/storage'
import { bouwPuntenMetOpties } from '@/lib/template'

export function useVergaderingen() {
  const [vergaderingen, setVergaderingen] = useState<Vergadering[]>([])
  const [geladen, setGeladen] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [supabaseFout, setSupabaseFout] = useState(false)
  const [opslaanFout, setOpslaanFout] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Wijzigingen die nog niet geschreven zijn, per vergadering-id opgeteld — zodat meerdere
  // snelle bewerkingen binnen hetzelfde debounce-venster niet verloren gaan.
  const pendingWijzigingen = useRef<Record<string, Partial<Vergadering>>>({})

  const laad = useCallback(() => {
    setSupabaseFout(false)
    setGeladen(false)
    dbLaad()
      .then(data => { setVergaderingen(data); setGeladen(true) })
      .catch(() => { setSupabaseFout(true); setGeladen(true) })
  }, [])

  useEffect(() => { laad() }, [laad])

  const slaOp = useCallback((id: string, wijzigingen: Partial<Vergadering>) => {
    // Optimistische lokale update voor directe UI-feedback
    setVergaderingen(huidig => huidig.map(v => v.id === id
      ? { ...v, ...wijzigingen, bijgewerkt: new Date().toISOString() }
      : v
    ))

    pendingWijzigingen.current[id] = { ...pendingWijzigingen.current[id], ...wijzigingen }

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    setOpslaan(true)
    setOpslaanFout(false)
    debounceTimer.current = setTimeout(async () => {
      const teSchrijven = pendingWijzigingen.current[id] || {}
      delete pendingWijzigingen.current[id]
      // Vers ophalen vlak voor het schrijven, zodat we niet een verouderde lokale
      // kopie van de hele vergadering terugschrijven en daarmee wijzigingen van een
      // ander fractielid (bijv. een notitie of notulen) overschrijven.
      const vers = await dbLaadOpId(id)
      if (!vers) { setOpslaan(false); setOpslaanFout(true); return }
      const bijgewerkt = { ...vers, ...teSchrijven, bijgewerkt: new Date().toISOString() }
      const ok = await slaVergaderingOp(bijgewerkt)
      setOpslaan(false)
      if (!ok) setOpslaanFout(true)
    }, 3000)
  }, [])

  const maakNieuwe = useCallback(async (opties: {
    vanTemplate: boolean
    vergaderingDatum?: string
    heeftPA: boolean; paDatum: string; paUrl: string
    heeftRV: boolean; rvDatum: string; rvUrl: string
  }): Promise<Vergadering> => {
    const datumStr = opties.vergaderingDatum || new Date().toISOString().split('T')[0]
    const [jaar, maand, dag] = datumStr.split('-')
    const datumNL = `${dag}-${maand}-${jaar}`
    const punten = opties.vanTemplate
      ? bouwPuntenMetOpties(opties.heeftPA, opties.paDatum, opties.paUrl, opties.heeftRV, opties.rvDatum, opties.rvUrl)
      : []
    const bestaandeTokens = vergaderingen.map(v => v.deeltoken)
    const v: Vergadering = {
      id: nieuweId(),
      titel: `Fractie Vergadering ${datumNL}`,
      versie: 1,
      datum: datumStr,
      aanvang: '20:00',
      locatie: 'Gemeentehuis van Eedenzaal',
      aanwezig: '', online: '', afwezig: '',
      punten,
      actielijst: [], kalender: [],
      heeftPolitiekeAvond: opties.heeftPA,
      politiekeAvondDatum: opties.paDatum,
      politiekeAvondUrl: opties.paUrl,
      heeftRaadsvergadering: opties.heeftRV,
      raadsvergaderingDatum: opties.rvDatum,
      raadsvergaderingUrl: opties.rvUrl,
      deeltoken: maakLeesbarToken(datumStr, bestaandeTokens),
      aangemaakt: new Date().toISOString(),
      bijgewerkt: new Date().toISOString(),
    }
    const ok = await slaVergaderingOp(v)
    if (!ok) setOpslaanFout(true)
    setVergaderingen(huidig => [v, ...huidig])
    return v
  }, [vergaderingen])

  const kopieer = useCallback(async (id: string): Promise<Vergadering | null> => {
    const orig = vergaderingen.find(v => v.id === id)
    if (!orig) return null
    const bestaandeTokens = vergaderingen.map(v => v.deeltoken)
    const kop: Vergadering = {
      ...JSON.parse(JSON.stringify(orig)),
      id: nieuweId(),
      titel: 'Kopie van ' + orig.titel,
      datum: '',
      versie: 1,
      deeltoken: nieuwToken(),
      aangemaakt: new Date().toISOString(),
      bijgewerkt: new Date().toISOString(),
    }
    if (orig.datum) kop.deeltoken = maakLeesbarToken('', bestaandeTokens)
    const ok = await slaVergaderingOp(kop)
    if (!ok) setOpslaanFout(true)
    setVergaderingen(huidig => [kop, ...huidig])
    return kop
  }, [vergaderingen])

  const verwijder = useCallback(async (id: string) => {
    const ok = await verwijderVergaderingDb(id)
    if (!ok) { setOpslaanFout(true); return }
    setVergaderingen(huidig => huidig.filter(v => v.id !== id))
  }, [])

  const update = useCallback(async (id: string, wijzigingen: Partial<Vergadering>) => {
    slaOp(id, wijzigingen)
  }, [slaOp])

  const updatePunten = useCallback(async (id: string, punten: Agendapunt[]) => {
    await update(id, { punten })
  }, [update])

  const herorden = useCallback(async (vergaderingId: string, nieuwePunten: Agendapunt[]) => {
    await update(vergaderingId, { punten: nieuwePunten })
  }, [update])

  const vernieuwToken = useCallback(async (vergaderingId: string): Promise<string | null> => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v || !v.datum) return null
    const bestaandeTokens = vergaderingen
      .filter(x => x.id !== vergaderingId)
      .map(x => x.deeltoken)
    const nieuwLeesbarToken = maakLeesbarToken(v.datum, bestaandeTokens)
    slaOp(vergaderingId, { deeltoken: nieuwLeesbarToken })
    return nieuwLeesbarToken
  }, [vergaderingen, slaOp])

  const voegPuntToe = useCallback(async (vergaderingId: string) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuwPunt: Agendapunt = {
      id: v.punten.length + 1, titel: 'Nieuw agendapunt', toelichting: '', subpunten: [],
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
    vergaderingId: string, puntIndex: number, wijzigingen: Partial<Agendapunt>
  ) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuw = v.punten.map((p, i) => i === puntIndex ? { ...p, ...wijzigingen } : p)
    await updatePunten(vergaderingId, nieuw)
  }, [vergaderingen, updatePunten])

  const voegSubpuntToe = useCallback(async (vergaderingId: string, puntIndex: number) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const punt = v.punten[puntIndex]
    const nieuwSub: Subpunt = {
      id: String.fromCharCode(97 + punt.subpunten.length), titel: '', url: '', afgedaan: false,
    }
    await updatePunt(vergaderingId, puntIndex, { subpunten: [...punt.subpunten, nieuwSub] })
  }, [vergaderingen, updatePunt])

  const verwijderSubpunt = useCallback(async (
    vergaderingId: string, puntIndex: number, subIndex: number
  ) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuweSubs = v.punten[puntIndex].subpunten.filter((_, i) => i !== subIndex)
    nieuweSubs.forEach((s, i) => { s.id = String.fromCharCode(97 + i) })
    await updatePunt(vergaderingId, puntIndex, { subpunten: nieuweSubs })
  }, [vergaderingen, updatePunt])

  const updateSubpunt = useCallback(async (
    vergaderingId: string, puntIndex: number, subIndex: number, wijzigingen: Partial<Subpunt>
  ) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuweSubs = v.punten[puntIndex].subpunten.map((s, i) =>
      i === subIndex ? { ...s, ...wijzigingen } : s
    )
    await updatePunt(vergaderingId, puntIndex, { subpunten: nieuweSubs })
  }, [vergaderingen, updatePunt])

  const voegActieToe = useCallback(async (
    vergaderingId: string, naam: string, actie: string, deadline?: string
  ) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuw: ActieItem = {
      id: Date.now().toString(), naam, actie, afgedaan: false,
      datum: v.datum || new Date().toISOString().split('T')[0],
      deadline: deadline || '',
    }
    await update(vergaderingId, { actielijst: [...(v.actielijst || []), nieuw] })
  }, [vergaderingen, update])

  const toggleActie = useCallback(async (vergaderingId: string, actieId: string) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuw = (v.actielijst || []).map(a => a.id === actieId ? { ...a, afgedaan: !a.afgedaan } : a)
    await update(vergaderingId, { actielijst: nieuw })
  }, [vergaderingen, update])

  const updateActie = useCallback(async (vergaderingId: string, actieId: string, wijzigingen: Partial<ActieItem>) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuw = (v.actielijst || []).map(a => a.id === actieId ? { ...a, ...wijzigingen } : a)
    await update(vergaderingId, { actielijst: nieuw })
  }, [vergaderingen, update])

  const verwijderActie = useCallback(async (vergaderingId: string, actieId: string) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    await update(vergaderingId, { actielijst: (v.actielijst || []).filter(a => a.id !== actieId) })
  }, [vergaderingen, update])

  const neemActiesOver = useCallback(async (naarId: string, vanId: string) => {
    const van = vergaderingen.find(x => x.id === vanId)
    const naar = vergaderingen.find(x => x.id === naarId)
    if (!van || !naar) return
    const openActies = (van.actielijst || []).filter(a => !a.afgedaan)
    await update(naarId, { actielijst: [...openActies, ...(naar.actielijst || [])] })
  }, [vergaderingen, update])

  const voegKalenderItemToe = useCallback(async (vergaderingId: string, item: Omit<KalenderItem, 'id'>) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuw: KalenderItem = { ...item, id: Date.now().toString() }
    await update(vergaderingId, { kalender: [...(v.kalender || []), nieuw] })
  }, [vergaderingen, update])

  const verwijderKalenderItem = useCallback(async (vergaderingId: string, itemId: string) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    await update(vergaderingId, { kalender: (v.kalender || []).filter(k => k.id !== itemId) })
  }, [vergaderingen, update])

  const updateKalenderItem = useCallback(async (
    vergaderingId: string, itemId: string, wijzigingen: Partial<KalenderItem>
  ) => {
    const v = vergaderingen.find(x => x.id === vergaderingId)
    if (!v) return
    const nieuw = (v.kalender || []).map(k => k.id === itemId ? { ...k, ...wijzigingen } : k)
    await update(vergaderingId, { kalender: nieuw })
  }, [vergaderingen, update])

  const vindOpToken = useCallback((token: string) => {
    return vergaderingen.find(v => v.deeltoken === token)
  }, [vergaderingen])

  const publiceer = useCallback(async (vergaderingId: string): Promise<number> => {
    // Vers ophalen vlak voor het schrijven — anders zou publiceren op basis van een
    // verouderde lokale kopie recente wijzigingen van iemand anders kunnen wegschrijven.
    const vers = await dbLaadOpId(vergaderingId)
    if (!vers) return 0
    const nieuweVersie = (vers.versie || 1) + 1
    const bijgewerkt = { ...vers, versie: nieuweVersie, bijgewerkt: new Date().toISOString() }
    setVergaderingen(huidig => huidig.map(x => x.id === vergaderingId ? bijgewerkt : x))
    await slaVergaderingOp(bijgewerkt)
    return nieuweVersie
  }, [])

  return {
    vergaderingen, geladen, opslaan, supabaseFout, opslaanFout,
    herlaad: laad,
    sluitOpslaanFout: () => setOpslaanFout(false),
    maakNieuwe, kopieer, verwijder, update, updatePunten, herorden, vernieuwToken,
    voegPuntToe, verwijderPunt, updatePunt,
    voegSubpuntToe, verwijderSubpunt, updateSubpunt,
    voegActieToe, toggleActie, verwijderActie, updateActie, neemActiesOver, publiceer,
    voegKalenderItemToe, verwijderKalenderItem, updateKalenderItem,
    vindOpToken,
  }
}

export function useVergaderingOpToken(token: string) {
  const [vergadering, setVergadering] = useState<Vergadering | null>(null)
  const [geladen, setGeladen] = useState(false)
  const [fout, setFout] = useState(false)

  const laad = useCallback(() => {
    if (!token) return
    setFout(false)
    setGeladen(false)
    dbLaadOpToken(token)
      .then(data => { setVergadering(data); setGeladen(true) })
      .catch(() => { setFout(true); setGeladen(true) })
  }, [token])

  useEffect(() => { laad() }, [laad])

  const updateNotulen = useCallback(async (notulen: string) => {
    if (!vergadering) return
    // Vers ophalen vlak voor het schrijven, zodat we niet een verouderde lokale
    // kopie van de hele agenda terugschrijven en daarmee wijzigingen van een
    // ander fractielid overschrijven (kon eerder gebeuren bij gelijktijdig bewerken).
    const vers = await dbLaadOpToken(token)
    const basis = vers || vergadering
    const bijgewerkt = { ...basis, notulen, bijgewerkt: new Date().toISOString() }
    setVergadering(bijgewerkt)
    await slaVergaderingOp(bijgewerkt)
  }, [vergadering, token])

  // Voegt een losse notitie toe aan een hoofdpunt (subIndex null) of een subpunt (subIndex gezet).
  // Zichtbaar en toevoegbaar door alle fractieleden, niet alleen beheerder/moderator.
  const voegNotitieToe = useCallback(async (puntId: number, subIndex: number | null, naam: string, tekst: string) => {
    if (!vergadering || !tekst.trim()) return
    // Vers ophalen vlak voor het schrijven (zie toelichting bij updateNotulen hierboven) —
    // anders overschrijft deze actie notities/wijzigingen die net door iemand anders zijn gedaan.
    const vers = await dbLaadOpToken(token)
    const basis = vers || vergadering
    const nieuwePunten = JSON.parse(JSON.stringify(basis.punten)) as Vergadering['punten']
    const punt = nieuwePunten.find(p => p.id === puntId)
    if (!punt) return
    const nieuweNotitie = { id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, naam: naam || 'Onbekend', tekst: tekst.trim(), datum: new Date().toISOString() }
    if (subIndex === null) {
      punt.notities = [...(punt.notities || []), nieuweNotitie]
    } else {
      const sub = punt.subpunten[subIndex]
      if (!sub) return
      sub.notities = [...(sub.notities || []), nieuweNotitie]
    }
    const bijgewerkt = { ...basis, punten: nieuwePunten, bijgewerkt: new Date().toISOString() }
    setVergadering(bijgewerkt)
    await slaVergaderingOp(bijgewerkt)
  }, [vergadering, token])

  // Zet de aanwezigheidsstatus van één fractielid (verplaatst 'm tussen de drie lijsten).
  // Iedereen kan zijn eigen status zetten/wijzigen, niet alleen beheerder/moderator.
  const zetAanwezigheid = useCallback(async (naam: string, status: 'aanwezig' | 'online' | 'afwezig') => {
    if (!vergadering || !naam) return
    const vers = await dbLaadOpToken(token)
    const basis = vers || vergadering
    const parse = (s: string) => (s || '').split(',').map(n => n.trim()).filter(Boolean)
    const zonderNaam = (lijst: string[]) => lijst.filter(n => n !== naam)
    const aanwezigLijst = zonderNaam(parse(basis.aanwezig))
    const onlineLijst = zonderNaam(parse(basis.online))
    const afwezigLijst = zonderNaam(parse(basis.afwezig))
    if (status === 'aanwezig') aanwezigLijst.push(naam)
    else if (status === 'online') onlineLijst.push(naam)
    else afwezigLijst.push(naam)
    const bijgewerkt = {
      ...basis,
      aanwezig: aanwezigLijst.join(', '), online: onlineLijst.join(', '), afwezig: afwezigLijst.join(', '),
      bijgewerkt: new Date().toISOString(),
    }
    setVergadering(bijgewerkt)
    await slaVergaderingOp(bijgewerkt)
  }, [vergadering, token])

  // Voegt een vrij subpunt toe aan een agendapunt (bijv. "Terugkoppeling gesprekken") —
  // door alle fractieleden, niet alleen beheerder/moderator. Naam+datum staan als
  // toelichting erbij zodat duidelijk is wie het heeft toegevoegd.
  const voegVrijPuntToe = useCallback(async (puntId: number, naam: string, tekst: string) => {
    if (!vergadering || !tekst.trim()) return
    const vers = await dbLaadOpToken(token)
    const basis = vers || vergadering
    const nieuwePunten = JSON.parse(JSON.stringify(basis.punten)) as Vergadering['punten']
    const punt = nieuwePunten.find(p => p.id === puntId)
    if (!punt) return
    const letter = String.fromCharCode(97 + punt.subpunten.length)
    const datumKort = new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    punt.subpunten = [...punt.subpunten, {
      id: letter, titel: tekst.trim(), toelichting: `${naam || 'Onbekend'} — ${datumKort}`, url: '', afgedaan: false,
    }]
    const bijgewerkt = { ...basis, punten: nieuwePunten, bijgewerkt: new Date().toISOString() }
    setVergadering(bijgewerkt)
    await slaVergaderingOp(bijgewerkt)
  }, [vergadering])

  return { vergadering, geladen, fout, herlaad: laad, updateNotulen, voegNotitieToe, zetAanwezigheid, voegVrijPuntToe }
}
