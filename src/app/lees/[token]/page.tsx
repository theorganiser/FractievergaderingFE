'use client'

export const dynamic = 'force-dynamic'

import { useVergaderingOpToken } from '../../../hooks/useVergaderingen'
import { LeesweergaveVolledig } from '../../../components/Leesweergave'
import Notulen from '../../../components/Notulen'
import { useAuth } from '../../../hooks/useAuth'

interface Props { params: { token: string } }

export default function LeesPagina({ params }: Props) {
  const { token } = params
  const { vergadering, geladen, fout, herlaad, updateNotulen } = useVergaderingOpToken(token)
  const { isAdmin, isModerator } = useAuth()

  if (!geladen) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
      ⏳ Agenda laden...
    </div>
  )

  if (fout) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <p>Kon de vergadering niet laden.</p>
      <button onClick={herlaad} style={{ marginTop: '12px', background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px' }}>
        Opnieuw proberen
      </button>
    </div>
  )

  if (!vergadering) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
      <h2 style={{ color: 'var(--blauw)', marginBottom: '8px', fontWeight: 'normal' }}>Vergadering niet gevonden</h2>
      <p>De link is ongeldig of de vergadering is verwijderd.</p>
    </div>
  )

  // Check of er stemlijst items zijn
  const heeftStemlijst = vergadering.punten?.some(p =>
    p.puntType === 'raadsvergadering' && p.subpunten?.some(s => s.inStemlijst)
  )

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="print-full">
      <div className="no-print" style={{ marginBottom: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {heeftStemlijst && (
          <a href={`/stemlijst/${token}`} target="_blank"
            style={{ background: 'white', color: '#4a1a5c', border: '1px solid #4a1a5c', padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            ⚖️ Stemlijst
          </a>
        )}
        {isAdmin && (
          <button
            onClick={() => window.open(`/presentatie/${token}`, '_blank')}
            style={{ background: '#4a1a5c', color: '#a89060', border: '1px solid #a89060', padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: 'bold' }}
          >
            📺 Presentatiemodus
          </button>
        )}
      </div>
      <LeesweergaveVolledig vergadering={vergadering} toonPrintKnop />
      <Notulen
        notulen={vergadering.notulen || ''}
        onUpdate={(isAdmin || isModerator) ? updateNotulen : undefined}
        magBewerken={isAdmin || isModerator}
      />
    </div>
  )
}
