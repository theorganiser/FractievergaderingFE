'use client'

import { useState } from 'react'
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

export default function AgendaEditor({
  punten, onUpdatePunt, onVerwijderPunt, onVoegPuntToe,
  onVoegSubpuntToe, onVerwijderSubpunt, onUpdateSubpunt,
  onSyncDocumenten, ladenSync, onHerorden,
}: AgendaEditorProps) {

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { source, destination } = result
    if (source.index === destination.index) return

    const nieuw = Array.from(punten)
    const [verplaatst] = nieuw.splice(source.index, 1)
    nieuw.splice(destination.index, 0, verplaatst)
    // Hernummer
    nieuw.forEach((p, i) => { p.id = i + 1 })
    onHerorden(nieuw)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={onVoegPuntToe} style={btnOutline}>+ Agendapunt toevoegen</button>
        <div style={{ flex: 1 }} />
        <button onClick={onSyncDocumenten} disabled={ladenSync} style={btnAccent}>
          {ladenSync ? '⏳ Bezig...' : '📋 Documenten selecteren'}
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="agenda-punten">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ background: snapshot.isDraggingOver ? '#f5eeff' : 'transparent', borderRadius: '8px', transition: 'background 0.2s' }}
            >
              {punten.map((punt, pi) => (
                <Draggable key={`punt-${pi}`} draggableId={`punt-${pi}`} index={pi}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        marginBottom: '8px',
                        boxShadow: snapshot.isDragging ? '0 8px 24px rgba(74,26,92,0.2)' : 'none',
                        borderRadius: '8px',
                      }}
                    >
                      <PuntEditor
                        punt={punt}
                        puntIndex={pi}
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

      <div style={{ marginTop: '8px' }}>
        <button onClick={onVoegPuntToe} style={btnOutline}>+ Agendapunt toevoegen</button>
      </div>

      <style>{`
        .invoer-inline {
          width: 100%;
          padding: 5px 8px;
          border: 1px solid var(--rand);
          border-radius: 6px;
          font-size: 13px;
          font-family: Arial, sans-serif;
          background: white;
          color: var(--tekst);
          outline: none;
        }
        .invoer-inline:focus { border-color: var(--blauw); box-shadow: 0 0 0 2px rgba(74,26,92,0.12); }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

interface PuntEditorProps {
  punt: Agendapunt
  puntIndex: number
  dragHandleProps: object | null | undefined
  isDragging: boolean
  onUpdate: (w: Partial<Agendapunt>) => void
  onVerwijder: () => void
  onVoegSubToe: () => void
  onVerwijderSub: (si: number) => void
  onUpdateSub: (si: number, w: Partial<Subpunt>) => void
}

function PuntEditor({ punt, dragHandleProps, isDragging, onUpdate, onVerwijder, onVoegSubToe, onVerwijderSub, onUpdateSub }: PuntEditorProps) {
  const [ingeklapt, setIngeklapt] = useState(false)
  const isIngekomen = punt.titel.toLowerCase().includes('ingekomen')

  return (
    <div style={{ border: `1px solid ${isDragging ? '#4a1a5c' : 'var(--rand)'}`, borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
      {/* Header */}
      <div style={{ background: isDragging ? '#f5eeff' : 'var(--blauw-licht)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Sleepgreep */}
        <div
          {...(dragHandleProps as object)}
          style={{ cursor: 'grab', color: '#9a7aaa', fontSize: '16px', padding: '0 4px', flexShrink: 0, lineHeight: 1 }}
          title="Sleep om te herordenen"
        >
          ⠿
        </div>
        <span style={{ fontSize: '13px', color: 'var(--blauw)', fontFamily: 'Arial', fontWeight: 'bold', minWidth: '24px', flexShrink: 0 }}>
          {punt.id}.
        </span>
        <input
          className="invoer-inline"
          style={{ fontWeight: 'bold', color: 'var(--blauw)', borderColor: 'rgba(74,26,92,0.25)', flex: 1 }}
          value={punt.titel}
          onChange={e => onUpdate({ titel: e.target.value })}
        />
        <button onClick={() => setIngeklapt(!ingeklapt)} style={iconKnop} title={ingeklapt ? 'Uitklappen' : 'Inklappen'}>
          {ingeklapt ? '▸' : '▾'}
        </button>
        <button onClick={onVoegSubToe} style={{ ...iconKnop, fontSize: '12px', padding: '3px 10px', border: '1px solid var(--blauw)', borderRadius: '5px', color: 'var(--blauw)' }}>
          + Sub
        </button>
        <button onClick={onVerwijder} style={{ ...iconKnop, color: 'var(--rood)' }} title="Verwijder punt">✕</button>
      </div>

      {!ingeklapt && (
        <>
          {/* Toelichting + URL */}
          <div style={{ padding: '6px 14px', background: '#fafaf8', borderBottom: '1px solid var(--rand)', display: 'flex', gap: '8px' }}>
            <input
              className="invoer-inline"
              style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--tekst-zacht)', flex: 1 }}
              value={punt.toelichting || ''}
              onChange={e => onUpdate({ toelichting: e.target.value })}
              placeholder="Toelichting (optioneel)..."
            />
            <input
              className="invoer-inline"
              style={{ fontSize: '12px', width: '210px', flexShrink: 0 }}
              value={(punt as { url?: string }).url || ''}
              onChange={e => onUpdate({ url: e.target.value } as { url: string })}
              placeholder="🔗 Link agenda (optioneel)"
              type="url"
            />
          </div>

          {/* Subpunten of ingekomen stukken */}
          {isIngekomen ? (
            <div style={{ padding: '10px 14px' }}>
              <IngekomenStukkenInvoer
                subpunten={punt.subpunten}
                onVoegToe={(sub) => {
                  const letter = String.fromCharCode(97 + punt.subpunten.length)
                  onUpdate({ subpunten: [...punt.subpunten, { ...sub, id: letter }] })
                }}
                onVerwijder={(idx) => {
                  const nieuw = punt.subpunten.filter((_, i) => i !== idx)
                  nieuw.forEach((s, i) => { s.id = String.fromCharCode(97 + i) })
                  onUpdate({ subpunten: nieuw })
                }}
                onUpdate={(idx, w) => {
                  const nieuw = punt.subpunten.map((s, i) => i === idx ? { ...s, ...w } : s)
                  onUpdate({ subpunten: nieuw })
                }}
              />
            </div>
          ) : (
            <>
              {punt.subpunten.map((sub, si) => (
                <SubpuntEditor
                  key={`${sub.id}-${si}`}
                  sub={sub}
                  subIndex={si}
                  onVerwijder={() => onVerwijderSub(si)}
                  onUpdate={(w) => onUpdateSub(si, w)}
                />
              ))}
              {punt.subpunten.length === 0 && (
                <div onClick={onVoegSubToe} style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic', cursor: 'pointer' }}>
                  + Klik om een subpunt toe te voegen
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function SubpuntEditor({ sub, subIndex, onVerwijder, onUpdate }: {
  sub: Subpunt; subIndex: number; onVerwijder: () => void; onUpdate: (w: Partial<Subpunt>) => void
}) {
  return (
    <div style={{ padding: '7px 14px 7px 48px', borderBottom: '1px solid #f0ede8', background: '#fafaf8', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic', minWidth: '18px', paddingTop: '7px' }}>
        {String.fromCharCode(97 + subIndex)}.
      </span>
      <div style={{ flex: 1 }}>
        <input className="invoer-inline" value={sub.titel} onChange={e => onUpdate({ titel: e.target.value })} placeholder="Titel subpunt..." />
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
          <input className="invoer-inline" style={{ flex: 1, fontSize: '12px' }} value={sub.url || ''} onChange={e => onUpdate({ url: e.target.value })} placeholder="URL (optioneel)" type="url" />
          <label style={{ fontSize: '12px', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!sub.afgedaan} onChange={e => onUpdate({ afgedaan: e.target.checked })} />
            Afgedaan
          </label>
          <button onClick={onVerwijder} style={{ ...iconKnop, color: 'var(--rood)', fontSize: '13px' }}>✕</button>
        </div>
        <input className="invoer-inline" style={{ marginTop: '4px', fontSize: '12px', fontStyle: 'italic' }} value={sub.toelichting || ''} onChange={e => onUpdate({ toelichting: e.target.value })} placeholder="Toelichting (optioneel)" />
      </div>
    </div>
  )
}

const btnOutline: React.CSSProperties = { background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '8px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '500' }
const btnAccent: React.CSSProperties = { background: 'var(--accent)', color: 'var(--blauw)', border: '1px solid var(--accent)', padding: '8px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: 'bold' }
const iconKnop: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '15px', padding: '2px 6px', flexShrink: 0 }
