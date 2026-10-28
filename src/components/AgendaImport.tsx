'use client'

import { useState } from 'react'
import { Agendapunt } from '@/lib/types'
import { haalMoties } from '@/lib/api'
import { AgendaImportAntwoord, ImportRegel, MotieRegel, stelStemlijstVoor, splitsMotieTitel, voegAgendaImportSamen } from '@/lib/agendaImport'

const SOORT_LABEL: Record<string, string> = {
  hamerstuk: 'Hamerstuk', besluitvormend: 'Besluitvormend', oordeelvormend: 'Oordeelvormend', informerend: 'Informerend', overig: '',
}

// Vercel weigert request bodies boven ~4,5 MB; base64 maakt een bestand 4/3 keer zo groot.
const MAX_PDF_BYTES = 3 * 1024 * 1024

function leesAlsBase64(bestand: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lezer = new FileReader()
    lezer.onload = () => resolve(String(lezer.result).split(',')[1] || '')
    lezer.onerror = () => reject(lezer.error)
    lezer.readAsDataURL(bestand)
  })
}

/**
 * Importeert de agenda van de raadsvergadering (PDF van de printpagina of geplakte tekst) en hangt
 * de ingediende concept-moties uit Documenten onder het voorstel waar ze bij horen.
 */
export default function AgendaImport({ punt, onUpdate, nieuweKey }: {
  punt: Agendapunt
  onUpdate: (w: Partial<Agendapunt>) => void
  nieuweKey: () => string
}) {
  const [open, setOpen] = useState(false)
  const [bestand, setBestand] = useState<File | null>(null)
  const [tekst, setTekst] = useState('')
  const [laden, setLaden] = useState(false)
  const [fout, setFout] = useState('')
  const [punten, setPunten] = useState<ImportRegel[] | null>(null)
  const [moties, setMoties] = useState<MotieRegel[]>([])
  const [meta, setMeta] = useState<{ datum: string; agendaUrl: string }>({ datum: '', agendaUrl: '' })
  const [klaar, setKlaar] = useState('')

  const sluit = () => {
    setOpen(false); setPunten(null); setMoties([]); setBestand(null); setTekst(''); setFout(''); setKlaar('')
  }

  const analyseer = async () => {
    if (bestand && bestand.size > MAX_PDF_BYTES) {
      setFout('De PDF is te groot (max. 3 MB). Plak de agendatekst in plaats daarvan.')
      return
    }
    setLaden(true); setFout(''); setKlaar('')
    try {
      // Alleen moties die nu in concept zijn ingediend; afgehandelde moties horen bij eerdere vergaderingen
      const alleMoties = await haalMoties().catch(() => [])
      const concepten = alleMoties
        .filter(d => d.status === 'Concept')
        .map(d => ({ ...splitsMotieTitel(d.titel), url: d.url }))
        .filter(m => m.nummer)
        .sort((a, b) => a.nummer.localeCompare(b.nummer, 'nl', { numeric: true }))

      const res = await fetch('/api/agenda-import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdf: bestand ? await leesAlsBase64(bestand) : undefined,
          tekst: bestand ? undefined : tekst,
          moties: concepten.map(m => ({ nummer: m.nummer, titel: m.titel })),
        }),
      })
      const data = await res.json() as AgendaImportAntwoord & { fout?: string }
      if (data.fout) { setFout(data.fout); setLaden(false); return }

      setMeta({ datum: data.datum, agendaUrl: data.agendaUrl })
      setPunten(data.punten.map(p => ({ ...p, meenemen: true, inStemlijst: stelStemlijstVoor(p) })))
      // Staat de motie al op de agenda, dan wint de koppeling die daar is gekozen
      setMoties(concepten.map(m => {
        const bestaand = punt.subpunten.find(s => s.subtype && s.subtype !== 'normaal' && s.rvNummer === m.nummer)
        const voorstel = data.koppelingen.find(k => k.motie === m.nummer)?.agendapunt || ''
        return { ...m, gekoppeldAanRv: bestaand ? bestaand.gekoppeldAanRv || '' : voorstel, meenemen: true }
      }))
    } catch {
      setFout('Er ging iets mis bij het verwerken van de agenda.')
    }
    setLaden(false)
  }

  const zetOpAgenda = () => {
    if (!punten) return
    const { subpunten, nieuw, bijgewerkt } = voegAgendaImportSamen(punt.subpunten, punten, moties, nieuweKey)
    onUpdate({
      subpunten,
      rvDatum: punt.rvDatum || meta.datum || undefined,
      url: punt.url || meta.agendaUrl || undefined,
    })
    setPunten(null); setMoties([])
    setKlaar(`✓ Op de agenda gezet: ${nieuw} nieuw, ${bijgewerkt} bijgewerkt.`)
  }

  const wijzigPunt = (i: number, w: Partial<ImportRegel>) => setPunten(prev => prev && prev.map((p, j) => (j === i ? { ...p, ...w } : p)))
  const wijzigMotie = (i: number, w: Partial<MotieRegel>) => setMoties(prev => prev.map((m, j) => (j === i ? { ...m, ...w } : m)))

  // Kiesbare voorstellen voor een motie: de aangevinkte importpunten plus wat al op de agenda staat
  const rvOpties = Array.from(new Set([
    ...(punten || []).filter(p => p.meenemen).map(p => p.nummer),
    ...punt.subpunten.filter(s => !s.subtype || s.subtype === 'normaal').map(s => s.rvNummer || '').filter(Boolean),
  ]))
  const titelBij = (nr: string) => punten?.find(p => p.nummer === nr)?.titel || punt.subpunten.find(s => s.rvNummer === nr)?.titel || ''

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ background: 'white', color: '#5a1a8a', border: '1px solid #c0a0d8', padding: '4px 10px', borderRadius: '5px', fontSize: '12px', fontFamily: 'Arial', fontWeight: '600', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' as const }}>
        📥 Importeer agenda
      </button>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget && !laden) sluit() }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '820px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', fontFamily: 'Arial' }}>
        <div style={{ background: '#f8f0ff', padding: '14px 18px', borderBottom: '1px solid #c0a0d8', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#5a1a8a' }}>📥 Agenda raadsvergadering importeren</div>
            <div style={{ fontSize: '12px', color: 'var(--tekst-zacht)', marginTop: '2px' }}>Nummer, titel en stemlijst, plus de ingediende concept-moties uit Documenten</div>
          </div>
          <button onClick={sluit} disabled={laden} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--tekst-zacht)' }}>✕</button>
        </div>

        <div style={{ padding: '16px 18px' }}>
          {!punten && (
            <>
              <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', margin: '0 0 12px', lineHeight: 1.6 }}>
                Kies de PDF van de agenda (de printversie van de agendapagina, of een concept uit de mail), of plak de tekst van de agenda.
                Werk eerst de moties bij onder <strong>Beheer → Excel upload</strong> als er net nieuwe zijn ingediend.
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                <input type="file" accept="application/pdf,.pdf" id="agenda-pdf" style={{ display: 'none' }}
                  onChange={e => { setBestand(e.target.files?.[0] || null); setFout('') }} />
                <label htmlFor="agenda-pdf"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'white', color: 'var(--tekst-zacht)', border: '1.5px solid #ddd', padding: '8px 14px', borderRadius: '7px', fontSize: '13px', cursor: 'pointer' }}>
                  📂 Kies PDF
                </label>
                {bestand && (
                  <span style={{ fontSize: '12px', color: '#2d7a4f' }}>
                    ✓ {bestand.name} <button onClick={() => setBestand(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)' }}>✕</button>
                  </span>
                )}
              </div>
              {!bestand && (
                <textarea value={tekst} onChange={e => setTekst(e.target.value)} rows={6}
                  placeholder="…of plak hier de tekst van de agenda"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--rand)', borderRadius: '6px', fontSize: '12px', fontFamily: 'Arial', boxSizing: 'border-box', resize: 'vertical' }} />
              )}
              <button onClick={analyseer} disabled={laden || (!bestand && !tekst.trim())}
                style={{ marginTop: '10px', background: laden || (!bestand && !tekst.trim()) ? '#ccc' : '#5a1a8a', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: laden ? 'not-allowed' : 'pointer' }}>
                {laden ? '⏳ Agenda lezen… (kan een minuut duren)' : 'Agenda lezen'}
              </button>
              {klaar && <p style={{ fontSize: '13px', color: '#1a5c2a', margin: '12px 0 0' }}>{klaar}</p>}
            </>
          )}

          {fout && <p style={{ fontSize: '13px', color: 'var(--rood)', margin: '12px 0 0' }}>⚠️ {fout}</p>}

          {punten && (
            <>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#5a1a8a', margin: '0 0 6px' }}>
                Agendapunten {meta.datum && <span style={{ fontWeight: 'normal', color: 'var(--tekst-zacht)' }}>· vergadering {meta.datum}</span>}
              </div>
              <div style={{ border: '1px solid var(--rand)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                {punten.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #f0ede8', background: p.meenemen ? 'white' : '#f6f6f4', opacity: p.meenemen ? 1 : 0.55 }}>
                    <input type="checkbox" checked={p.meenemen} onChange={e => wijzigPunt(i, { meenemen: e.target.checked })} title="Meenemen" />
                    <span style={{ width: '36px', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 }}>{p.nummer}</span>
                    <input className="invoer-inline" style={{ flex: 1, fontSize: '12px' }} value={p.titel} onChange={e => wijzigPunt(i, { titel: e.target.value })} />
                    <span style={{ fontSize: '10px', color: 'var(--tekst-zacht)', width: '90px', flexShrink: 0 }}>{SOORT_LABEL[p.soort]}</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--tekst-zacht)', flexShrink: 0, cursor: 'pointer' }}>
                      <input type="checkbox" checked={p.inStemlijst} onChange={e => wijzigPunt(i, { inStemlijst: e.target.checked })} />
                      Stemlijst
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: '12px', fontWeight: '700', color: '#8a4000', margin: '0 0 6px' }}>
                Moties en amendementen in concept ({moties.length})
              </div>
              {moties.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', margin: '0 0 16px' }}>
                  Geen concept-moties gevonden in Documenten.
                </p>
              ) : (
                <div style={{ border: '1px solid var(--rand)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                  {moties.map((m, i) => (
                    <div key={m.nummer} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #f0ede8', background: m.meenemen ? '#fdf8ff' : '#f6f6f4', opacity: m.meenemen ? 1 : 0.55 }}>
                      <input type="checkbox" checked={m.meenemen} onChange={e => wijzigMotie(i, { meenemen: e.target.checked })} title="Meenemen" />
                      <span style={{ width: '62px', fontSize: '11px', fontWeight: 'bold', color: '#8a4000', flexShrink: 0 }}>{m.nummer}</span>
                      <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: '12px', color: 'var(--tekst)', textDecoration: 'none', minWidth: 0 }}>{m.titel}</a>
                      <select value={m.gekoppeldAanRv} onChange={e => wijzigMotie(i, { gekoppeldAanRv: e.target.value })}
                        title={titelBij(m.gekoppeldAanRv)}
                        style={{ fontSize: '11px', padding: '4px 6px', border: '1px solid var(--rand)', borderRadius: '5px', background: 'white', flexShrink: 0, maxWidth: '180px' }}>
                        <option value="">Los (vreemd aan de orde)</option>
                        {rvOpties.map(nr => <option key={nr} value={nr}>{nr} {titelBij(nr).substring(0, 28)}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setPunten(null); setMoties([]) }}
                  style={{ background: 'white', color: 'var(--tekst-zacht)', border: '1px solid var(--rand)', padding: '8px 14px', borderRadius: '7px', fontSize: '13px', cursor: 'pointer' }}>
                  ← Terug
                </button>
                <button onClick={zetOpAgenda}
                  style={{ background: '#5a1a8a', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  ✓ Op de agenda zetten
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
