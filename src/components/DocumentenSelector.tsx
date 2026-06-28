'use client'

import { useState, useEffect } from 'react'
import { ApiDocument } from '@/lib/types'
import { haalRaadsmededelingen, haalAfgedaaneVragen, DEMO_RM, DEMO_VRAGEN } from '@/lib/api'
import { formatDatumNL } from '@/lib/datum'

interface DocumentenSelectorProps {
  onVoegRMToe: (docs: ApiDocument[]) => void
  onVoegVragenToe: (docs: ApiDocument[]) => void
}

type ActiefTab = 'rm' | 'tq' | 'sq'

export default function DocumentenSelector({ onVoegRMToe, onVoegVragenToe }: DocumentenSelectorProps) {
  const [actief, setActief] = useState<ActiefTab>('rm')
  const [rmDocs, setRmDocs] = useState<ApiDocument[]>([])
  const [vragenDocs, setVragenDocs] = useState<ApiDocument[]>([])
  const [ladenRM, setLadenRM] = useState(false)
  const [ladenVragen, setLadenVragen] = useState(false)
  const [geselecteerdRM, setGeselecteerdRM] = useState<Set<string>>(new Set())
  const [geselecteerdTQ, setGeselecteerdTQ] = useState<Set<string>>(new Set())
  const [geselecteerdSQ, setGeselecteerdSQ] = useState<Set<string>>(new Set())
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
  useEffect(() => {
    if ((actief === 'tq' || actief === 'sq') && vragenDocs.length === 0) laadVragen()
  }, [actief])

  const tqDocs = vragenDocs.filter(d => d.type === 'technische_vragen')
  const sqDocs = vragenDocs.filter(d => d.type === 'schriftelijke_vragen')

  const toggleRM = (id: string) => setGeselecteerdRM(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleTQ = (id: string) => setGeselecteerdTQ(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSQ = (id: string) => setGeselecteerdSQ(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleVoegRMToe = () => {
    onVoegRMToe(rmDocs.filter(d => geselecteerdRM.has(d.id)))
    setGeselecteerdRM(new Set())
  }
  const handleVoegTQToe = () => {
    onVoegVragenToe(tqDocs.filter(d => geselecteerdTQ.has(d.id)))
    setGeselecteerdTQ(new Set())
  }
  const handleVoegSQToe = () => {
    onVoegVragenToe(sqDocs.filter(d => geselecteerdSQ.has(d.id)))
    setGeselecteerdSQ(new Set())
  }

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <TabKnop actief={actief === 'rm'} onClick={() => setActief('rm')} kleur="#4a1a5c">
          📋 Raadsmededelingen {rmDocs.length > 0 && `(${rmDocs.length})`}
        </TabKnop>
        <TabKnop actief={actief === 'tq'} onClick={() => setActief('tq')} kleur="#1a4a7a">
          ❓ Technische vragen {tqDocs.length > 0 && `(${tqDocs.length})`}
        </TabKnop>
        <TabKnop actief={actief === 'sq'} onClick={() => setActief('sq')} kleur="#5a1a8a">
          ✉️ Schriftelijke vragen {sqDocs.length > 0 && `(${sqDocs.length})`}
        </TabKnop>
      </div>

      {/* Raadsmededelingen */}
      {actief === 'rm' && (
        <DocLijst
          docs={rmDocs}
          laden={ladenRM}
          fout={foutRM}
          foutTekst="Demodata — API niet bereikbaar"
          aantalTekst={`${rmDocs.length} raadsmededelingen, nieuwste eerst`}
          geselecteerd={geselecteerdRM}
          onToggle={toggleRM}
          onSelecteerAlles={() => setGeselecteerdRM(new Set(rmDocs.map(d => d.id)))}
          onSelecteerNiets={() => setGeselecteerdRM(new Set())}
          onVernieuw={laadRM}
          kleur="#4a1a5c"
          onVoegToe={handleVoegRMToe}
          toevoegLabel="raadsmededeling(en)"
        />
      )}

      {/* Technische vragen */}
      {actief === 'tq' && (
        <DocLijst
          docs={tqDocs}
          laden={ladenVragen}
          fout={foutVragen}
          foutTekst="Demodata — API niet bereikbaar"
          aantalTekst={`${tqDocs.length} technische vragen, nieuwste eerst`}
          geselecteerd={geselecteerdTQ}
          onToggle={toggleTQ}
          onSelecteerAlles={() => setGeselecteerdTQ(new Set(tqDocs.map(d => d.id)))}
          onSelecteerNiets={() => setGeselecteerdTQ(new Set())}
          onVernieuw={laadVragen}
          kleur="#1a4a7a"
          onVoegToe={handleVoegTQToe}
          toevoegLabel="technische vraag/vragen"
          toonVraagDetails
        />
      )}

      {/* Schriftelijke vragen */}
      {actief === 'sq' && (
        <DocLijst
          docs={sqDocs}
          laden={ladenVragen}
          fout={foutVragen}
          foutTekst="Demodata — API niet bereikbaar"
          aantalTekst={`${sqDocs.length} schriftelijke vragen, nieuwste eerst`}
          geselecteerd={geselecteerdSQ}
          onToggle={toggleSQ}
          onSelecteerAlles={() => setGeselecteerdSQ(new Set(sqDocs.map(d => d.id)))}
          onSelecteerNiets={() => setGeselecteerdSQ(new Set())}
          onVernieuw={laadVragen}
          kleur="#5a1a8a"
          onVoegToe={handleVoegSQToe}
          toevoegLabel="schriftelijke vraag/vragen"
          toonVraagDetails
        />
      )}
    </div>
  )
}

function DocLijst({
  docs, laden, fout, foutTekst, aantalTekst, geselecteerd, onToggle,
  onSelecteerAlles, onSelecteerNiets, onVernieuw, kleur, onVoegToe, toevoegLabel, toonVraagDetails,
}: {
  docs: ApiDocument[]
  laden: boolean
  fout: boolean
  foutTekst: string
  aantalTekst: string
  geselecteerd: Set<string>
  onToggle: (id: string) => void
  onSelecteerAlles: () => void
  onSelecteerNiets: () => void
  onVernieuw: () => void
  kleur: string
  onVoegToe: () => void
  toevoegLabel: string
  toonVraagDetails?: boolean
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', margin: 0 }}>
          {fout ? `⚠️ ${foutTekst}` : aantalTekst}
        </p>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={onSelecteerAlles} style={knopStijl}>Alles</button>
          <button onClick={onSelecteerNiets} style={knopStijl}>Niets</button>
          <button onClick={onVernieuw} disabled={laden} style={knopStijl}>{laden ? '↻' : '↻ Vernieuwen'}</button>
        </div>
      </div>

      {laden ? <Laden /> : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontSize: '13px', fontStyle: 'italic' }}>
          Geen documenten gevonden.
        </div>
      ) : docs.map(doc => {
        const sel = geselecteerd.has(doc.id)
        return (
          <div key={doc.id} onClick={() => onToggle(doc.id)} style={{ ...docKaart, borderColor: sel ? kleur : 'var(--rand)', background: sel ? `${kleur}10` : 'white' }}>
            <input type="checkbox" checked={sel} onChange={() => onToggle(doc.id)} onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontFamily: 'Arial', color: sel ? kleur : 'var(--tekst)', fontWeight: sel ? '600' : 'normal' }}>
                {doc.titel}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginTop: '3px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {doc.publicatiedatum && !toonVraagDetails && <span>📅 {formatDatumNL(doc.publicatiedatum)}</span>}
                {toonVraagDetails && doc.indieners && <span>👤 {doc.indieners}</span>}
                {toonVraagDetails && doc.fracties && <span>🏛 {doc.fracties}</span>}
                {toonVraagDetails && doc.afgedaan && <span style={{ color: '#2d7a4f', fontWeight: '600' }}>✓ Afgedaan: {formatDatumNL(doc.afgedaan)}</span>}
                {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: kleur, textDecoration: 'underline' }}>↗ bekijk</a>}
              </div>
            </div>
          </div>
        )
      })}

      {geselecteerd.size > 0 && (
        <button onClick={onVoegToe} style={toevoegKnop(kleur)}>
          + {geselecteerd.size} {toevoegLabel} toevoegen aan agenda
        </button>
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
