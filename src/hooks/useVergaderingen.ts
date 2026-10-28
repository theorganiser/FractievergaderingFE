'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Vergadering, Agendapunt, Subpunt, ActieItem, KalenderItem } from '@/lib/types'
import {
  laadVergaderingen as dbLaad,
  laadVergaderingOpToken as dbLaadOpToken,
  laadVergaderingOpId as dbLaadOpId,
  slaVergaderingOp,
  wijzigVergadering,
  zetAanwezigheidDb,
  verwijderVergaderingDb,
  nieuweId,
  maakLeesbarToken,
  nieuwToken,
} from '@/lib/storage'
import { bouwPuntenMetOpties } from '@/lib/template'
import { auteurVan } from '@/lib/punten'
import { voegPuntenSamen, vindPunt, vindSub, zonderVergaderingInhoud } from '@/lib/samenvoegen'
import { AanwezigheidStatus } from '@/lib/aanwezigheid'
import { vandaagNL, formatTijdstipDatum } from '@/lib/tijd'

// Hoe vaak de editor op de achtergrond kijkt of fractieleden iets hebben toegevoegd
const VERVERS_INTERVAL = 15000

export function useVergaderingen(volgId?: string) {
  const [vergaderingen, setVergaderingen] = useState<Vergadering[]>([])
  const [geladen, setGeladen] = useState(false)
  const [opslaan, setOpslaan] = useState(false)
  const [supabaseFout, setSupabaseFout] = useState(false)
  const [opslaanFout, setOpslaanFout] = useState(false)
  const [opslaanMelding, setOpslaanMelding] = useState<string | null>(null)
  // Eén debounce-timer per vergadering: een wijziging op B mag de nog lopende opslag van A
  // niet annuleren.
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const lopendeSchrijfacties = useRef(0)
  const bezigMet = useRef<Record<string, number>>({})
  // Wijzigingen die nog niet geschreven zijn, per vergadering-id opgeteld — zodat meerdere
  // snelle bewerkingen binnen hetzelfde debounce-venster niet verloren gaan.
  const pendingWijzigingen = useRef<Record<string, Partial<Vergadering>>>({})
  // De agenda zoals die in de database stond toen de lokale kopie werd geladen. Nodig om bij
  // opslaan te zien wat fractieleden ondertussen hebben toegevoegd (zie samenvoegen.ts).
  const basisPunten = useRef<Record<string, Agendapunt[]>>({})
  const serverVersie = useRef<Record<string, string>>({})

  const neemServerVersieOver = useCallback((v: Vergadering) => {
    basisPunten.current[v.id] = structuredClone(v.punten || [])
    serverVersie.current[v.id] = v.bijgewerkt
    setVergaderingen(huidig => huidig.some(x => x.id === v.id)
      ? huidig.map(x => x.id === v.id ? v : x)
      : [v, ...huidig])
  }, [])

  const heeftOpenstaand = (id: string) =>
    !!pendingWijzigingen.current[id] || !!debounceTimers.current[id] || (bezigMet.current[id] || 0) > 0

  const laad = useCallback(() => {
    setSupabaseFout(false)
    setGeladen(false)
    dbLaad()
      .then(data => {
        data.forEach(v => {
          basisPunten.current[v.id] = structuredClone(v.punten || [])
          serverVersie.current[v.id] = v.bijgewerkt
        })
        setVergaderingen(data); setGeladen(true)
      })
      .catch(() => { setSupabaseFout(true); setGeladen(true) })
  }, [])

  useEffect(() => { laad() }, [laad])

  // De open vergadering in de editor op de achtergrond verversen, zodat aanwezigheid, notities
  // en punten van fractieleden zichtbaar worden. Alleen als er lokaal niets openstaat.
  useEffect(() => {
    if (!volgId) return
    let actief = true
    const ververs = async () => {
      if (heeftOpenstaand(volgId)) return
      const vers = await dbLaadOpId(volgId)
      if (!actief || !vers || heeftOpenstaand(volgId)) return
      if (vers.bijgewerkt !== serverVersie.current[volgId]) neemServerVersieOver(vers)
    }
    const timer = setInterval(ververs, VERVERS_INTERVAL)
    const opFocus = () => { if (document.visibilityState === 'visible') ververs() }
    document.addEventListener('visibilitychange', opFocus)
    window.addEventListener('focus', opFocus)
    return () => {
      actief = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', opFocus)
      window.removeEventListener('focus', opFocus)
    }
  }, [volgId, neemServerVersieOver])

  const schrijf = useCallback(async (id: string) => {
    delete debounceTimers.current[id]
    const teSchrijven = pendingWijzigingen.current[id] || {}
    delete pendingWijzigingen.current[id]
    lopendeSchrijfacties.current++
    bezigMet.current[id] = (bezigMet.current[id] || 0) + 1
    try {
      // Vers ophalen vlak voor het schrijven en alleen de eigen wijzigingen erop zetten. De agenda
      // wordt samengevoegd met wat fractieleden ondertussen hebben toegevoegd, en de server
      // weigert als er tussen ophalen en schrijven nog iets veranderd is (dan opnieuw).
      const { resultaat, vergadering } = await wijzigVergadering(() => dbLaadOpId(id), vers => {
        const nieuw: Vergadering = { ...vers, ...teSchrijven }
        if (teSchrijven.punten) nieuw.punten = voegPuntenSamen(basisPunten.current[id], teSchrijven.punten, vers.punten || [])
        return nieuw
      })
      if (!resultaat.ok) {
        setOpslaanFout(true)
        setOpslaanMelding(resultaat.melding)
        return
      }
      // Niets nieuws in de tussentijd (en geen andere schrijfactie bezig)? Dan de opgeslagen
      // versie tonen, inclusief wat fractieleden ondertussen hebben toegevoegd.
      const nogIetsOpen = !!pendingWijzigingen.current[id] || !!debounceTimers.current[id] || bezigMet.current[id] > 1
      if (vergadering && !nogIetsOpen) neemServerVersieOver(vergadering)
    } finally {
      bezigMet.current[id]--
      lopendeSchrijfacties.current--
      // "Opslaan…" pas uit als er voor geen enkele vergadering meer iets openstaat
      if (lopendeSchrijfacties.current === 0 && Object.keys(debounceTimers.current).length === 0) {
        setOpslaan(false)
      }
    }
  }, [neemServerVersieOver])

  const slaOp = useCallback((id: string, wijzigingen: Partial<Vergadering>) => {
    // Optimistische lokale update voor directe UI-feedback
    setVergaderingen(huidig => huidig.map(v => v.id === id ? { ...v, ...wijzigingen } : v))

    pendingWijzigingen.current[id] = { ...pendingWijzigingen.current[id], ...wijzigingen }

    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id])
    setOpslaan(true)
    setOpslaanFout(false)
    setOpslaanMelding(null)
    debounceTimers.current[id] = setTimeout(() => { schrijf(id) }, 3000)
  }, [schrijf])

  // Lokale stand bijwerken zonder op te slaan (bijv. na een aanwezigheidswijziging die de
  // server al heeft verwerkt).
  const zetLokaal = useCallback((id: string, velden: Partial<Vergadering>) => {
    setVergaderingen(huidig => huidig.map(v => v.id === id ? { ...v, ...velden } : v))
  }, [])

  const maakNieuwe = useCallback(async (opties: {
    vanTemplate: boolean
    vergaderingDatum?: string
    heeftPA: boolean; paDatum: string; paUrl: string
    heeftRV: boolean; rvDatum: string; rvUrl: string
  }): Promise<Vergadering> => {
    const datumStr = opties.vergaderingDatum || vandaagNL()
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
    const res = await slaVergaderingOp(v)
    if (!res.ok) { setOpslaanFout(true); setOpslaanMelding(res.melding); return v }
    neemServerVersieOver({ ...v, bijgewerkt: res.bijgewerkt })
    return v
  }, [vergaderingen, neemServerVersieOver])

  const kopieer = useCallback(async (id: string): Promise<Vergadering | null> => {
    const orig = vergaderingen.find(v => v.id === id)
    if (!orig) return null
    const bestaandeTokens = vergaderingen.map(v => v.deeltoken)
    // Een kopie is een nieuwe vergadering: geen aanwezigheid, notulen, notities of bijlagen van
    // het origineel meenemen (bijlagen zouden anders naar de bestanden van het origineel wijzen).
    const kop: Vergadering = {
      ...structuredClone(orig),
      id: nieuweId(),
      titel: 'Kopie van ' + orig.titel,
      datum: '',
      versie: 1,
      aanwezig: '', online: '', afwezig: '',
      notulen: '',
      punten: (orig.punten || []).map(zonderVergaderingInhoud),
      deeltoken: nieuwToken(),
      aangemaakt: new Date().toISOString(),
      bijgewerkt: new Date().toISOString(),
    }
    if (orig.datum) kop.deeltoken = maakLeesbarToken('', bestaandeTokens)
    const res = await slaVergaderingOp(kop)
    if (!res.ok) { setOpslaanFout(true); setOpslaanMelding(res.melding); return kop }
    neemServerVersieOver({ ...kop, bijgewerkt: res.bijgewerkt })
    return kop
  }, [vergaderingen, neemServerVersieOver])

  const verwijder = useCallback(async (id: string) => {
    const ok = await verwijderVergaderingDb(id)
    if (!ok) { setOpslaanFout(true); setOpslaanMelding('Verwijderen mislukt.'); return }
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
    const nieuw = v.punten.filter((_, i) => i !== puntIndex).map((p, i) => ({ ...p, id: i + 1 }))
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
    const nieuweSubs = v.punten[puntIndex].subpunten
      .filter((_, i) => i !== subIndex)
      .map((s, i) => ({ ...s, id: String.fromCharCode(97 + i) }))
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
      datum: v.datum || vandaagNL(),
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
    // Eerst openstaande wijzigingen wegschrijven, anders publiceer je een versie zonder die laatste aanpassing
    if (debounceTimers.current[vergaderingId]) {
      clearTimeout(debounceTimers.current[vergaderingId])
      await schrijf(vergaderingId)
    }
    let nieuweVersie = 0
    const { resultaat, vergadering } = await wijzigVergadering(() => dbLaadOpId(vergaderingId), vers => {
      nieuweVersie = (vers.versie || 1) + 1
      return { ...vers, versie: nieuweVersie }
    })
    if (!resultaat.ok || !vergadering) {
      setOpslaanFout(true); setOpslaanMelding(resultaat.ok ? 'Publiceren mislukt.' : resultaat.melding)
      return 0
    }
    if (!heeftOpenstaand(vergaderingId)) neemServerVersieOver(vergadering)
    else zetLokaal(vergaderingId, { versie: nieuweVersie })
    return nieuweVersie
  }, [schrijf, neemServerVersieOver, zetLokaal])

  // Aanwezigheid van één persoon (beheerder/moderator in de checklist). Loopt via een eigen
  // route die alleen die ene naam verplaatst, op de verse versie in de database.
  const zetAanwezigheid = useCallback(async (vergaderingId: string, naam: string, status: AanwezigheidStatus | null): Promise<boolean> => {
    const res = await zetAanwezigheidDb(vergaderingId, naam, status)
    if (!res.ok) { setOpslaanFout(true); setOpslaanMelding(res.melding); return false }
    zetLokaal(vergaderingId, { aanwezig: res.aanwezig, online: res.online, afwezig: res.afwezig })
    return true
  }, [zetLokaal])

  return {
    vergaderingen, geladen, opslaan, supabaseFout, opslaanFout, opslaanMelding,
    herlaad: laad,
    sluitOpslaanFout: () => { setOpslaanFout(false); setOpslaanMelding(null) },
    maakNieuwe, kopieer, verwijder, update, updatePunten, herorden, vernieuwToken,
    voegPuntToe, verwijderPunt, updatePunt,
    voegSubpuntToe, verwijderSubpunt, updateSubpunt,
    voegActieToe, toggleActie, verwijderActie, updateActie, neemActiesOver, publiceer,
    voegKalenderItemToe, verwijderKalenderItem, updateKalenderItem,
    vindOpToken, zetAanwezigheid,
  }
}

