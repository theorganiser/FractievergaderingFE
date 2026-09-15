'use client'

import { useState } from 'react'
import { Notitie, Bijlage } from '@/lib/types'
import { BijlageKnop, BijlagePaneel } from './BijlagenSectie'

// Compact inline trigger — bedoeld om als badge in dezelfde regel te staan
// als woordvoerder/stemlijst-badges, niet als aparte blokknop eronder.
export function NotitieKnop({ aantal, open, onClick }: { aantal: number; open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} title={aantal > 0 ? `${aantal} notitie${aantal > 1 ? 's' : ''}` : 'Notitie toevoegen'}
      className="no-print"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px', flexShrink: 0,
        background: aantal > 0 ? '#fff3cc' : open ? '#f0ede8' : 'transparent',
        border: `1px solid ${aantal > 0 ? '#e8c860' : 'var(--rand)'}`,
        color: aantal > 0 ? '#8a6800' : 'var(--tekst-zacht)',
        fontSize: '11px', fontFamily: 'Arial', fontWeight: aantal > 0 ? 'normal' : 'bold',
        width: aantal > 0 ? undefined : '18px', height: aantal > 0 ? undefined : '18px',
        padding: aantal > 0 ? '1px 6px' : 0, borderRadius: aantal > 0 ? '9px' : '50%',
        cursor: 'pointer',
      }}>
      {aantal > 0 ? <>💬 {aantal}</> : '+'}
    </button>
  )
}

// Het uitklapbare paneel — los van de knop, zodat de aanroeper 'm buiten de
// flex-regel kan renderen (voorkomt dat elke regel standaard extra hoogte inneemt).
export function NotitiePaneel({ notities, naam, onToevoegen, tekst, setTekst, bezig, onPlaats }: {
  notities?: Notitie[]
  naam: string
  onToevoegen?: boolean
  tekst: string
  setTekst: (t: string) => void
  bezig: boolean
  onPlaats: () => void
}) {
  const aantal = notities?.length || 0
  return (
    <div className="no-print" style={{ margin: '2px 0 8px 14px', padding: '10px 12px', background: '#fafaf8', border: '1px solid var(--rand)', borderRadius: '8px', maxWidth: '520px' }}>
      {aantal > 0 && (
        <div style={{ marginBottom: onToevoegen ? '10px' : 0 }}>
          {notities!.map(n => (
            <div key={n.id} style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #ece7e0' }}>
              <div style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
                <strong>{n.naam}</strong> · {new Date(n.datum).toLocaleDateString('nl-NL')} {new Date(n.datum).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '13px', fontFamily: 'Arial', color: 'var(--tekst)', whiteSpace: 'pre-wrap' as const, marginTop: '1px' }}>{n.tekst}</div>
            </div>
          ))}
        </div>
      )}

      {onToevoegen && (
        <>
          <textarea
            rows={2}
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            placeholder="Notitie toevoegen (bijv. gespreksverslag met een inwoner)..."
            style={{ width: '100%', fontSize: '13px', fontFamily: 'Arial', padding: '7px 9px', border: '1px solid var(--rand)', borderRadius: '6px', resize: 'vertical' as const, outline: 'none', boxSizing: 'border-box' as const }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic' }}>
              👁 Zichtbaar voor alle fractieleden, geplaatst onder jouw naam ({naam || 'onbekend'}).
            </span>
            <button onClick={onPlaats} disabled={!tekst.trim() || bezig}
              style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontFamily: 'Arial', fontWeight: '600', cursor: (!tekst.trim() || bezig) ? 'not-allowed' : 'pointer', opacity: (!tekst.trim() || bezig) ? 0.5 : 1, flexShrink: 0 }}>
              {bezig ? '...' : 'Plaatsen'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// Combineert een bestaande regel (badges/titel als children, laatste flex-item wordt de
// notitie-badge) met het uitklappaneel eronder. Eén component per regel = eigen state,
// dus de badge staat inline en het paneel neemt alleen ruimte in als hij open staat.
export function RegelMetNotitie({ children, rowStyle, notities, naam, onToevoegen, bijlagen, vergaderingId, onBijlageToevoegen, onBijlageVerwijderen }: {
  children: React.ReactNode
  rowStyle: React.CSSProperties
  notities?: Notitie[]
  naam: string
  onToevoegen?: (tekst: string) => void
  bijlagen?: Bijlage[]
  vergaderingId?: string
  onBijlageToevoegen?: (bijlage: { naam: string; pad: string; type: string; grootte: number; uploader: string }) => void
  onBijlageVerwijderen?: (bijlageId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [tekst, setTekst] = useState('')
  const [bezig, setBezig] = useState(false)
  const aantal = notities?.length || 0

  const [bijlageOpen, setBijlageOpen] = useState(false)
  const aantalBijlagen = bijlagen?.length || 0

  const plaats = async () => {
    if (!tekst.trim() || !onToevoegen) return
    setBezig(true)
    await onToevoegen(tekst)
    setTekst('')
    setBezig(false)
  }

  return (
    <>
      <div style={rowStyle}>
        {children}
        {(aantal > 0 || onToevoegen) && (
          <NotitieKnop aantal={aantal} open={open} onClick={() => setOpen(!open)} />
        )}
        {(aantalBijlagen > 0 || (onBijlageToevoegen && vergaderingId)) && (
          <BijlageKnop aantal={aantalBijlagen} open={bijlageOpen} onClick={() => setBijlageOpen(!bijlageOpen)} />
        )}
      </div>
      {open && (
        <NotitiePaneel notities={notities} naam={naam} onToevoegen={!!onToevoegen}
          tekst={tekst} setTekst={setTekst} bezig={bezig} onPlaats={plaats} />
      )}
      {bijlageOpen && vergaderingId && onBijlageToevoegen && onBijlageVerwijderen && (
        <BijlagePaneel bijlagen={bijlagen} vergaderingId={vergaderingId} naam={naam}
          onToegevoegd={onBijlageToevoegen} onVerwijderd={onBijlageVerwijderen} />
      )}
    </>
  )
}
