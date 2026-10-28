import type { Agendapunt, Subpunt } from './types'

// Samenvoegen van de agenda (punten) wanneer de editor opslaat terwijl fractieleden
// ondertussen in de leesweergave dingen hebben toegevoegd.
//
// Rolverdeling:
// - De editor (beheerder/moderator) bepaalt de structuur: welke punten en subpunten er zijn,
//   titels, volgorde, links, tijdsblokken enz.
// - Fractieleden voegen toe vanuit de leesweergave: notities, bijlagen, eigen subpunten
//   (auteur gezet), bespreekverzoeken (kopie onder "Te bespreken" + markering op het origineel).
//
// We doen een 3-weg-samenvoeging met:
//   basis  = de versie uit de database waarop de editor zijn wijzigingen heeft gebaseerd
//   lokaal = wat de editor wil opslaan
//   server = de verse versie uit de database
// Alles wat van fractieleden is, komt uit 'server'; de rest uit 'lokaal'.

const schoon = (t: string | undefined) => (t || '').trim().toLocaleLowerCase('nl')

// Korte, deterministische hash (FNV-1a), zodat twee browsers die op dezelfde data een sleutel
// uitdelen dezelfde sleutel kiezen.
function hash(tekst: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

const isVanFractielid = (s: Subpunt) => !!s.auteur || !!s.bespreekKopie

/** Geeft punten en subpunten zonder vaste sleutel er een (blijft daarna altijd hetzelfde). */
export function zorgVoorSleutels(punten: Agendapunt[]): Agendapunt[] {
  return punten.map((p, pi) => {
    const uid = p.uid || `p-${hash(`${pi}|${schoon(p.titel)}`)}`
    const subpunten = (p.subpunten || []).map((s, si) => s.uid ? s : {
      ...s,
      uid: `s-${hash(`${uid}|${si}|${schoon(s.titel)}|${s.url || ''}|${s.bespreekKey || ''}|${s.stemlijstKey || ''}`)}`,
    })
    return p.uid && subpunten.every((s, i) => s === p.subpunten[i]) ? p : { ...p, uid, subpunten }
  })
}

export function vindPunt(lijst: Agendapunt[] | undefined, p: Agendapunt): Agendapunt | undefined {
  if (!lijst) return undefined
  return (p.uid && lijst.find(x => x.uid === p.uid))
    || lijst.find(x => schoon(x.titel) === schoon(p.titel))
}

export function vindSub(lijst: Subpunt[] | undefined, s: Subpunt): Subpunt | undefined {
  if (!lijst) return undefined
  return (s.uid && lijst.find(x => x.uid === s.uid))
    || (s.bespreekKopie && s.bespreekKey && lijst.find(x => x.bespreekKopie && x.bespreekKey === s.bespreekKey))
    || (s.stemlijstKey && lijst.find(x => x.stemlijstKey === s.stemlijstKey))
    || lijst.find(x => schoon(x.titel) === schoon(s.titel) && (x.url || '') === (s.url || ''))
    || undefined
}

function hernummerSubs(subs: Subpunt[]): Subpunt[] {
  return subs.map((s, i) => {
    const id = String.fromCharCode(97 + i)
    return s.id === id ? s : { ...s, id }
  })
}

function voegSubpuntenSamen(basis: Subpunt[] | undefined, lokaal: Subpunt[], server: Subpunt[]): Subpunt[] {
  const uit: Subpunt[] = []
  for (const r of lokaal) {
    const b = vindSub(basis, r)
    const s = vindSub(server, r)
    if (!s) {
      // Een subpunt van een fractielid dat in de database niet meer bestaat, is door die persoon
      // verwijderd — dan niet terugzetten. Subpunten van de editor zelf blijven staan.
      if (b && isVanFractielid(b)) continue
      uit.push(r)
      continue
    }
    const nieuw: Subpunt = { ...r, notities: s.notities, bijlagen: s.bijlagen }
    if (!r.bespreekKopie) { nieuw.bespreekKey = s.bespreekKey; nieuw.bespreekDoor = s.bespreekDoor }
    // Titel van een eigen punt door het fractielid aangepast, en de editor heeft hem niet aangeraakt
    if (isVanFractielid(s) && b && r.titel === b.titel) nieuw.titel = s.titel
    for (const veld of ['notities', 'bijlagen', 'bespreekKey', 'bespreekDoor'] as const) {
      if (nieuw[veld] === undefined) delete nieuw[veld]
    }
    uit.push(nieuw)
  }
  // Nieuwe subpunten van fractieleden die de editor nog niet kende
  for (const s of server) {
    if (!isVanFractielid(s)) continue
    if (vindSub(basis, s) || vindSub(lokaal, s)) continue
    uit.push(s)
  }
  return hernummerSubs(uit)
}

export function voegPuntenSamen(basis: Agendapunt[] | undefined, lokaal: Agendapunt[], server: Agendapunt[]): Agendapunt[] {
  const uit: Agendapunt[] = lokaal.map(r => {
    const s = vindPunt(server, r)
    if (!s) return r
    const b = vindPunt(basis, r)
    const nieuw: Agendapunt = {
      ...r,
      notities: s.notities,
      bijlagen: s.bijlagen,
      subpunten: voegSubpuntenSamen(b?.subpunten, r.subpunten || [], s.subpunten || []),
    }
    if (nieuw.notities === undefined) delete nieuw.notities
    if (nieuw.bijlagen === undefined) delete nieuw.bijlagen
    return nieuw
  })

  // Punten die een fractielid heeft aangemaakt (bijv. "Te bespreken" via een bespreekverzoek)
  // en die de editor nog niet kende: invoegen vóór de informeerpunten.
  const nieuwePunten = server.filter(s => !vindPunt(basis, s) && !vindPunt(lokaal, s)
    && (s.subpunten || []).some(isVanFractielid))
  for (const s of nieuwePunten) {
    const eerste = uit.findIndex(p => p.soort === 'informeer')
    uit.splice(eerste === -1 ? uit.length : eerste, 0, s)
  }
  return nieuwePunten.length ? uit.map((p, i) => (p.id === i + 1 ? p : { ...p, id: i + 1 })) : uit
}

/**
 * Haalt alles weg wat bij één specifieke vergadering hoort (notities, bijlagen, bespreek-
 * markeringen), voor als een punt of hele agenda naar een andere vergadering wordt gekopieerd.
 * Bijlagen moeten zeker weg: verwijderen in de kopie zou anders het bestand van het origineel wissen.
 */
export function zonderVergaderingInhoud(punt: Agendapunt): Agendapunt {
  const { notities: _n, bijlagen: _b, uid: _u, ...rest } = punt
  void _n; void _b; void _u
  return {
    ...rest,
    subpunten: (punt.subpunten || []).map(s => {
      const { notities: _sn, bijlagen: _sb, bespreekKey: _k, bespreekDoor: _d, bespreekKopie: _c, uid: _su, ...srest } = s
      void _sn; void _sb; void _k; void _d; void _c; void _su
      return srest
    }),
  }
}
