'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ApiDocument } from '@/lib/types'
import { haalRaadsmededelingen, haalAfgedaaneVragen, haalAlleVragen, startSyncEnWacht, SyncLogItem, DEMO_RM, DEMO_VRAGEN } from '@/lib/api'
import { formatDatumNL, formatDatumKort } from '@/lib/datum'
import { useAuth } from '@/hooks/useAuth'

type Filter = 'alle' | 'rm' | 'tq' | 'sq' | 'open_gdp'

export default function DocumentenPagina() {
  const { isAdmin } = useAuth()
  const [rmDocs, setRmDocs] = useState<ApiDocument[]>([])
  const [vragenDocs, setVragenDocs] = useState<ApiDocument[]>([])
  const [alleVragenDocs, setAlleVragenDocs] = useState<ApiDocument[]>([])
  const [laden, setLaden] = useState(true)
  const [verversBezig, setVerversBezig] = useState(false)
  const [syncBezig, setSyncBezig] = useState(false)
  const [syncResultaat, setSyncResultaat] = useState<SyncLogItem | null>(null)
  const [filter, setFilter] = useState<Filter>('alle')
  const [zoek, setZoek] = useState('')
  const [fout, setFout] = useState(false)
  const [autoRefreshAftellen, setAutoRefreshAftellen] = useState<number | null>(null)
  const afteltimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const laadAlles = useCallback(async (stil = false) => {
    if (!stil) setLaden(true)
    else setVerversBezig(true)
    setFout(false)
    try {
      const [rm, vragen, alleVragen] = await Promise.all([
        haalRaadsmededelingen().catch(() => [] as ApiDocument[]),
        haalAfgedaaneVragen().catch(() => [] as ApiDocument[]),
        haalAlleVragen().catch(() => [] as ApiDocument[]),
      ])
      setRmDocs(rm.length > 0 ? rm : DEMO_RM)
      setVragenDocs(vragen.length > 0 ? vragen : DEMO_VRAGEN)
      setAlleVragenDocs(alleVragen)
      if (rm.length === 0 && vragen.length === 0) setFout(true)
    } catch {
      setRmDocs(DEMO_RM)
      setVragenDocs(DEMO_VRAGEN)
      setFout(true)
    }
    if (!stil) setLaden(false)
    else setVerversBezig(false)
  }, [])

  useEffect(() => { laadAlles() }, [laadAlles])

  // Autorefresh aftellen starten
  const startAutoRefresh = useCallback((seconden: number) => {
    if (afteltimer.current) clearInterval(afteltimer.current)
    setAutoRefreshAftellen(seconden)
    afteltimer.current = setInterval(() => {
      setAutoRefreshAftellen(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(afteltimer.current!)
          laadAlles(true)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }, [laadAlles])

  useEffect(() => () => { if (afteltimer.current) clearInterval(afteltimer.current) }, [])

  const handleSync = async () => {
    setSyncBezig(true)
    setSyncResultaat(null)
    try {
      const log = await startSyncEnWacht()
      setSyncResultaat(log[0] || null)
      // Start automatische verversing na 60 seconden
      startAutoRefresh(60)
    } catch {
      setSyncResultaat(null)
    }
    setSyncBezig(false)
  }

  const handleVerversen = () => {
    if (afteltimer.current) clearInterval(afteltimer.current)
    setAutoRefreshAftellen(null)
    laadAlles(true)
  }

  // open_gdp gebruikt alleVragenDocs (alle vragen incl. niet-afgedane)
  const openGdpDocs = alleVragenDocs.filter(d =>
    (d.type === 'technische_vragen' || d.type === 'schriftelijke_vragen') &&
    (!d.afgedaan || d.afgedaan === '') &&
    (d.fracties?.includes('Goois Democratisch Platform') || d.indieners?.includes('Goois Democratisch Platform'))
  )

  const alleDocs: ApiDocument[] = filter === 'open_gdp'
    ? openGdpDocs
    : [...rmDocs, ...vragenDocs]

  const gefilterd = alleDocs.filter(doc => {
    const matchFilter =
      filter === 'alle' ? true :
      filter === 'rm' ? doc.type === 'raadsmededelingen' :
      filter === 'tq' ? doc.type === 'technische_vragen' :
      filter === 'sq' ? doc.type === 'schriftelijke_vragen' :
      filter === 'open_gdp' ? true : true
    const matchZoek = !zoek ||
      doc.titel.toLowerCase().includes(zoek.toLowerCase()) ||
      (doc.indieners || '').toLowerCase().includes(zoek.toLowerCase()) ||
      (doc.fracties || '').toLowerCase().includes(zoek.toLowerCase())
    return matchFilter && matchZoek
  })

  const TYPE_CONFIG: Record<string, { label: string; bg: string; kleur: string; rand: string }> = {
    raadsmededelingen: { label: 'RM', bg: '#f0eeff', kleur: '#4a1a5c', rand: '#c0a0d8' },
    technische_vragen: { label: 'TQ', bg: '#e8f0f8', kleur: '#1a4a7a', rand: '#a0c0e0' },
    schriftelijke_vragen: { label: 'SQ', bg: '#f0e8f8', kleur: '#5a1a8a', rand: '#c0a0e0' },
  }

  const counts = {
    rm: rmDocs.length,
    tq: vragenDocs.filter(d => d.type === 'technische_vragen').length,
    sq: vragenDocs.filter(d => d.type === 'schriftelijke_vragen').length,
    open_gdp: openGdpDocs.length,
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>Raadsdocumenten</h1>
          <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', margin: '2px 0 0', fontFamily: 'Arial' }}>
            Raadsmededelingen en beantwoorde vragen — gemeente Gooise Meren
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Verversen knop */}
          <button onClick={handleVerversen} disabled={verversBezig || laden} style={{
            background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)',
            padding: '8px 16px', borderRadius: '8px', cursor: (verversBezig || laden) ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '6px',
            opacity: (verversBezig || laden) ? 0.6 : 1,
          }}>
            {verversBezig ? <><Spinner kleur="var(--blauw)" /> Laden...</> : '↻ Ververs lijst'}
          </button>

          {/* Sync knop - alleen voor beheerder */}
          {isAdmin && (
            <button onClick={handleSync} disabled={syncBezig} style={{
              background: syncBezig ? '#d0c0e0' : 'var(--blauw)',
              color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px',
              cursor: syncBezig ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Arial',
              display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600',
            }}>
              {syncBezig ? <><Spinner kleur="white" /> Scraper actief...</> : <>↻ Documenten verversen</>}
            </button>
          )}
        </div>
      </div>

      <div style={{ height: '2px', background: 'linear-gradient(to right, var(--blauw), #a89060, transparent)', margin: '12px 0 20px' }} />

      {/* Sync resultaat + autorefresh banner */}
      {(syncResultaat || autoRefreshAftellen !== null) && (
        <div style={{ background: '#2d4a1a', color: 'white', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontFamily: 'Arial', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {syncResultaat && (
            <>
              <span>✓ Sync geslaagd</span>
              {syncResultaat.nieuw !== undefined && <Pill>{syncResultaat.nieuw} nieuw</Pill>}
              {syncResultaat.bijgewerkt !== undefined && <Pill>{syncResultaat.bijgewerkt} bijgewerkt</Pill>}
            </>
          )}
          {autoRefreshAftellen !== null && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ opacity: 0.8 }}>Lijst wordt automatisch ververst over</span>
              <span style={{ background: '#a89060', color: '#1a0a2e', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', minWidth: '32px', textAlign: 'center' }}>
                {autoRefreshAftellen}s
              </span>
              <button onClick={handleVerversen} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                Nu verversen
              </button>
              <button onClick={() => { if (afteltimer.current) clearInterval(afteltimer.current); setAutoRefreshAftellen(null) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}>×</button>
            </span>
          )}
        </div>
      )}

      {fout && (
        <div style={{ background: '#fff8e8', border: '1px solid #d4aa00', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontFamily: 'Arial', marginBottom: '16px', color: '#7a5a00' }}>
          ⚠️ API niet bereikbaar — demodata wordt getoond
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <StatKaart label="Raadsmededelingen" count={counts.rm} kleur="#4a1a5c" actief={filter === 'rm'} onClick={() => setFilter(filter === 'rm' ? 'alle' : 'rm')} />
        <StatKaart label="Technische vragen" count={counts.tq} kleur="#1a4a7a" actief={filter === 'tq'} onClick={() => setFilter(filter === 'tq' ? 'alle' : 'tq')} />
        <StatKaart label="Schriftelijke vragen" count={counts.sq} kleur="#5a1a8a" actief={filter === 'sq'} onClick={() => setFilter(filter === 'sq' ? 'alle' : 'sq')} />
        <StatKaart label="⚡ Openstaand GDP" count={counts.open_gdp} kleur="#c04000" actief={filter === 'open_gdp'} onClick={() => setFilter(filter === 'open_gdp' ? 'alle' : 'open_gdp')} />
        <StatKaart label="Totaal" count={alleDocs.length} kleur="#a89060" actief={filter === 'alle'} onClick={() => setFilter('alle')} />
      </div>

      {/* Zoekbalk */}
      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tekst-zacht)', fontSize: '14px' }}>🔍</span>
        <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoeken op titel, indiener of fractie..."
          style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' }} />
        {zoek && <button onClick={() => setZoek('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '16px' }}>×</button>}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '12px' }}>
        {gefilterd.length} document{gefilterd.length !== 1 ? 'en' : ''}{zoek ? ` gevonden voor "${zoek}"` : ''}
      </p>

      {/* Documenten lijst */}
      {laden ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>Documenten laden...
        </div>
      ) : gefilterd.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>Geen documenten gevonden
        </div>
      ) : gefilterd.map(doc => {
        const cfg = TYPE_CONFIG[doc.type] || TYPE_CONFIG.raadsmededelingen
        const isVraag = doc.type !== 'raadsmededelingen'
        return (
          <div key={doc.id} style={{ background: verversBezig ? '#fafaf8' : 'white', border: '1px solid var(--rand)', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'background 0.3s' }}>
            <span style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '4px', fontFamily: 'Arial', fontWeight: 'bold', background: cfg.bg, color: cfg.kleur, border: `1px solid ${cfg.rand}`, flexShrink: 0, marginTop: '2px' }}>
              {cfg.label}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {doc.url ? (
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontFamily: 'Arial', color: cfg.kleur, textDecoration: 'none', fontWeight: '500', lineHeight: 1.4, display: 'block' }}>
                  {doc.titel}
                </a>
              ) : (
                <span style={{ fontSize: '14px', fontFamily: 'Arial', color: 'var(--tekst)', fontWeight: '500' }}>{doc.titel}</span>
              )}
              <div style={{ display: 'flex', gap: '14px', marginTop: '5px', flexWrap: 'wrap', fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
                {doc.publicatiedatum && (
                  <span>📅 {formatDatumNL(doc.publicatiedatum)}</span>
                )}
                {isVraag && doc.indieners && <span>👤 {doc.indieners}</span>}
                {isVraag && doc.fracties && <span>🏛 {doc.fracties}</span>}
                {isVraag && doc.afgedaan && (
                  <span style={{ color: '#2d7a4f', fontWeight: '600' }}>
                    ✓ Afgedaan: {formatDatumNL(doc.afgedaan)}
                  </span>
                )}
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: cfg.kleur, textDecoration: 'underline' }}>
                    ↗ bekijk document
                  </a>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatKaart({ label, count, kleur, actief, onClick }: { label: string; count: number; kleur: string; actief: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: actief ? kleur : 'white', border: `1px solid ${actief ? kleur : 'var(--rand)'}`, borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', boxShadow: actief ? `0 2px 8px ${kleur}40` : 'none' }}>
      <div style={{ fontSize: '22px', fontWeight: '700', color: actief ? 'white' : kleur, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: '11px', color: actief ? 'rgba(255,255,255,0.8)' : 'var(--tekst-zacht)', fontFamily: 'Arial', marginTop: '2px' }}>{label}</div>
    </button>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{children}</span>
}

function Spinner({ kleur }: { kleur: string }) {
  return <span style={{ display: 'inline-block', width: '13px', height: '13px', border: `2px solid rgba(0,0,0,0.15)`, borderTopColor: kleur, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}
