'use client'

import { useState } from 'react'

interface SupabaseFoutProps {
  opnieuw?: () => void
}

export default function SupabaseFout({ opnieuw }: SupabaseFoutProps) {
  const [bezig, setBezig] = useState(false)

  const handleOpnieuw = async () => {
    setBezig(true)
    await new Promise(r => setTimeout(r, 500))
    if (opnieuw) opnieuw()
    else window.location.reload()
    setBezig(false)
  }

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        background: 'white',
        border: '1px solid #e8d0d0',
        borderRadius: '14px',
        padding: '40px 36px',
        maxWidth: '460px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(74,26,92,0.08)',
      }}>
        {/* Icoon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#fdf0ef', border: '2px solid #e8b0b0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '28px',
        }}>
          🔌
        </div>

        <h2 style={{
          fontSize: '18px', color: '#4a1a5c', fontWeight: '700',
          fontFamily: 'Arial', margin: '0 0 10px',
        }}>
          Geen verbinding
        </h2>

        <p style={{
          fontSize: '14px', color: '#666', fontFamily: 'Arial',
          lineHeight: 1.6, margin: '0 0 8px',
        }}>
          De vergaderingen konden niet worden geladen. De database is mogelijk even niet bereikbaar.
        </p>

        <p style={{
          fontSize: '13px', color: '#999', fontFamily: 'Arial',
          margin: '0 0 28px',
        }}>
          Controleer je internetverbinding en probeer het opnieuw.
        </p>

        <button
          onClick={handleOpnieuw}
          disabled={bezig}
          style={{
            background: '#4a1a5c', color: 'white', border: 'none',
            padding: '11px 28px', borderRadius: '8px',
            fontSize: '14px', fontFamily: 'Arial', fontWeight: '600',
            cursor: bezig ? 'not-allowed' : 'pointer',
            opacity: bezig ? 0.7 : 1,
            transition: 'all 0.15s',
          }}
        >
          {bezig ? '⏳ Bezig...' : '↻ Opnieuw proberen'}
        </button>

        <div style={{
          marginTop: '24px', padding: '12px 16px',
          background: '#fafaf8', borderRadius: '8px',
          fontSize: '12px', color: '#888', fontFamily: 'Arial',
        }}>
          Blijft dit probleem? Neem contact op met de beheerder.
        </div>
      </div>
    </div>
  )
}

// Kleine inline banner voor opslagfouten
export function OpslaanFoutBanner({ onSluit }: { onSluit: () => void }) {
  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px',
      background: '#fdf0ef', border: '1px solid #e8a090',
      borderRadius: '10px', padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      zIndex: 200, maxWidth: '340px',
      animation: 'inschuiven 0.3s ease',
    }}>
      <span style={{ fontSize: '20px' }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#c0392b', fontFamily: 'Arial' }}>
          Opslaan mislukt
        </div>
        <div style={{ fontSize: '12px', color: '#888', fontFamily: 'Arial', marginTop: '2px' }}>
          Wijziging niet opgeslagen. Controleer je verbinding.
        </div>
      </div>
      <button
        onClick={onSluit}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '18px', padding: '0 4px', flexShrink: 0 }}
      >
        ×
      </button>
      <style>{`@keyframes inschuiven { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
