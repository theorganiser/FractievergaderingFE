'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { haalPortefeuilles, Portefeuille } from '@/lib/portefeuilles'

interface Treffer { onderwerp: string; woordvoerders: string[] }
interface AiResultaat { gevonden: boolean; treffers: Treffer[]; toelichting: string }

export default function PortefeuillesPagina() {
  const [items, setItems] = useState<Portefeuille[]>([])
  const [geladen, setGeladen] = useState(false)
  const [filter, setFilter] = useState('')

  const [vraag, setVraag] = useState('')
  const [aiBezig, setAiBezig] = useState(false)
  const [aiResultaat, setAiResultaat] = useState<AiResultaat | null>(null)
  const [aiFout, setAiFout] = useState('')

  useEffect(() => {
    haalPortefeuilles().then(data => { setItems(data); setGeladen(true) })
  }, [])

  const handleAiZoek = async () => {
    if (!vraag.trim() || aiBezig) return
    setAiBezig(true)
    setAiFout('')
    setAiResultaat(null)
    try {
      const res = await fetch('/api/portefeuille-zoek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vraag }),
      })
      const data = await res.json()
      if (data.fout) setAiFout(data.fout)
      else setAiResultaat(data)
    } catch {
      setAiFout('Er ging iets mis bij het zoeken.')
    }
    setAiBezig(false)
  }

  const zoekTerm = filter.trim().toLowerCase()
  const zichtbareItems = !zoekTerm ? items : items.filter(p =>
    p.onderwerp.toLowerCase().includes(zoekTerm) ||
    p.programma.toLowerCase().includes(zoekTerm) ||
    [p.woordvoerder_1, p.woordvoerder_2, p.woordvoerder_3].some(w => w.toLowerCase().includes(zoekTerm))
  )

  if (!geladen) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
      ⏳ Portefeuilleverdeling laden...
    </div>
  )

  return (
    <div>
      <div>
        <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>🗂 Portefeuilleverdeling</h1>
        <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', margin: '2px 0 0', fontFamily: 'Arial' }}>
          Goois Democratisch Platform — Gooise Meren. Wijzigen kan alleen via de database, niet in deze app.
        </p>
      </div>

      <div style={{ height: '2px', background: 'linear-gradient(to right, var(--blauw), #a89060, transparent)', margin: '12px 0 20px' }} />

      {/* AI-zoeken */}
      <div style={{ background: '#f5eeff', border: '1px solid #c0a0d8', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '14px', color: '#4a1a5c', fontFamily: 'Arial', fontWeight: '700', margin: '0 0 10px' }}>
          🔎 Vraag het aan de AI
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', margin: '0 0 12px' }}>
          Beschrijf waar het over gaat, bijvoorbeeld &ldquo;fietspaden&rdquo; of &ldquo;er komt een vraag over daklozenopvang&rdquo; — de AI zoekt de bijbehorende woordvoerder(s) op.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            style={{ flex: 1, minWidth: '220px', padding: '9px 12px', border: '1px solid #c0a0d8', borderRadius: '7px', fontSize: '13px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' as const }}
            placeholder="Waar gaat het over?"
            value={vraag}
            onChange={e => setVraag(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAiZoek()}
          />
          <button onClick={handleAiZoek} disabled={!vraag.trim() || aiBezig}
            style={{ background: '#4a1a5c', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600', opacity: (!vraag.trim() || aiBezig) ? 0.5 : 1, whiteSpace: 'nowrap' as const }}>
            {aiBezig ? '⏳ Zoeken...' : '🔎 Zoeken'}
          </button>
        </div>

        {aiFout && (
          <p style={{ fontSize: '13px', color: 'var(--rood)', fontFamily: 'Arial', marginTop: '12px' }}>⚠️ {aiFout}</p>
        )}

        {aiResultaat && (
          <div style={{ marginTop: '14px', background: 'white', border: '1px solid #c0a0d8', borderRadius: '8px', padding: '14px 16px' }}>
            {!aiResultaat.gevonden ? (
              <p style={{ fontSize: '13px', fontFamily: 'Arial', color: 'var(--tekst)', margin: 0 }}>
                Geen passend onderwerp gevonden. {aiResultaat.toelichting}
              </p>
            ) : (
              <>
                {aiResultaat.treffers.map((t, i) => (
                  <div key={i} style={{ marginBottom: i < aiResultaat.treffers.length - 1 ? '10px' : 0, paddingBottom: i < aiResultaat.treffers.length - 1 ? '10px' : 0, borderBottom: i < aiResultaat.treffers.length - 1 ? '1px solid #f0ede8' : 'none' }}>
                    <div style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: '700', color: 'var(--blauw)' }}>{t.onderwerp}</div>
                    <div style={{ fontSize: '13px', fontFamily: 'Arial', color: 'var(--tekst)', marginTop: '2px' }}>
                      👤 {t.woordvoerders.join(', ')}
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst-zacht)', fontStyle: 'italic', marginTop: '10px', marginBottom: 0 }}>
                  {aiResultaat.toelichting}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tekstfilter */}
      <input
        style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '13px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '16px' }}
        placeholder="Filter op onderwerp, programma of naam..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />

      {/* Tabel */}
      <div style={{ border: '1px solid var(--rand)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: '#f0ede8', padding: '10px 16px', gap: '12px' }}>
          <span style={{ flex: 1, fontSize: '11px', fontFamily: 'Arial', fontWeight: '700', color: 'var(--tekst-zacht)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Onderwerp</span>
          <span style={{ width: '70px', flexShrink: 0, fontSize: '11px', fontFamily: 'Arial', fontWeight: '700', color: 'var(--tekst-zacht)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>Progr.</span>
          <span style={{ width: '110px', flexShrink: 0, fontSize: '11px', fontFamily: 'Arial', fontWeight: '700', color: 'var(--tekst-zacht)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1e</span>
          <span style={{ width: '110px', flexShrink: 0, fontSize: '11px', fontFamily: 'Arial', fontWeight: '700', color: 'var(--tekst-zacht)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2e</span>
          <span style={{ width: '110px', flexShrink: 0, fontSize: '11px', fontFamily: 'Arial', fontWeight: '700', color: 'var(--tekst-zacht)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3e</span>
        </div>
        {zichtbareItems.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontSize: '13px' }}>
            Geen onderwerpen gevonden.
          </div>
        ) : zichtbareItems.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 16px', background: 'white', borderTop: i > 0 ? '1px solid #f0ede8' : 'none' }}>
            <span style={{ flex: 1, fontSize: '13px', fontFamily: 'Arial', color: 'var(--tekst)' }}>{p.onderwerp}</span>
            <span style={{ width: '70px', flexShrink: 0, fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst-zacht)', textAlign: 'center' }}>{p.programma || '—'}</span>
            <span style={{ width: '110px', flexShrink: 0, fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst)' }}>{p.woordvoerder_1 || '—'}</span>
            <span style={{ width: '110px', flexShrink: 0, fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst)' }}>{p.woordvoerder_2 || '—'}</span>
            <span style={{ width: '110px', flexShrink: 0, fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst)' }}>{p.woordvoerder_3 || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
