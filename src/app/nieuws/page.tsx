'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { haalNieuws, syncNieuws, NieuwsArtikel, BRON_LABELS } from '../../lib/api'

type BronFilter = 'alle' | 'gooisemerennieuws' | 'nhgooi' | 'gooieneemlander' | 'gemeente_gooisemeren'

const BRON_KLEUREN: Record<string, { bg: string; kleur: string; rand: string }> = {
  gooisemerennieuws: { bg: '#e8f5ed', kleur: '#1a5c2a', rand: '#a8d8b5' },
  nhgooi:            { bg: '#e8f0f8', kleur: '#1a3a6a', rand: '#a0c0e0' },
  gooieneemlander:   { bg: '#fff8e8', kleur: '#7a5000', rand: '#e8c870' },
  gemeente_gooisemeren: { bg: '#f0e8f8', kleur: '#4a1a5c', rand: '#c0a0d8' },
}

function formatDatum(dt: string): string {
  try {
    return new Date(dt).toLocaleDateString('nl-NL', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  } catch { return dt }
}

export default function NieuwsPagina() {
  const [artikelen, setArtikelen] = useState<NieuwsArtikel[]>([])
  const [laden, setLaden] = useState(true)
  const [syncBezig, setSyncBezig] = useState(false)
  const [verversBezig, setVerversBezig] = useState(false)
  const [filter, setFilter] = useState<BronFilter>('alle')
  const [zoek, setZoek] = useState('')
  const [fout, setFout] = useState(false)
  const [syncResultaat, setSyncResultaat] = useState<'succes' | 'fout' | null>(null)

  const laad = useCallback(async (stil = false) => {
    if (!stil) setLaden(true)
    else setVerversBezig(true)
    setFout(false)
    const data = await haalNieuws()
    if (data.length === 0) setFout(true)
    setArtikelen(data)
    if (!stil) setLaden(false)
    else setVerversBezig(false)
  }, [])

  useEffect(() => { laad() }, [laad])

  const handleSync = async () => {
    setSyncBezig(true)
    setSyncResultaat(null)
    const ok = await syncNieuws()
    setSyncResultaat(ok ? 'succes' : 'fout')
    if (ok) await laad(true)
    setSyncBezig(false)
    setTimeout(() => setSyncResultaat(null), 5000)
  }

  const gefilterd = artikelen.filter(a => {
    const matchBron = filter === 'alle' || a.bron === filter
    const matchZoek = !zoek || a.titel.toLowerCase().includes(zoek.toLowerCase()) ||
      (a.intro || '').toLowerCase().includes(zoek.toLowerCase()) ||
      (a.categorie || '').toLowerCase().includes(zoek.toLowerCase())
    return matchBron && matchZoek
  })

  // Tellers per bron
  const tellers: Record<string, number> = {}
  artikelen.forEach(a => { tellers[a.bron] = (tellers[a.bron] || 0) + 1 })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>
            📰 Nieuws
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', margin: '2px 0 0', fontFamily: 'Arial' }}>
            Lokaal en regionaal nieuws — Gooise Meren
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => laad(true)} disabled={verversBezig || laden}
            style={{ background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '8px 16px', borderRadius: '8px', cursor: (verversBezig || laden) ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Arial', opacity: (verversBezig || laden) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {verversBezig ? '⏳ Laden...' : '↻ Ververs'}
          </button>
          <button onClick={handleSync} disabled={syncBezig}
            style={{ background: syncBezig ? '#d0c0e0' : 'var(--blauw)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: syncBezig ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {syncBezig ? '⏳ Nieuws ophalen...' : '↻ Nieuws verversen'}
          </button>
        </div>
      </div>

      <div style={{ height: '2px', background: 'linear-gradient(to right, var(--blauw), #a89060, transparent)', margin: '12px 0 16px' }} />

      {/* Sync resultaat */}
      {syncResultaat && (
        <div style={{ background: syncResultaat === 'succes' ? '#2d4a1a' : '#4a1a1a', color: 'white', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {syncResultaat === 'succes' ? '✓ Nieuws succesvol ververst' : '✗ Verversen mislukt — probeer opnieuw'}
          <button onClick={() => setSyncResultaat(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>
      )}

      {/* Bron filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <FilterKnop label={`Alle (${artikelen.length})`} actief={filter === 'alle'} kleur="var(--blauw)" onClick={() => setFilter('alle')} />
        {Object.entries(BRON_KLEUREN).map(([bron, kleuren]) => (
          <FilterKnop key={bron}
            label={`${BRON_LABELS[bron]} (${tellers[bron] || 0})`}
            actief={filter === bron}
            kleur={kleuren.kleur}
            bg={kleuren.bg}
            rand={kleuren.rand}
            onClick={() => setFilter(filter === bron ? 'alle' : bron as BronFilter)} />
        ))}
      </div>

      {/* Zoekbalk */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tekst-zacht)', fontSize: '14px' }}>🔍</span>
        <input value={zoek} onChange={e => setZoek(e.target.value)}
          placeholder="Zoeken in nieuws..."
          style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' as const }} />
        {zoek && <button onClick={() => setZoek('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '16px' }}>×</button>}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '12px' }}>
        {gefilterd.length} artikel{gefilterd.length !== 1 ? 'en' : ''}{zoek ? ` voor "${zoek}"` : ''}
      </p>

      {/* Artikelen */}
      {laden ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>Nieuws laden...
        </div>
      ) : fout ? (
        <div style={{ background: '#fff8e8', border: '1px solid #d4aa00', borderRadius: '8px', padding: '16px', fontSize: '13px', fontFamily: 'Arial', color: '#7a5a00', textAlign: 'center' }}>
          ⚠️ Nieuws kon niet worden geladen. De backend is mogelijk nog bezig.
          <button onClick={() => laad()} style={{ display: 'block', margin: '10px auto 0', background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial' }}>
            Opnieuw proberen
          </button>
        </div>
      ) : gefilterd.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>Geen artikelen gevonden
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {gefilterd.map(artikel => {
            const kleuren = BRON_KLEUREN[artikel.bron] || BRON_KLEUREN.nhgooi
            return (
              <a key={artikel.id} href={artikel.url} target="_blank" rel="noopener noreferrer"
                style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '10px', padding: '14px 16px', display: 'block', textDecoration: 'none', color: 'inherit', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.boxShadow = '0 3px 12px rgba(74,26,92,0.12)')}
                onMouseOut={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)')}>
                {/* Header rij */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontFamily: 'Arial', fontWeight: 'bold', background: kleuren.bg, color: kleuren.kleur, border: `1px solid ${kleuren.rand}`, flexShrink: 0 }}>
                    {BRON_LABELS[artikel.bron] || artikel.bron}
                  </span>
                  {artikel.categorie && (
                    <span style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', background: '#f5f5f5', padding: '2px 7px', borderRadius: '4px' }}>
                      {artikel.categorie}
                    </span>
                  )}
                  {artikel.is_betaald === 1 && (
                    <span title="Artikel achter betaalmuur" style={{ fontSize: '12px', flexShrink: 0 }}>🔒</span>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginLeft: 'auto', flexShrink: 0 }}>
                    {formatDatum(artikel.gepubliceerd)}
                  </span>
                </div>

                {/* Titel */}
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--blauw)', fontFamily: 'Arial', marginBottom: artikel.intro ? '6px' : '0', lineHeight: 1.4 }}>
                  {artikel.titel}
                </div>

                {/* Intro */}
                {artikel.intro && (
                  <div style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
                    {artikel.intro}
                  </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#aaa', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>↗ Lees verder</span>
                  {artikel.is_betaald === 1 && <span style={{ color: '#e8a000' }}>— betaald artikel</span>}
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterKnop({ label, actief, kleur, bg, rand, onClick }: {
  label: string; actief: boolean; kleur: string; bg?: string; rand?: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      background: actief ? (bg || kleur) : 'white',
      color: actief ? kleur : 'var(--tekst-zacht)',
      border: `1px solid ${actief ? (rand || kleur) : 'var(--rand)'}`,
      padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
      fontSize: '12px', fontFamily: 'Arial', fontWeight: actief ? '600' : 'normal',
      transition: 'all 0.15s',
    }}>
      {label}
    </button>
  )
}