// Zoekt in de verse versie het punt/subpunt op dat de gebruiker in zijn (mogelijk oudere)
// scherm aanklikte. Op vaste sleutel of titel, niet op positie: de editor kan intussen punten
// hebben verschoven of verwijderd.
function vindDoel(vers: Vergadering, lokaal: Vergadering, puntId: number, subIndex: number | null): { punt: Agendapunt; sub: Subpunt | null } | null {
  const lokaalPunt = lokaal.punten.find(p => p.id === puntId)
  if (!lokaalPunt) return null
  const punt = vindPunt(vers.punten, lokaalPunt)
  if (!punt) return null
  if (subIndex === null) return { punt, sub: null }
  const lokaalSub = lokaalPunt.subpunten[subIndex]
  const sub = lokaalSub ? vindSub(punt.subpunten, lokaalSub) : undefined
  return sub ? { punt, sub } : null
}

const hernummer = (subs: Subpunt[]) => subs.forEach((s, i) => { s.id = String.fromCharCode(97 + i) })

export function useVergaderingOpToken(token: string) {
  const [vergadering, setVergadering] = useState<Vergadering | null>(null)
  const [geladen, setGeladen] = useState(false)
  const [fout, setFout] = useState(false)
  // Melding als een actie (notitie, aanwezigheid, ...) niet opgeslagen kon worden
  const [actieFout, setActieFout] = useState<string | null>(null)

  const laad = useCallback(() => {
    if (!token) return
    setFout(false)
    setGeladen(false)
    dbLaadOpToken(token)
      .then(data => { setVergadering(data); setGeladen(true) })
      .catch(() => { setFout(true); setGeladen(true) })
  }, [token])

  useEffect(() => { laad() }, [laad])

  // Ververst op de achtergrond (zonder laadscherm), bijv. voor de presentatiemodus
  // zodat opmerkingen die tijdens de vergadering worden toegevoegd vanzelf verschijnen.
  const stilleHerlaad = useCallback(() => {
    if (!token) return
    dbLaadOpToken(token).then(data => { if (data) setVergadering(data) }).catch(() => {})
  }, [token])

  // Terug naar dit tabblad? Dan meteen de laatste stand ophalen.
  useEffect(() => {
    const opFocus = () => { if (document.visibilityState === 'visible') stilleHerlaad() }
    document.addEventListener('visibilitychange', opFocus)
    return () => document.removeEventListener('visibilitychange', opFocus)
  }, [stilleHerlaad])

  // Voert een wijziging uit op de verse versie uit de database (met versiecontrole en opnieuw
  // proberen bij gelijktijdig bewerken) en toont het resultaat. Geeft false bij mislukken.
  const voerUit = useCallback(async (wijzig: (vers: Vergadering, lokaal: Vergadering) => Vergadering | null): Promise<boolean> => {
    if (!vergadering) return false
    const lokaal = vergadering
    setActieFout(null)
    const { resultaat, vergadering: nieuw } = await wijzigVergadering(() => dbLaadOpToken(token), vers => wijzig(vers, lokaal))
    if (!resultaat.ok) {
      setActieFout(resultaat.melding)
      stilleHerlaad()
      return false
    }
    if (nieuw) setVergadering(nieuw)
    return true
  }, [vergadering, token, stilleHerlaad])

  const updateNotulen = useCallback(async (notulen: string) => {
    await voerUit(v => ({ ...v, notulen }))
  }, [voerUit])

  // Voegt een losse notitie toe aan een hoofdpunt (subIndex null) of een subpunt (subIndex gezet).
  // Zichtbaar en toevoegbaar door alle fractieleden, niet alleen beheerder/moderator.
  const voegNotitieToe = useCallback(async (puntId: number, subIndex: number | null, naam: string, tekst: string) => {
    if (!tekst.trim()) return
    const nieuweNotitie = { id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, naam: naam || 'Onbekend', tekst: tekst.trim(), datum: new Date().toISOString() }
    await voerUit((v, lokaal) => {
      const doel = vindDoel(v, lokaal, puntId, subIndex)
      if (!doel) return null
      const plek = doel.sub || doel.punt
      plek.notities = [...(plek.notities || []), nieuweNotitie]
      return v
    })
  }, [voerUit])

  // Past de tekst van een bestaande notitie aan. Alleen de auteur zelf (zelfde naam) of
  // een beheerder mag dat; de controle staat hier zodat ook een verouderde UI dit niet omzeilt.
  const wijzigNotitie = useCallback(async (puntId: number, subIndex: number | null, notitieId: string, tekst: string, naam: string, isAdmin: boolean) => {
    if (!tekst.trim()) return
    await voerUit((v, lokaal) => {
      const doel = vindDoel(v, lokaal, puntId, subIndex)
      const notitie = doel && ((doel.sub || doel.punt).notities || []).find(n => n.id === notitieId)
      if (!notitie || (notitie.naam !== naam && !isAdmin)) return null
      notitie.tekst = tekst.trim()
      notitie.bewerkt = new Date().toISOString()
      return v
    })
  }, [voerUit])

  const verwijderNotitie = useCallback(async (puntId: number, subIndex: number | null, notitieId: string, naam: string, isAdmin: boolean) => {
    await voerUit((v, lokaal) => {
      const doel = vindDoel(v, lokaal, puntId, subIndex)
      if (!doel) return null
      const plek = doel.sub || doel.punt
      const notitie = (plek.notities || []).find(n => n.id === notitieId)
      if (!notitie || (notitie.naam !== naam && !isAdmin)) return null
      plek.notities = (plek.notities || []).filter(n => n.id !== notitieId)
      return v
    })
  }, [voerUit])

  // Zet een subpunt van een informeerpunt "te bespreken" aan of uit. Aan: er komt een kopie onder
  // het bespreekpunt "Te bespreken" (gekoppeld via bespreekKey) en het origineel krijgt een markering.
  // Uit: de kopie verdwijnt weer en de markering gaat eraf.
  const zetBespreken = useCallback(async (puntId: number, subIndex: number, naam: string, aan: boolean, isAdmin = false) => {
    await voerUit((v, lokaal) => {
      const doel = vindDoel(v, lokaal, puntId, subIndex)
      if (!doel?.sub) return null
      const { punt, sub } = doel
      const nieuwePunten = v.punten

      if (aan) {
        if (sub.bespreekKey) return null
        const sleutel = `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        let teBespreken = nieuwePunten.find(p => p.soort !== 'informeer' && p.titel.trim().toLowerCase() === 'te bespreken')
          || nieuwePunten.find(p => p.soort !== 'informeer' && p.titel.toLowerCase().includes('te bespreken'))
        if (!teBespreken) {
          // Oudere/aangepaste agenda zonder "Te bespreken": maak het punt aan, vóór de informeerpunten.
          teBespreken = { id: 0, titel: 'Te bespreken', toelichting: '', subpunten: [] }
          const eerste = nieuwePunten.findIndex(p => p.soort === 'informeer')
          nieuwePunten.splice(eerste === -1 ? nieuwePunten.length : eerste, 0, teBespreken)
          nieuwePunten.forEach((p, i) => { p.id = i + 1 })
        }
        sub.bespreekKey = sleutel
        sub.bespreekDoor = naam || 'Onbekend'
        teBespreken.subpunten.push({
          id: String.fromCharCode(97 + teBespreken.subpunten.length),
          titel: sub.titel, url: sub.url || '', afgedaan: false,
          toelichting: `Ingebracht door ${naam || 'Onbekend'} vanuit "${punt.titel}"`,
          bespreekKey: sleutel, bespreekKopie: true, bespreekDoor: naam || 'Onbekend', auteur: naam || 'Onbekend',
        })
      } else {
        const sleutel = sub.bespreekKey
        if (!sleutel) return null
        // Alleen wie het punt op de bespreeklijst heeft gezet (of de beheerder) mag dat terugdraaien
        if (sub.bespreekDoor !== naam && !isAdmin) return null
        nieuwePunten.forEach(p => {
          const over = p.subpunten.filter(s => !(s.bespreekKopie && s.bespreekKey === sleutel))
          if (over.length !== p.subpunten.length) { hernummer(over); p.subpunten = over }
        })
        sub.bespreekKey = undefined
        sub.bespreekDoor = undefined
      }
      return v
    })
  }, [voerUit])

  // Past de titel aan van een subpunt dat je zelf hebt toegevoegd (alleen de auteur of een beheerder).
  // Is het punt gekoppeld aan een bespreekverzoek, dan wordt de titel bij beide kanten bijgewerkt.
  const wijzigEigenPunt = useCallback(async (puntId: number, subIndex: number, titel: string, naam: string, isAdmin: boolean) => {
    if (!titel.trim()) return
    await voerUit((v, lokaal) => {
      const sub = vindDoel(v, lokaal, puntId, subIndex)?.sub
      if (!sub || (auteurVan(sub) !== naam && !isAdmin)) return null
      sub.titel = titel.trim()
      if (sub.bespreekKey) {
        v.punten.forEach(p => p.subpunten.forEach(s => { if (s.bespreekKey === sub.bespreekKey) s.titel = titel.trim() }))
      }
      return v
    })
  }, [voerUit])

  // Verwijdert een subpunt dat je zelf hebt toegevoegd. Heeft het een bespreekverzoek, dan gaat de
  // kopie onder "Te bespreken" mee weg; is het zelf die kopie, dan verdwijnt de markering bij het origineel.
  const verwijderEigenPunt = useCallback(async (puntId: number, subIndex: number, naam: string, isAdmin: boolean) => {
    await voerUit((v, lokaal) => {
      const doel = vindDoel(v, lokaal, puntId, subIndex)
      if (!doel?.sub) return null
      const { punt, sub } = doel
      if (auteurVan(sub) !== naam && !isAdmin) return null
      const sleutel = sub.bespreekKey

      punt.subpunten = punt.subpunten.filter(s => s !== sub)
      hernummer(punt.subpunten)

      if (sleutel) {
        v.punten.forEach(p => {
          if (sub.bespreekKopie) {
            // gewist was de kopie: haal de markering bij het origineel weg
            p.subpunten.forEach(s => { if (s.bespreekKey === sleutel && !s.bespreekKopie) { s.bespreekKey = undefined; s.bespreekDoor = undefined } })
          } else {
            // gewist was het origineel: ruim de kopie op
            const over = p.subpunten.filter(s => !(s.bespreekKopie && s.bespreekKey === sleutel))
            if (over.length !== p.subpunten.length) { hernummer(over); p.subpunten = over }
          }
        })
      }
      return v
    })
  }, [voerUit])

  // Zet de aanwezigheidsstatus van de ingelogde persoon. De server verplaatst alleen die ene naam,
  // op de verse versie, zodat antwoorden van anderen nooit verloren gaan. Geeft false bij mislukken
  // (de pop-up blijft dan open met een melding).
  const zetAanwezigheid = useCallback(async (naam: string, status: AanwezigheidStatus): Promise<boolean> => {
    if (!vergadering || !naam) return false
    setActieFout(null)
    const res = await zetAanwezigheidDb(vergadering.id, naam, status)
    if (!res.ok) { setActieFout(res.melding); return false }
    setVergadering(v => v ? { ...v, aanwezig: res.aanwezig, online: res.online, afwezig: res.afwezig, bijgewerkt: res.bijgewerkt } : v)
    return true
  }, [vergadering])

  // Voegt een vrij subpunt toe aan een agendapunt (bijv. "Terugkoppeling gesprekken") —
  // door alle fractieleden, niet alleen beheerder/moderator. Naam+datum staan als
  // toelichting erbij zodat duidelijk is wie het heeft toegevoegd.
  const voegVrijPuntToe = useCallback(async (puntId: number, naam: string, tekst: string) => {
    if (!tekst.trim()) return
    const datumKort = formatTijdstipDatum(new Date().toISOString())
    await voerUit((v, lokaal) => {
      const punt = vindDoel(v, lokaal, puntId, null)?.punt
      if (!punt) return null
      punt.subpunten = [...punt.subpunten, {
        id: String.fromCharCode(97 + punt.subpunten.length),
        titel: tekst.trim(), toelichting: `${naam || 'Onbekend'} — ${datumKort}`, url: '', afgedaan: false,
        auteur: naam || 'Onbekend',
      }]
      return v
    })
  }, [voerUit])

  // Voegt een bijlage-verwijzing toe (het bestand zelf staat al in Supabase Storage,
  // dit registreert alleen de metadata bij het punt/subpunt). Door alle fractieleden.
  const voegBijlageToe = useCallback(async (puntId: number, subIndex: number | null, bijlage: { naam: string; pad: string; type: string; grootte: number; uploader: string }) => {
    const nieuweBijlage = { id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...bijlage, datum: new Date().toISOString() }
    await voerUit((v, lokaal) => {
      const doel = vindDoel(v, lokaal, puntId, subIndex)
      if (!doel) return null
      const plek = doel.sub || doel.punt
      plek.bijlagen = [...(plek.bijlagen || []), nieuweBijlage]
      return v
    })
  }, [voerUit])

  // Verwijdert een bijlage-verwijzing. Het onderliggende bestand in Storage wordt
  // los verwijderd door de aanroeper (via /api/bijlagen/verwijderen).
  const verwijderBijlage = useCallback(async (puntId: number, subIndex: number | null, bijlageId: string) => {
    await voerUit((v, lokaal) => {
      const doel = vindDoel(v, lokaal, puntId, subIndex)
      if (!doel) return null
      const plek = doel.sub || doel.punt
      plek.bijlagen = (plek.bijlagen || []).filter(b => b.id !== bijlageId)
      return v
    })
  }, [voerUit])

  return {
    vergadering, geladen, fout, herlaad: laad, stilleHerlaad,
    actieFout, sluitActieFout: () => setActieFout(null),
    updateNotulen, voegNotitieToe, wijzigNotitie, verwijderNotitie, zetBespreken, wijzigEigenPunt, verwijderEigenPunt,
    zetAanwezigheid, voegVrijPuntToe, voegBijlageToe, verwijderBijlage,
  }
}
