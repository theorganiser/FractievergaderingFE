'use client'

import { useState, useEffect } from 'react'
import { ApiDocument } from '@/lib/types'
import { haalRaadsmededelingen, haalAfgedaaneVragen, DEMO_RM, DEMO_VRAGEN } from '@/lib/api'
import { formatDatumKort } from '@/lib/datum'

interface DocumentenSelectorProps {
  onVoegRMToe: (docs: ApiDocument[]) => void
  onVoegVragenToe: (docs: ApiDocument[]) => void
}

export default function DocumentenSelector({ onVoegRMToe, onVoegVragenToe }: DocumentenSelectorProps) {
  const [actief, setActief] = useState<'rm' | 'vragen'>('rm')
  const [rmDocs, setRmDocs] = useState<ApiDocument[]>([])
  const [vragenDocs, setVragenDocs] = useState<ApiDocument[]>([])
  const [ladenRM, setLadenRM] = useState(false)
  const [ladenVragen, setLadenVragen] = useState(false)
  const [geselecteerdRM, setGeselecteerdRM] = useState<Set<string>>(new Set())
  const [geselecteerdVragen, setGeselecteerdVragen] = useState<Set<string>>(new Set())
  const [foutRM, setFoutRM] = useState(false)
  const [foutVragen, setFoutVragen] = useState(false)

  const laadRM = async () => {
    setLadenRM(true)
    setFoutRM(false)
    try {
      const docs = await haalRaadsmededelingen()
      setRmDocs(docs.length > 0 ? docs : DEMO_RM)
      if (docs.length === 0) setFoutRM(true)
    } catch {
      setRmDocs(DEMO_RM)
      setFoutRM(true)
    }
    setLadenRM(false)
  }

  const laadVragen = async () => {
    setLadenVragen(true)
    setFoutVragen(false)
    try {
      const docs = await haalAfgedaaneVragen()
      setVragenDocs(docs.length > 0 ? docs : DEMO_VRAGEN)
      if (docs.length === 0) setFoutVragen(true)
    } catch {
      setVragenDocs(DEMO_VRAGEN)
      setFoutVragen(true)
    }
    setLadenVragen(false)
  }

  useEffect(() => { laadRM() }, [])
  useEffect(() => { if (actief === 'vragen' && vragenDocs.length === 0) laadVragen() }, [actief])

  const toggleRM = (id: string) => setGeselecteerdRM(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleVraag = (id: string) => setGeselecteerdVragen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleVoegRMToe = () => {
    onVoegRMToe(rmDocs.filter(d => geselecteerdRM.has(d.id)))
    setGeselecteerdRM(new Set())
  }
  const handleVoegVragenToe = () => {
    onVoegVragenToe(vragenDocs.filter(d => geselecteerdVragen.has(d.id)))
    setGeselecteerdVragen(new Set())
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <TabKnop actief={actief === 'rm'} onClick={() => setActief('rm')} kleur="#4a1a5c">
          📋 Raadsmededelingen {rmDocs.length > 0 && `(${rmDocs.length})`}
        </TabKnop>
        <TabKnop actief={actief === 'vragen'} onClick={() => setActief('vragen')} kleur="#5a3a8a">
          ❓ Technische & schriftelijke vragen {vragenDocs.length > 0 && `(${vragenDocs.length})`}
        </TabKnop>
      </div>

      {/* Raadsmededelingen */}
      {actief === 'rm' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', margin: 0 }}>
              {foutRM ? '⚠️ Demodata — API niet bereikbaar' : `${rmDocs.length} raadsmededelingen, nieuwste eerst`}
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setGeselecteerdRM(new Set(rmDocs.map(d => d.id)))} style={knopStijl}>Alles</button>
              <button onClick={() => setGeselecteerdRM(new Set())} style={knopStijl}>Niets</button>
              <button onClick={laadRM} disabled={ladenRM} style={knopStijl}>{ladenRM ? '↻' : '↻ Vernieuwen'}</button>
            </div>
          </div>

          {ladenRM ? <Laden /> : rmDocs.map(doc => {
            const sel = geselecteerdRM.has(doc.id)
            return (
              <div key={doc.id} onClick={() => toggleRM(doc.id)} style={{ ...docKaart, borderColor: sel ? '#4a1a5c' : 'var(--rand)', background: sel ? '#f5eeff' : 'white' }}>
                <input type="checkbox" checked={sel} onChange={() => toggleRM(doc.id)} onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontFamily: 'Arial', color: sel ? '#4a1a5c' : 'var(--tekst)', fontWeight: sel ? '600' : 'normal' }}>
                    {doc.titel}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginTop: '3px', display: 'flex', gap: '10px' }}>
                    {doc.publicatiedatum && <span>📅 {formatDatumKort(doc.publicatiedatum)}</span>}
                    {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#4a1a5c', textDecoration: 'underline' }}>↗ bekijk</a>}
                  </div>
                </div>
              </div>
            )
          })}

          {geselecteerdRM.size > 0 && (
            <button onClick={handleVoegRMToe} style={toevoegKnop('#4a1a5c')}>
              + {geselecteerdRM.size} raadsmededeling(en) toevoegen aan agenda
            </button>
          )}
        </div>
      )}

      {/* Vragen */}
      {actief === 'vragen' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', margin: 0 }}>
              {foutVragen ? '⚠️ Demodata — API niet bereikbaar' : `${vragenDocs.length} beantwoorde vragen, nieuwste eerst`}
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setGeselecteerdVragen(new Set(vragenDocs.map(d => d.id)))} style={knopStijl}>Alles</button>
              <button onClick={() => setGeselecteerdVragen(new Set())} style={knopStijl}>Niets</button>
              <button onClick={laadVragen} disabled={ladenVragen} style={knopStijl}>{ladenVragen ? '↻' : '↻ Vernieuwen'}</button>
            </div>
          </div>

          {ladenVragen ? <Laden /> : vragenDocs.map(doc => {
            const sel = geselecteerdVragen.has(doc.id)
            const isTQ = doc.type === 'technische_vragen'
            return (
              <div key={doc.id} onClick={() => toggleVraag(doc.id)} style={{ ...docKaart, borderColor: sel ? '#5a3a8a' : 'var(--rand)', background: sel ? '#f0eef8' : 'white' }}>
                <input type="checkbox" checked={sel} onChange={() => toggleVraag(doc.id)} onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', fontFamily: 'Arial', whiteSpace: 'nowrap', flexShrink: 0, background: isTQ ? '#e8f0f8' : '#f0e8f8', color: isTQ ? '#1a4a7a' : '#5a1a8a', border: `1px solid ${isTQ ? '#a0c0e0' : '#c0a0e0'}` }}>
                  {isTQ ? 'TQ' : 'SQ'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontFamily: 'Arial', color: sel ? '#5a3a8a' : 'var(--tekst)', fontWeight: sel ? '600' : 'normal' }}>
                    {doc.titel}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginTop: '3px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {doc.indieners && <span>👤 {doc.indieners}</span>}
                    {doc.fracties && <span>🏛 {doc.fracties}</span>}
                    {doc.afgedaan && <span style={{ color: '#2d7a4f', fontWeight: '600' }}>✓ Afgedaan: {formatDatumKort(doc.afgedaan)}</span>}
                    {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#5a3a8a', textDecoration: 'underline' }}>↗ bekijk</a>}
                  </div>
                </div>
              </div>
            )
          })}

          {geselecteerdVragen.size > 0 && (
            <button onClick={handleVoegVragenToe} style={toevoegKnop('#5a3a8a')}>
              + {geselecteerdVragen.size} vraag/vragen toevoegen aan agenda
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Laden() {
  return (
    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
      Documenten ophalen...
    </div>
  )
}

function TabKnop({ actief, onClick, kleur, children }: { actief: boolean; onClick: () => void; kleur: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial',
      background: actief ? kleur : 'white',
      color: actief ? 'white' : kleur,
      border: `1px solid ${kleur}`,
      fontWeight: actief ? '600' : 'normal',
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  )
}

const docKaart: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: '10px',
  padding: '10px 12px', border: '1px solid', borderRadius: '8px',
  marginBottom: '6px', cursor: 'pointer', transition: 'all 0.15s',
}

const knopStijl: React.CSSProperties = {
  background: 'white', color: 'var(--tekst-zacht)', border: '1px solid var(--rand)',
  padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial',
}

const toevoegKnop = (kleur: string): React.CSSProperties => ({
  marginTop: '12px', width: '100%', background: kleur, color: 'white', border: 'none',
  padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600',
})
