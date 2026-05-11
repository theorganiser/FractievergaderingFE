'use client'

interface MeldingProps {
  type: 'succes' | 'info' | 'waarschuwing' | 'fout'
  tekst: string
  onSluit?: () => void
}

const STIJLEN = {
  succes: { bg: '#e8f5ed', kleur: '#2d7a4f', rand: '#a8d8b5' },
  info: { bg: '#e8f0f8', kleur: '#1a3a5c', rand: '#a0c0e0' },
  waarschuwing: { bg: '#fff8e8', kleur: '#8a6820', rand: '#dfc070' },
  fout: { bg: '#fdf0ef', kleur: '#c0392b', rand: '#e8a090' },
}

export default function Melding({ type, tekst, onSluit }: MeldingProps) {
  const s = STIJLEN[type]
  return (
    <div style={{
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: s.bg,
      color: s.kleur,
      border: `1px solid ${s.rand}`,
    }}>
      <span style={{ flex: 1 }}>{tekst}</span>
      {onSluit && (
        <button
          onClick={onSluit}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: s.kleur,
            fontSize: '16px',
            lineHeight: 1,
            padding: '0 4px',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
