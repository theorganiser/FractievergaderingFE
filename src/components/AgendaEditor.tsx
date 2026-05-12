'use client'

import { useState } from 'react'
import IngekomenStukkenInvoer from './IngekomentukkenInvoer'
import { Agendapunt, Subpunt } from '@/lib/types'

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
}

export default function AgendaEditor({
  punten,
  onUpdatePunt,
  onVerwijderPunt,
  onVoegPuntToe,
  onVoegSubpuntToe,
  onVerwijderSubpunt,
  onUpdateSubpunt,
  onSyncDocumenten,
  ladenSync,
}: AgendaEditorProps) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-outline" onClick={onVoegPuntToe}>
          + Agendapunt toevoegen
        </button>
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-accent"
          onClick={onSyncDocumenten}
          disabled={ladenSync}
        >
          {ladenSync ? (
            <><span className="spinner-wit" /> Bezig...</>
          ) : (
            '📋 Documenten selecteren'
          )}
        </button>
      </div>

      {punten.map((punt, pi) => (
        <PuntEditor
          key={`${punt.id}-${pi}`}
          punt={punt}
          puntIndex={pi}
          onUpdate={(w) => onUpdatePunt(pi, w)}
          onVerwijder={() => onVerwijderPunt(pi)}
          onVoegSubToe={() => onVoegSubpuntToe(pi)}
          onVerwijderSub={(si) => onVerwijderSubpunt(pi, si)}
          onUpdateSub={(si, w) => onUpdateSubpunt(pi, si, w)}
        />
      ))}

      <div style={{ marginTop: '12px' }}>
        <button className="btn btn-outline" onClick={onVoegPuntToe}>
          + Agendapunt toevoegen
        </button>
      </div>

      <style>{`
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-family: Arial, sans-serif;
          border: 1px solid transparent;
          transition: all 0.15s;
          background: none;
        }
        .btn-outline {
          background: white;
          color: var(--blauw);
          border-color: var(--blauw);
        }
        .btn-outline:hover { background: var(--blauw-licht); }
        .btn-accent {
          background: var(--accent);
          color: var(--blauw);
          border-color: var(--accent);
          font-weight: bold;
        }
        .btn-gevaar {
          background: white;
          color: var(--rood);
          border-color: var(--rood);
        }
        .btn-gevaar:hover { background: #fdf0ef; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .spinner-wit {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(26,58,92,0.3);
          border-top-color: var(--blauw);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
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
        .invoer-inline:focus {
          border-color: var(--blauw);
          box-shadow: 0 0 0 2px rgba(26,58,92,0.12);
        }
      `}</style>
    </div>
  )
}

interface PuntEditorProps {
  punt: Agendapunt
  puntIndex: number
  onUpdate: (w: Partial<Agendapunt>) => void
  onVerwijder: () => void
  onVoegSubToe: () => void
  onVerwijderSub: (si: number) => void
  onUpdateSub: (si: number, w: Partial<Subpunt>) => void
}

function PuntEditor({ punt, puntIndex, onUpdate, onVerwijder, onVoegSubToe, onVerwijderSub, onUpdateSub }: PuntEditorProps) {
  const [ingeklapt, setIngeklapt] = useState(false)

  return (
    <div style={{
      border: '1px solid var(--rand)',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '10px',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--blauw-licht)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '13px', color: 'var(--blauw)', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', minWidth: '20px' }}>
            {punt.id}.
          </span>
          <input
            className="invoer-inline"
            style={{ fontWeight: 'bold', color: 'var(--blauw)', borderColor: 'rgba(26,58,92,0.3)' }}
            value={punt.titel}
            onChange={e => onUpdate({ titel: e.target.value })}
          />
          <button
            onClick={() => setIngeklapt(!ingeklapt)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blauw)', fontSize: '16px', padding: '0 4px' }}
          >
            {ingeklapt ? '▸' : '▾'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={onVoegSubToe}>
            + Subpunt
          </button>
          <button className="btn btn-gevaar" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={onVerwijder}>
            ✕
          </button>
        </div>
      </div>

      {!ingeklapt && (
        <>
          {/* Toelichting + optionele URL op het punt */}
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
              style={{ fontSize: '12px', width: '200px', flexShrink: 0 }}
              value={(punt as { url?: string }).url || ''}
              onChange={e => onUpdate({ url: e.target.value } as { url: string })}
              placeholder="🔗 Link agenda (optioneel)"
              type="url"
            />
          </div>

          {/* Subpunten */}
          {punt.subpunten.map((sub, si) => (
            <SubpuntEditor
              key={`${sub.id}-${si}`}
              sub={sub}
              subIndex={si}
              onVerwijder={() => onVerwijderSub(si)}
              onUpdate={(w) => onUpdateSub(si, w)}
            />
          ))}

          {punt.titel.toLowerCase().includes('ingekomen') ? (
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
          ) : punt.subpunten.length === 0 ? (
            <div
              style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', fontStyle: 'italic', cursor: 'pointer' }}
              onClick={onVoegSubToe}
            >
              + Klik om een subpunt toe te voegen
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

interface SubpuntEditorProps {
  sub: Subpunt
  subIndex: number
  onVerwijder: () => void
  onUpdate: (w: Partial<Subpunt>) => void
}

function SubpuntEditor({ sub, subIndex, onVerwijder, onUpdate }: SubpuntEditorProps) {
  return (
    <div style={{
      padding: '8px 14px 8px 36px',
      borderBottom: '1px solid #f0ede8',
      background: '#fafaf8',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    }}>
      <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', fontStyle: 'italic', minWidth: '18px', paddingTop: '6px' }}>
        {String.fromCharCode(97 + subIndex)}.
      </span>
      <div style={{ flex: 1 }}>
        <input
          className="invoer-inline"
          value={sub.titel}
          onChange={e => onUpdate({ titel: e.target.value })}
          placeholder="Titel subpunt..."
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
          <input
            className="invoer-inline"
            style={{ flex: 1, fontSize: '12px' }}
            value={sub.url || ''}
            onChange={e => onUpdate({ url: e.target.value })}
            placeholder="URL (optioneel)"
            type="url"
          />
          <label style={{ fontSize: '12px', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!sub.afgedaan}
              onChange={e => onUpdate({ afgedaan: e.target.checked })}
            />
            Afgedaan
          </label>
          <button
            className="btn btn-gevaar"
            style={{ padding: '3px 7px', fontSize: '12px' }}
            onClick={onVerwijder}
          >
            ✕
          </button>
        </div>
        <input
          className="invoer-inline"
          style={{ marginTop: '4px', fontSize: '12px', fontStyle: 'italic' }}
          value={sub.toelichting || ''}
          onChange={e => onUpdate({ toelichting: e.target.value })}
          placeholder="Toelichting subpunt (optioneel)"
        />
      </div>
    </div>
  )
}
