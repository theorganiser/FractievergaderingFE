'use client'

export const dynamic = 'force-dynamic'

import { useVergaderingOpToken } from '@/hooks/useVergaderingen'
import Notulen from '@/components/Notulen'
import { useAuth } from '@/hooks/useAuth'
import { formatDatum } from '@/lib/datum'

interface Props { params: { token: string } }

export default function NotulenPagina({ params }: Props) {
  const { token } = params
  const { vergadering, geladen, fout, herlaad, updateNotulen } = useVergaderingOpToken(token)
  const { isAdmin, isModerator } = useAuth()

  if (!geladen) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
      ⏳ Notulen laden...
    </div>
  )

  if (fout) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <p>Kon de notulen niet laden.</p>
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

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="print-full">
      <div className="no-print" style={{ marginBottom: '16px' }}>
        <a href={`/lees/${token}`}
          style={{ fontSize: '13px', color: 'var(--blauw)', fontFamily: 'Arial', textDecoration: 'none' }}>
          ← Terug naar volledige agenda
        </a>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '20px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>{vergadering.titel || 'Naamloos'}</h1>
        {vergadering.datum && (
          <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', margin: '2px 0 0' }}>
            📅 {formatDatum(vergadering.datum)}
          </p>
        )}
      </div>

      <Notulen
        notulen={vergadering.notulen || ''}
        onUpdate={(isAdmin || isModerator) ? updateNotulen : undefined}
        magBewerken={isAdmin || isModerator}
      />
    </div>
  )
}
