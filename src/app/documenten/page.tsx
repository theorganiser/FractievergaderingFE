'use client'

import { useState, useEffect, useCallback } from 'react'
import { ApiDocument } from '@/lib/types'
import { haalRaadsmededelingen, haalAfgedaaneVragen, startSyncEnWacht, SyncLogItem, DEMO_RM, DEMO_VRAGEN } from '@/lib/api'
import { formatDatumKort } from '@/lib/datum'
import { useAuth } from '@/hooks/useAuth'

type Filter = 'alle' | 'rm' | 'tq' | 'sq'

export default function DocumentenPagina() {
  const { isAdmin } = useAuth()
  const [rmDocs, setRmDocs] = useState<ApiDocument[]>([])
  const [vragenDocs, setVragenDocs] = useState<ApiDocument[]>([])
  const [laden, setLaden] = useState(true)
  const [syncBezig, setSyncBezig] = useState(false)
  const [syncResultaat, setSyncResultaat] = useState<SyncLogItem | null>(null)
  const [filter, setFilter] = useState<Filter>('alle')
  const [zoek, setZoek] = useState('')
  const [fout, setFout] = useState(false)

  const laadAlles = useCallback(async () => {
    setLaden(true)
    setFout(false)
    try {
      const [rm, vragen] = await Promise.all([
        haalRaadsmededelingen().catch(() => DEMO_RM),
        haalAfgedaaneVragen().catch(() => DEMO_VRAGEN),
      ])
      setRmDocs(rm.length > 0 ? rm : DEMO_RM)
      setVragenDocs(vragen.length > 0 ? vragen : DEMO_VRAGEN)
      if (rm.length === 0 && vragen.length === 0) setFout(true)
    } catch {
      setRmDocs(DEMO_RM)
      setVragenDocs(DEMO_VRAGEN)
      setFout(true)
    }
    setLaden(false)
  }, [])

  useEffect(() => { laadAlles() }, [laadAlles])

  const handleSync = async () => {
    setSyncBezig(true)
    setSyncResultaat(null)
    try {
      const log = await startSyncEnWacht()
      setSyncResultaat(log[0] || null)
      await laadAlles()
    } catch {
      setSyncResultaat(null)
    }
    setSyncBezig(false)
  }

  const alleDocs: ApiDocument[] = [
    ...rmDocs,
    ...vragenDocs,
  ]

  const gefilterd = alleDocs.filter(doc => {
    const matchFilter =
      filter === 'alle' ? true :
      filter === 'rm' ? doc.type === 'raadsmededelingen' :
      filter === 'tq' ? doc.type === 'technische_vragen' :
      filter === 'sq' ? doc.type === 'schriftelijke_vragen' : true
    const matchZoek = !zoek || doc.titel.toLowerCase().includes(zoek.toLowerCase()) ||
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
        {isAdmin && (
          <button onClick={handleSync} disabled={syncBezig} style={{
            background: syncBezig ? '#d0c0e0' : 'var(--blauw)',
            color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px',
            cursor: syncBezig ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Arial',
            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600',
          }}>
            {syncBezig ? <><Spinner /> Documenten ophalen...</> : <>↻ Documenten verversen</>}
          </button>
        )}
      </div>

      <div style={{ height: '2px', background: 'linear-gradient(to right, var(--blauw), #a89060, transparent)', margin: '12px 0 20px' }} />

      {/* Sync resultaat */}
      {syncResultaat && (
        <div style={{ background: '#2d4a1a', color: 'white', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontFamily: 'Arial', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>✓ Sync geslaagd</span>
          {syncResultaat.nieuw !== undefined && <Pill>{syncResultaat.nieuw} nieuw</Pill>}
          {syncResultaat.bijgewerkt !== undefined && <Pill>{syncResultaat.bijgewerkt} bijgewerkt</Pill>}
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
        <StatKaart label="Totaal" count={alleDocs.length} kleur="#a89060" actief={filter === 'alle'} onClick={() => setFilter('alle')} />
      </div>

      {/* Zoekbalk */}
      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tekst-zacht)', fontSize: '14px' }}>🔍</span>
        <input
          value={zoek}
          onChange={e => setZoek(e.target.value)}
          placeholder="Zoeken op titel, indiener of fractie..."
          style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' }}
        />
        {zoek && <button onClick={() => setZoek('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '16px' }}>×</button>}
      </div>

      {/* Resultaattelling */}
      <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '12px' }}>
        {gefilterd.length} document{gefilterd.length !== 1 ? 'en' : ''} {zoek ? `gevonden voor "${zoek}"` : ''}
      </p>

      {/* Documenten lijst */}
      {laden ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
          Documenten laden...
        </div>
      ) : gefilterd.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
          Geen documenten gevonden
        </div>
      ) : (
        gefilterd.map(doc => {
          const cfg = TYPE_CONFIG[doc.type] || TYPE_CONFIG.raadsmededelingen
          const isVraag = doc.type !== 'raadsmededelingen'
          return (
            <div key={doc.id} style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}>
              <span style={{ fontSize: '10px', padding: '3px 7px', borderRadius: '4px', fontFamily: 'Arial', fontWeight: 'bold', background: cfg.bg, color: cfg.kleur, border: `1px solid ${cfg.rand}`, flexShrink: 0, marginTop: '2px' }}>
                {cfg.label}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontFamily: 'Arial', color: cfg.kleur, textDecoration: 'none', fontWeight: '500', lineHeight: 1.4 }}>
                        {doc.titel}
                      </a>
                    ) : (
                      <span style={{ fontSize: '14px', fontFamily: 'Arial', color: 'var(--tekst)', fontWeight: '500' }}>{doc.titel}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '14px', marginTop: '5px', flexWrap: 'wrap', fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
                  {doc.publicatiedatum && (
                    <span>📅 {formatDatumKort(doc.publicatiedatum)}</span>
                  )}
                  {isVraag && doc.indieners && <span>👤 {doc.indieners}</span>}
                  {isVraag && doc.fracties && <span>🏛 {doc.fracties}</span>}
                  {isVraag && doc.afgedaan && (
                    <span style={{ color: '#2d7a4f', fontWeight: '600' }}>
                      ✓ Afgedaan: {formatDatumKort(doc.afgedaan)}
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
        })
      )}
    </div>
  )
}

function StatKaart({ label, count, kleur, actief, onClick }: { label: string; count: number; kleur: string; actief: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: actief ? kleur : 'white',
      border: `1px solid ${actief ? kleur : 'var(--rand)'}`,
      borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', textAlign: 'left',
      transition: 'all 0.15s', boxShadow: actief ? `0 2px 8px ${kleur}40` : 'none',
    }}>
      <div style={{ fontSize: '22px', fontWeight: '700', color: actief ? 'white' : kleur, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: '11px', color: actief ? 'rgba(255,255,255,0.8)' : 'var(--tekst-zacht)', fontFamily: 'Arial', marginTop: '2px' }}>{label}</div>
    </button>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{children}</span>
}

function Spinner() {
  return <span style={{ display: 'inline-block', width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
}
