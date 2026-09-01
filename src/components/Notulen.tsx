'use client'

import { useState } from 'react'

interface NotulenProps {
  notulen: string
  onUpdate?: (notulen: string) => void
  magBewerken: boolean
}

export default function Notulen({ notulen, onUpdate, magBewerken }: NotulenProps) {
  const [bewerken, setBewerken] = useState(false)
  const [tekst, setTekst] = useState(notulen || '')

  const slaOp = () => {
    if (onUpdate) onUpdate(tekst)
    setBewerken(false)
  }

  const annuleer = () => {
    setTekst(notulen || '')
    setBewerken(false)
  }

  if (!notulen && !magBewerken) return null

  return (
    <div id="notulen" style={{ marginTop: '28px', borderTop: '2px solid var(--blauw)', paddingTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h2 style={{ fontSize: '15px', color: 'var(--blauw)', fontWeight: 'bold', fontFamily: 'Arial', margin: 0 }}>
          📝 Notulen
        </h2>
        {magBewerken && !bewerken && (
          <button onClick={() => { setTekst(notulen || ''); setBewerken(true) }}
            className="no-print"
            style={{ background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}>
            ✎ {notulen ? 'Bewerken' : 'Toevoegen'}
          </button>
        )}
      </div>

      {bewerken ? (
        <div>
          <textarea
            rows={10}
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            placeholder="Schrijf hier de notulen van deze fractievergadering..."
            style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial', lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button onClick={slaOp}
              style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600' }}>
              ✓ Opslaan
            </button>
            <button onClick={annuleer}
              style={{ background: 'white', color: 'var(--tekst-zacht)', border: '1px solid var(--rand)', padding: '8px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial' }}>
              Annuleren
            </button>
          </div>
        </div>
      ) : notulen ? (
        <div style={{ fontSize: '14px', fontFamily: 'Arial', lineHeight: 1.7, color: 'var(--tekst)', whiteSpace: 'pre-wrap' as const, background: '#fafaf8', border: '1px solid var(--rand)', borderRadius: '8px', padding: '16px 18px' }}>
          {notulen}
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', fontStyle: 'italic' }}>
          Nog geen notulen toegevoegd.
        </p>
      )}
    </div>
  )
}
