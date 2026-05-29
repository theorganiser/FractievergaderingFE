'use client'

import { useVergaderingOpToken } from '@/hooks/useVergaderingen'
import { LeesweergaveVolledig } from '@/components/Leesweergave'
import { useAuth } from '@/hooks/useAuth'

interface Props { params: { token: string } }

export default function LeesPagina({ params }: Props) {
  const { token } = params
  const { vergadering, geladen } = useVergaderingOpToken(token)
  const { isAdmin } = useAuth()

  if (!geladen) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
      ⏳ Agenda laden...
    </div>
  )

  if (!vergadering) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
      <h2 style={{ color: 'var(--blauw)', marginBottom: '8px', fontWeight: 'normal' }}>Vergadering niet gevonden</h2>
      <p>De link is ongeldig of de vergadering is verwijderd.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="print-full">
      {isAdmin && (
        <div className="no-print" style={{ marginBottom: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => window.open(`/presentatie/${token}`, '_blank')}
            style={{ background: '#4a1a5c', color: '#a89060', border: '1px solid #a89060', padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: 'bold' }}
          >
            📺 Presentatiemodus
          </button>
        </div>
      )}
      <LeesweergaveVolledig vergadering={vergadering} toonPrintKnop />
    </div>
  )
}
