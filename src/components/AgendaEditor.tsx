'use client'

import { useState, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Agendapunt, Subpunt } from '@/lib/types'
import IngekomenStukkenInvoer from './IngekomentukkenInvoer'

interface AgendaEditorProps {
  vergaderingId: string
  punten: Agendapunt[]
  onUpdatePunt: (puntIndex: number, wijzigingen: Partial<Agendapunt>) => void
  onVerwijderPunt: (puntIndex: number) => void
  onVoegPuntToe: () => void
  onVoegSubpuntToe: (puntIndex: number) => void
  onVerwijderSubpunt: (puntIndex: number, subIndex: number) => void
  onUpdateSubpunt: (puntIndex: number, subIndex: number, wijzigingen: Partial<Subpunt>) => void
  onSyncDocumenten: () => void
  ladenSync: boolean
  onHerorden: (nieuweVolgorde: Agendapunt[]) => void
}

type NieuwPuntType = 'algemeen' | 'politieke_avond' | 'raadsvergadering'

export default function AgendaEditor({
  punten, onUpdatePunt, onVerwijderPunt, onVoegPuntToe,
  onVoegSubpuntToe, onVerwijderSubpunt, onUpdateSubpunt,
  onSyncDocumenten, ladenSync, onHerorden,
}: AgendaEditorProps) {
  const [toonTypeKiezer, setToonTypeKiezer] = useState(false)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { source, destination } = result
    if (source.index === destination.index) return
    const nieuw = Array.from(punten)
    const [verplaatst] = nieuw.splice(source.index, 1)
    nieuw.splice(destination.index, 0, verplaatst)
    nieuw.forEach((p, i) => { p.id = i + 1 })
    onHerorden(nieuw)
  }

  const voegNieuwPuntToe = (type: NieuwPuntType) => {
    setToonTypeKiezer(false)
    if (type === 'algemeen') {
      onVoegPuntToe()
      return
    }
    // Voor PA en RV: voeg een speciaal punt toe via onHerorden
    const nieuwPunt: Agendapunt = {
      id: punten.length + 1,
      titel: type === 'politieke_avond' ? 'Politieke Avond' : 'Raadsvergadering',
      toelichting: '',
      subpunten: [],
      puntType: type,
      rvDatum: '',
    }
    const nieuwePunten = [...punten, nieuwPunt]
    nieuwePunten.forEach((p, i) => { p.id = i + 1 })
    onHerorden(nieuwePunten)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Dropdown voor nieuw punt type */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setToonTypeKiezer(!toonTypeKiezer)} style={btnOutline}>
            + Agendapunt ▾
          </button>
          {toonTypeKiezer && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 50, marginTop: '4px', background: 'white', border: '1px solid var(--rand)', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '200px', overflow: 'hidden' }}>
              <button onClick={() => voegNieuwPuntToe('algemeen')} style={ddItem}>
                📌 Algemeen punt
              </button>
              <button onClick={() => voegNieuwPuntToe('politieke_avond')} style={ddItem}>
                🏛 Politieke Avond
              </button>
              <button onClick={() => voegNieuwPuntToe('raadsvergadering')} style={ddItem}>
                ⚖️ Raadsvergadering
              </button>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onSyncDocumenten} disabled={ladenSync} style={btnAccent}>
          {ladenSync ? '⏳ Bezig...' : '📋 Documenten selecteren'}
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="agenda-punten">
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps}
              style={{ background: snapshot.isDraggingOver ? '#f5eeff' : 'transparent', borderRadius: '8px', transition: 'background 0.2s' }}>
              {punten.map((punt, pi) => (
                <Draggable key={`punt-${pi}`} draggableId={`punt-${pi}`} index={pi}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps}
                      style={{ ...provided.draggableProps.style, marginBottom: '8px', boxShadow: snapshot.isDragging ? '0 8px 24px rgba(74,26,92,0.2)' : 'none', borderRadius: '8px' }}>
                      <PuntEditor
                        punt={punt} puntIndex={pi}
                        dragHandleProps={provided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                        onUpdate={(w) => onUpdatePunt(pi, w)}
                        onVerwijder={() => onVerwijderPunt(pi)}
                        onVoegSubToe={() => onVoegSubpuntToe(pi)}
                        onVerwijderSub={(si) => onVerwijderSubpunt(pi, si)}
                        onUpdateSub={(si, w) => onUpdateSubpunt(pi, si, w)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setToonTypeKiezer(!toonTypeKiezer)} style={btnOutline}>
            + Agendapunt ▾
          </button>
          {toonTypeKiezer && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, zIndex: 50, marginBottom: '4px', background: 'white', border: '1px solid var(--rand)', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '200px', overflow: 'hidden' }}>
              <button onClick={() => voegNieuwPuntToe('algemeen')} style={ddItem}>📌 Algemeen punt</button>
              <button onClick={() => voegNieuwPuntToe('politieke_avond')} style={ddItem}>🏛 Politieke Avond</button>
              <button onClick={() => voegNieuwPuntToe('raadsvergadering')} style={ddItem}>⚖️ Raadsvergadering</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .invoer-inline { width: 100%; padding: 5px 8px; border: 1px solid var(--rand); border-radius: 6px; font-size: 13px; font-family: Arial, sans-serif; background: white; color: var(--tekst); outline: none; }
        .invoer-inline:focus { border-color: var(--blauw); box-shadow: 0 0 0 2px rgba(74,26,92,0.12); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

interface PuntEditorProps {
  punt: Agendapunt; puntIndex: number
  dragHandleProps: object | null | undefined; isDragging: boolean
  onUpdate: (w: Partial<Agendapunt>) => void; onVerwijder: () => void
  onVoegSubToe: () => void; onVerwijderSub: (si: number) => void
  onUpdateSub: (si: number, w: Partial<Subpunt>) => void
}

function PuntEditor({ punt, dragHandleProps, isDragging, onUpdate, onVerwijder, onVoegSubToe, onVerwijderSub, onUpdateSub }: PuntEditorProps) {
  const [ingeklapt, setIngeklapt] = useState(false)
  const isIngekomen = punt.titel.toLowerCase().includes('ingekomen')
  const isMededelingen = punt.titel.toLowerCase().includes('mededeling')
  const isPA = punt.puntType === 'politieke_avond'
  const isRV = punt.puntType === 'raadsvergadering'

  const typeKleur = isPA ? '#1a5c8a' : isRV ? '#5a1a8a' : 'var(--blauw)'
  const typeBg = isPA ? '#e8f0f8' : isRV ? '#f0e8f8' : 'var(--blauw-licht)'
  const typeLabel = isPA ? '🏛 PA' : isRV ? '⚖️ RV' : null

  return (
    <div style={{ border: `1px solid ${isDragging ? '#4a1a5c' : 'var(--rand)'}`, borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
      {/* Header */}
      <div style={{ background: isDragging ? '#f5eeff' : typeBg, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div {...(dragHandleProps as object)} style={{ cursor: 'grab', color: '#9a7aaa', fontSize: '16px', padding: '0 4px', flexShrink: 0 }} title="Sleep om te herordenen">⠿</div>
        <span style={{ fontSize: '13px', color: typeKleur, fontFamily: 'Arial', fontWeight: 'bold', minWidth: '24px', flexShrink: 0 }}>{punt.id}.</span>
        {typeLabel && <span style={{ fontSize: '10px', background: 'white', border: `1px solid ${typeKleur}`, color: typeKleur, padding: '1px 6px', borderRadius: '3px', flexShrink: 0 }}>{typeLabel}</span>}
        <input className="invoer-inline" style={{ fontWeight: 'bold', color: typeKleur, borderColor: 'rgba(74,26,92,0.25)', flex: 1 }}
          value={punt.titel} onChange={e => onUpdate({ titel: e.target.value })} />
        <button onClick={() => setIngeklapt(!ingeklapt)} style={iconKnop} title={ingeklapt ? 'Uitklappen' : 'Inklappen'}>
          {ingeklapt ? '▸' : '▾'}
        </button>
        {!isRV && !isPA && (
          <button onClick={onVoegSubToe} style={{ ...iconKnop, fontSize: '12px', padding: '3px 10px', border: '1px solid var(--blauw)', borderRadius: '5px', color: 'var(--blauw)' }}>
            + Sub
          </button>
        )}
        <button onClick={onVerwijder} style={{ ...iconKnop, color: 'var(--rood)' }} title="Verwijder punt">✕</button>
      </div>

      {!ingeklapt && (
        <>
          {/* Toelichting + URL */}
          {!isRV && !isPA && (
            <div style={{ padding: '6px 14px', background: '#fafaf8', borderBottom: '1px solid var(--rand)', display: 'flex', gap: '8px' }}>
              <input className="invoer-inline" style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--tekst-zacht)', flex: 1 }}
                value={punt.toelichting || ''} onChange={e => onUpdate({ toelichting: e.target.value })} placeholder="Toelichting (optioneel)..." />
              <input className="invoer-inline" style={{ fontSize: '12px', width: '210px', flexShrink: 0 }}
                value={(punt as { url?: string }).url || ''} onChange={e => onUpdate({ url: e.target.value } as { url: string })}
                placeholder="🔗 Link agenda (optioneel)" type="url" />
            </div>
          )}

          {/* PA editor */}
          {isPA && <PAEditor punt={punt} onUpdate={onUpdate} onUpdateSub={onUpdateSub} onVerwijderSub={onVerwijderSub} />}

          {/* RV editor */}
          {isRV && <RVEditor punt={punt} onUpdate={onUpdate} onUpdateSub={onUpdateSub} onVerwijderSub={onVerwijderSub} />}

          {/* Normale subpunten */}
          {!isPA && !isRV && !isIngekomen && (
            <>
              {punt.subpunten.map((sub, si) => (
                <SubpuntEditor key={`${sub.id}-${si}`} sub={sub} subIndex={si}
                  toonUrl={!isMededelingen}
                  onVerwijder={() => onVerwijderSub(si)} onUpdate={(w) => onUpdateSub(si, w)} />
              ))}
              {punt.subpunten.length === 0 && (
                <div onClick={onVoegSubToe} style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic', cursor: 'pointer' }}>
                  + Klik om een subpunt toe te voegen
                </div>
              )}
            </>
          )}

          {/* Ingekomen stukken */}
          {isIngekomen && (
            <div style={{ padding: '10px 14px' }}>
              <IngekomenStukkenInvoer
                subpunten={punt.subpunten}
                onVoegToe={(sub) => { const letter = String.fromCharCode(97 + punt.subpunten.length); onUpdate({ subpunten: [...punt.subpunten, { ...sub, id: letter }] }) }}
                onVerwijder={(idx) => { const nieuw = punt.subpunten.filter((_, i) => i !== idx); nieuw.forEach((s, i) => { s.id = String.fromCharCode(97 + i) }); onUpdate({ subpunten: nieuw }) }}
                onUpdate={(idx, w) => { const nieuw = punt.subpunten.map((s, i) => i === idx ? { ...s, ...w } : s); onUpdate({ subpunten: nieuw }) }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Politieke Avond editor
function PAEditor({ punt, onUpdate, onUpdateSub, onVerwijderSub }: {
  punt: Agendapunt; onUpdate: (w: Partial<Agendapunt>) => void
  onUpdateSub: (si: number, w: Partial<Subpunt>) => void; onVerwijderSub: (si: number) => void
}) {
  const voegSubToe = () => {
    const letter = String.fromCharCode(97 + punt.subpunten.length)
    onUpdate({ subpunten: [...punt.subpunten, { id: letter, titel: '', starttijd: '', woordvoerder: '', url: '' }] })
  }

  return (
    <div>
      {/* PA datum + link */}
      <div style={{ padding: '8px 14px', background: '#f0f8ff', borderBottom: '1px solid var(--rand)', display: 'flex', gap: '8px' }}>
        <input className="invoer-inline" style={{ fontSize: '12px', width: '130px', flexShrink: 0 }}
          type="date" value={punt.rvDatum || ''} onChange={e => onUpdate({ rvDatum: e.target.value })} />
        <input className="invoer-inline" style={{ fontSize: '12px', flex: 1 }}
          type="url" value={punt.url || ''} onChange={e => onUpdate({ url: e.target.value })}
          placeholder="🔗 Link agenda politieke avond (optioneel)" />
      </div>

      {/* Subpunten */}
      {punt.subpunten.map((sub, si) => (
        <div key={si} style={{ padding: '8px 14px', borderBottom: '1px solid #f0ede8', background: '#fafaf8' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', minWidth: '18px', fontStyle: 'italic' }}>
              {String.fromCharCode(97 + si)}.
            </span>
            <input className="invoer-inline" style={{ width: '80px', flexShrink: 0 }}
              value={sub.starttijd || ''} onChange={e => onUpdateSub(si, { starttijd: e.target.value })}
              placeholder="19:30" />
            <input className="invoer-inline" style={{ flex: 1 }}
              value={sub.titel} onChange={e => onUpdateSub(si, { titel: e.target.value })}
              placeholder="Onderwerp..." />
            <input className="invoer-inline" style={{ width: '130px', flexShrink: 0 }}
              value={sub.woordvoerder || ''} onChange={e => onUpdateSub(si, { woordvoerder: e.target.value })}
              placeholder="Woordvoerder" />
            <button onClick={() => onVerwijderSub(si)} style={iconKnop}>✕</button>
          </div>
        </div>
      ))}
      <div onClick={voegSubToe} style={{ padding: '10px 14px', fontSize: '12px', color: '#1a5c8a', fontFamily: 'Arial', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
        + Subpunt toevoegen
      </div>
    </div>
  )
}

// Raadsvergadering editor
function RVEditor({ punt, onUpdate, onUpdateSub, onVerwijderSub }: {
  punt: Agendapunt; onUpdate: (w: Partial<Agendapunt>) => void
  onUpdateSub: (si: number, w: Partial<Subpunt>) => void; onVerwijderSub: (si: number) => void
}) {
  const [toonSubtypeVoor, setToonSubtypeVoor] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const dragItem = useRef<number | null>(null)

  const handleDragStart = (si: number) => { dragItem.current = si }
  const handleDragOver = (e: React.DragEvent, si: number) => { e.preventDefault(); setDragOver(si) }
  const handleDrop = (si: number) => {
    if (dragItem.current === null || dragItem.current === si) { setDragOver(null); return }
    const nieuw = Array.from(punt.subpunten)
    const [verplaatst] = nieuw.splice(dragItem.current, 1)
    nieuw.splice(si, 0, verplaatst)
    onUpdate({ subpunten: nieuw })
    dragItem.current = null
    setDragOver(null)
  }

  const voegHoofdpuntToe = () => {
    const id = String(punt.subpunten.filter(s => !s.subtype || s.subtype === 'normaal').length + 1)
    onUpdate({ subpunten: [...punt.subpunten, { id, titel: '', rvNummer: id, inStemlijst: false, subtype: 'normaal', url: '' }] })
  }

  const voegSubtypeToe = (parentIndex: number, type: 'motie' | 'amendement') => {
    setToonSubtypeVoor(null)
    const prefix = type === 'motie' ? 'M' : 'A'
    const bestaande = punt.subpunten.filter(s => s.subtype === type).length
    const rvNr = `${prefix}26-${50 + bestaande}`
    // Koppel automatisch aan het raadsvoorstel waar de + M/A op geklikt is
    const ouderRvNummer = punt.subpunten[parentIndex]?.rvNummer || ''
    onUpdate({ subpunten: [...punt.subpunten, { id: `${type}-${parentIndex}-${bestaande}`, titel: '', rvNummer: rvNr, inStemlijst: true, subtype: type, url: '', gekoppeldAanRv: ouderRvNummer }] })
  }

  return (
    <div>
      {/* RV datum + link */}
      <div style={{ padding: '8px 14px', background: '#f8f0ff', borderBottom: '1px solid var(--rand)', display: 'flex', gap: '8px' }}>
        <input className="invoer-inline" style={{ fontSize: '12px', width: '130px', flexShrink: 0 }}
          type="date" value={punt.rvDatum || ''} onChange={e => onUpdate({ rvDatum: e.target.value })} />
        <input className="invoer-inline" style={{ fontSize: '12px', flex: 1 }}
          type="url" value={punt.url || ''} onChange={e => onUpdate({ url: e.target.value })}
          placeholder="🔗 Link agenda raadsvergadering (optioneel)" />
      </div>

      {/* Punten */}
      {punt.subpunten.map((sub, si) => {
        const isMotie = sub.subtype === 'motie'
        const isAmendement = sub.subtype === 'amendement'
        const isSubtype = isMotie || isAmendement
        return (
          <div key={si}
            draggable
            onDragStart={() => handleDragStart(si)}
            onDragOver={(e) => handleDragOver(e, si)}
            onDrop={() => handleDrop(si)}
            style={{ padding: '8px 14px', borderBottom: '1px solid #f0ede8', background: dragOver === si ? '#f0eeff' : isSubtype ? '#fdf8ff' : '#fafaf8', paddingLeft: isSubtype ? '28px' : '14px', transition: 'background 0.15s' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ cursor: 'grab', color: '#9a7aaa', fontSize: '14px', flexShrink: 0 }} title="Sleep om te herordenen">⠿</span>
              {isSubtype && (
                <span style={{ fontSize: '10px', background: isMotie ? '#fff0e8' : '#f0e8ff', color: isMotie ? '#8a4000' : '#5a1a8a', border: `1px solid ${isMotie ? '#e8a060' : '#c0a0d8'}`, padding: '1px 5px', borderRadius: '3px', flexShrink: 0 }}>
                  {isMotie ? 'Motie' : 'Amendement'}
                </span>
              )}
              <input className="invoer-inline" style={{ width: '90px', flexShrink: 0, fontWeight: isSubtype ? 'normal' : 'bold', fontSize: '12px' }}
                value={sub.rvNummer || ''} onChange={e => onUpdateSub(si, { rvNummer: e.target.value })}
                onMouseDown={e => e.stopPropagation()}
                placeholder={isMotie ? 'M26-57' : isAmendement ? 'A26-58' : '3a'} />
              <input className="invoer-inline" style={{ flex: 1 }}
                value={sub.titel} onChange={e => onUpdateSub(si, { titel: e.target.value })}
                onMouseDown={e => e.stopPropagation()}
                placeholder="Titel..." />
              {!isSubtype && (
                <input className="invoer-inline" style={{ width: '110px', flexShrink: 0, fontSize: '12px' }}
                  value={sub.woordvoerder || ''} onChange={e => onUpdateSub(si, { woordvoerder: e.target.value })}
                  onMouseDown={e => e.stopPropagation()}
                  placeholder="Woordvoerder" />
              )}
              {isSubtype && (
                <select
                  value={sub.gekoppeldAanRv || ''}
                  onChange={e => onUpdateSub(si, { gekoppeldAanRv: e.target.value })}
                  style={{ fontSize: '11px', padding: '4px 6px', border: '1px solid var(--rand)', borderRadius: '5px', fontFamily: 'Arial', color: 'var(--tekst-zacht)', background: 'white', flexShrink: 0, maxWidth: '100px' }}
                  title="Koppel aan raadsvoorstel"
                >
                  <option value="">Los</option>
                  {punt.subpunten
                    .filter(s => !s.subtype || s.subtype === 'normaal')
                    .map(rv => (
                      <option key={rv.rvNummer} value={rv.rvNummer || ''}>{rv.rvNummer || rv.titel.substring(0, 15)}</option>
                    ))}
                </select>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'Arial', color: 'var(--tekst-zacht)', flexShrink: 0, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                <input type="checkbox" checked={!!sub.inStemlijst} onChange={e => onUpdateSub(si, { inStemlijst: e.target.checked })} />
                Stemlijst
              </label>
              {!isSubtype && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setToonSubtypeVoor(toonSubtypeVoor === si ? null : si)}
                    style={{ ...iconKnop, fontSize: '11px', border: '1px solid #c0a0d8', borderRadius: '4px', padding: '2px 7px', color: '#5a1a8a' }}>
                    + M/A
                  </button>
                  {toonSubtypeVoor === si && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, marginTop: '2px', background: 'white', border: '1px solid var(--rand)', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', minWidth: '140px' }}>
                      <button onClick={() => voegSubtypeToe(si, 'motie')} style={ddItem}>🗳 Motie toevoegen</button>
                      <button onClick={() => voegSubtypeToe(si, 'amendement')} style={ddItem}>📝 Amendement toevoegen</button>
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => onVerwijderSub(si)} style={{ ...iconKnop, color: 'var(--rood)' }}>✕</button>
            </div>
          </div>
        )
      })}
      <div onClick={voegHoofdpuntToe} style={{ padding: '10px 14px', fontSize: '12px', color: '#5a1a8a', fontFamily: 'Arial', cursor: 'pointer' }}>
        + Raadspunt toevoegen
      </div>
    </div>
  )
}

function SubpuntEditor({ sub, subIndex, onVerwijder, onUpdate, toonUrl = true }: {
  sub: Subpunt; subIndex: number; onVerwijder: () => void; onUpdate: (w: Partial<Subpunt>) => void; toonUrl?: boolean
}) {
  return (
    <div style={{ padding: '7px 14px 7px 48px', borderBottom: '1px solid #f0ede8', background: '#fafaf8', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic', minWidth: '18px', paddingTop: '7px' }}>
        {String.fromCharCode(97 + subIndex)}.
      </span>
      <div style={{ flex: 1 }}>
        <input className="invoer-inline" value={sub.titel} onChange={e => onUpdate({ titel: e.target.value })} placeholder="Titel subpunt..." />
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
          {toonUrl && (
            <input className="invoer-inline" style={{ flex: 1, fontSize: '12px' }} value={sub.url || ''} onChange={e => onUpdate({ url: e.target.value })} placeholder="URL (optioneel)" type="url" />
          )}
          <label style={{ fontSize: '12px', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' as const, cursor: 'pointer', marginLeft: toonUrl ? 0 : 'auto' }}>
            <input type="checkbox" checked={!!sub.afgedaan} onChange={e => onUpdate({ afgedaan: e.target.checked })} />
            Afgedaan
          </label>
          <button onClick={onVerwijder} style={{ ...iconKnop, color: 'var(--rood)', fontSize: '13px' }}>✕</button>
        </div>
      </div>
    </div>
  )
}

const btnOutline: React.CSSProperties = { background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '8px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '500' }
const btnAccent: React.CSSProperties = { background: 'var(--accent)', color: 'var(--blauw)', border: '1px solid var(--accent)', padding: '8px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: 'bold' }
const iconKnop: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '15px', padding: '2px 6px', flexShrink: 0 }
const ddItem: React.CSSProperties = { display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: '13px', fontFamily: 'Arial', border: 'none', borderBottom: '1px solid #f0ede8', cursor: 'pointer', background: 'white', color: 'var(--tekst)' }
