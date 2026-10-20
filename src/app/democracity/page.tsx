'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { haalDemocracityDagen, DemocracityDag } from '@/lib/democracity'

const WEEKDAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

function formatDag(datum: string) {
  const d = new Date(datum + 'T12:00:00')
  return {
    dag: WEEKDAG(d),
    nummer: d.getDate(),
    maand: d.toLocaleDateString('nl-NL', { month: 'short' }),
    jaar: d.getFullYear(),
  }
}
const WEEKDAG = (d: Date) => WEEKDAGEN[d.getDay()]

export default function DemocracityPagina() {
  const { naam, isAdmin, geladen: authGeladen } = useAuth()
  const [dagen, setDagen] = useState<DemocracityDag[]>([])
  const [geladen, setGeladen] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [bezigId, setBezigId] = useState<string | null>(null)
  const [melding, setMelding] = useState<string | null>(null)
  const [toonToevoegen, setToonToevoegen] = useState(false)
  const [nieuwDatum, setNieuwDatum] = useState('')
  const [nieuwTijd, setNieuwTijd] = useState('9.30 – 11.30')
  const [nieuwSchool, setNieuwSchool] = useState('')

  const laad = useCallback(async () => {
    try {
      setDagen(await haalDemocracityDagen())
      setFout(null)
    } catch {
      setFout('Kon de dagen niet laden. Is supabase-democracity.sql uitgevoerd?')
    }
    setGeladen(true)
  }, [])

  useEffect(() => { laad() }, [laad])

  const post = async (body: Record<string, unknown>, dagId?: string) => {
    setBezigId(dagId || 'nieuw')
    setMelding(null)
    try {
      const resp = await fetch('/api/democracity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) setMelding(data.fout || 'Dat lukte niet.')
      await laad()
      return resp.ok
    } catch {
      setMelding('Verbindingsfout. Probeer opnieuw.')
      return false
    } finally {
      setBezigId(null)
    }
  }

  const voegDagToe = async () => {
    const ok = await post({ actie: 'dag-toevoegen', datum: nieuwDatum, tijd: nieuwTijd, school: nieuwSchool })
    if (ok) { setNieuwDatum(''); setNieuwSchool(''); setToonToevoegen(false) }
  }

  const verwijderDag = async (dag: DemocracityDag) => {
    const n = dag.democracity_aanmeldingen.length
    const tekst = `${dag.school} (${formatDatumLang(dag.datum)}) verwijderen?` + (n > 0 ? ` Er ${n === 1 ? 'is 1 aanmelding' : `zijn ${n} aanmeldingen`}, die verdwijnen ook.` : '')
    if (!confirm(tekst)) return
    await post({ actie: 'dag-verwijderen', dagId: dag.id }, dag.id)
  }

  if (!authGeladen || !geladen) {
    return <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>⏳ Laden...</div>
  }

  const vandaag = new Date().toISOString().split('T')[0]
  const komend = dagen.filter(d => d.datum >= vandaag)
  const zonderRaadslid = komend.filter(d => d.democracity_aanmeldingen.length === 0).length
  const mijnDagen = komend.filter(d => d.democracity_aanmeldingen.some(a => a.naam === naam)).length

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', color: 'var(--blauw)', fontWeight: 'normal', marginBottom: '6px' }}>🏫 Democracity</h1>
      <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '16px', lineHeight: 1.5 }}>
        Op deze dagen wordt Democracity gespeeld in de raadzaal, met een schoolklas. De spelleider geeft vooraf een korte instructie en
        de raadsleden geven tijdens het spel toelichting vanuit hun kennis en ervaring. Per uitvoering is minimaal 1 raadslid nodig, 2 kan ook.
        Meld je hieronder aan; iedereen ziet wie wanneer gaat.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', fontFamily: 'Arial', fontSize: '12px' }}>
        <span style={{ background: zonderRaadslid > 0 ? '#fdf0ef' : '#e8f5ed', color: zonderRaadslid > 0 ? '#c0392b' : '#2d7a4f', border: `1px solid ${zonderRaadslid > 0 ? '#e8a090' : '#a8d8b5'}`, padding: '4px 10px', borderRadius: '12px' }}>
          {zonderRaadslid > 0 ? `${zonderRaadslid} van ${komend.length} dagen nog zonder raadslid` : `✓ Alle ${komend.length} dagen hebben een raadslid`}
        </span>
        {naam && (
          <span style={{ background: '#f5eeff', color: '#4a1a5c', border: '1px solid #d8c0e8', padding: '4px 10px', borderRadius: '12px' }}>
            Jij staat op {mijnDagen} {mijnDagen === 1 ? 'dag' : 'dagen'}
          </span>
        )}
        <span style={{ flex: 1 }} />
        {isAdmin && (
          <button onClick={() => setToonToevoegen(!toonToevoegen)}
            style={{ background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}>
            {toonToevoegen ? '✕ Sluiten' : '+ Dag toevoegen'}
          </button>
        )}
      </div>

      {isAdmin && toonToevoegen && (
        <div style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '10px', padding: '14px', marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="date" value={nieuwDatum} onChange={e => setNieuwDatum(e.target.value)} style={invoer} />
          <input value={nieuwTijd} onChange={e => setNieuwTijd(e.target.value)} placeholder="Tijd, bijv. 9.30 – 11.30" style={{ ...invoer, width: '170px' }} />
          <input value={nieuwSchool} onChange={e => setNieuwSchool(e.target.value)} onKeyDown={e => e.key === 'Enter' && voegDagToe()}
            placeholder="School" style={{ ...invoer, flex: 1, minWidth: '150px' }} />
          <button onClick={voegDagToe} disabled={!nieuwDatum || !nieuwSchool.trim() || bezigId === 'nieuw'}
            style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600', opacity: (!nieuwDatum || !nieuwSchool.trim()) ? 0.5 : 1 }}>
            Toevoegen
          </button>
        </div>
      )}

      {melding && (
        <div style={{ background: '#fdf0ef', border: '1px solid #e8a090', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#c0392b', fontFamily: 'Arial', display: 'flex' }}>
          <span style={{ flex: 1 }}>{melding}</span>
          <button onClick={() => setMelding(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b' }}>✕</button>
        </div>
      )}
      {fout && <div style={{ color: 'var(--rood)', fontFamily: 'Arial', fontSize: '13px', marginBottom: '12px' }}>{fout}</div>}

      {dagen.length === 0 && !fout && (
        <div style={{ color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontSize: '13px', fontStyle: 'italic' }}>Er zijn nog geen dagen toegevoegd.</div>
      )}

      {dagen.map(dag => {
        const f = formatDag(dag.datum)
        const aanm = dag.democracity_aanmeldingen
        const aantal = aanm.length
        const vol = aantal >= dag.max_personen
        const ikBenAangemeld = !!naam && aanm.some(a => a.naam === naam)
        const verleden = dag.datum < vandaag
        const bezig = bezigId === dag.id

        const status = aantal === 0
          ? { tekst: 'Nog niemand', bg: '#fdf0ef', kleur: '#c0392b', rand: '#e8a090' }
          : vol
            ? { tekst: `Vol (${aantal} van ${dag.max_personen})`, bg: '#f0f0f0', kleur: '#666', rand: '#d0d0d0' }
            : { tekst: `${aantal} van ${dag.max_personen} — nog plek voor ${dag.max_personen - aantal}`, bg: '#e8f5ed', kleur: '#2d7a4f', rand: '#a8d8b5' }

        return (
          <div key={dag.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', background: 'white', border: `1px solid ${ikBenAangemeld ? '#c0a0d8' : 'var(--rand)'}`, borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', opacity: verleden ? 0.55 : 1, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', minWidth: '52px', fontFamily: 'Arial', flexShrink: 0 }}>
              <div style={{ fontSize: '11px', color: 'var(--tekst-zacht)', textTransform: 'uppercase' }}>{f.dag}</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--blauw)', lineHeight: 1.1 }}>{f.nummer}</div>
              <div style={{ fontSize: '11px', color: 'var(--tekst-zacht)' }}>{f.maand} {f.jaar}</div>
            </div>

            <div style={{ flex: 1, minWidth: '180px', fontFamily: 'Arial' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--tekst)' }}>{dag.school}</div>
              {dag.tijd && <div style={{ fontSize: '12px', color: 'var(--tekst-zacht)' }}>🕘 {dag.tijd} uur</div>}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', alignItems: 'center' }}>
                {aanm.map(a => (
                  <span key={a.id} style={{ fontSize: '12px', background: a.naam === naam ? '#4a1a5c' : '#f5eeff', color: a.naam === naam ? 'white' : '#4a1a5c', border: '1px solid #c0a0d8', padding: '2px 10px', borderRadius: '12px' }}>
                    👤 {a.naam}
                    {isAdmin && a.naam !== naam && (
                      <button onClick={() => post({ actie: 'afmelden', dagId: dag.id, naam: a.naam }, dag.id)} title={`${a.naam} afmelden`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: '4px', padding: 0, fontSize: '11px' }}>✕</button>
                    )}
                  </span>
                ))}
                <span style={{ fontSize: '11px', background: status.bg, color: status.kleur, border: `1px solid ${status.rand}`, padding: '2px 8px', borderRadius: '10px' }}>{status.tekst}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
              {!verleden && naam && (
                ikBenAangemeld ? (
                  <button onClick={() => post({ actie: 'afmelden', dagId: dag.id }, dag.id)} disabled={bezig}
                    style={{ background: 'white', color: 'var(--tekst-zacht)', border: '1px solid var(--rand)', padding: '8px 14px', borderRadius: '7px', cursor: bezig ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Arial' }}>
                    {bezig ? '...' : 'Afmelden'}
                  </button>
                ) : (
                  <button onClick={() => post({ actie: 'aanmelden', dagId: dag.id }, dag.id)} disabled={bezig || vol}
                    style={{ background: vol ? '#e8e8e8' : 'var(--blauw)', color: vol ? '#999' : 'white', border: 'none', padding: '8px 16px', borderRadius: '7px', cursor: (bezig || vol) ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600' }}>
                    {bezig ? '...' : vol ? 'Vol' : 'Ik ga mee'}
                  </button>
                )
              )}
              {isAdmin && (
                <button onClick={() => verwijderDag(dag)} disabled={bezig} title="Dag verwijderen"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rood)', fontSize: '15px', padding: '0 4px' }}>✕</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatDatumLang(datum: string) {
  return new Date(datum + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const invoer: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--rand)', borderRadius: '7px', fontSize: '13px', fontFamily: 'Arial', outline: 'none' }
