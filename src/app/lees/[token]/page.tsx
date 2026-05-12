'use client'

import { useVergaderingOpToken } from '@/hooks/useVergaderingen'
import { LeesweergaveVolledig } from '@/components/Leesweergave'

interface Props { params: { token: string } }

export default function LeesPagina({ params }: Props) {
  const { token } = params
  const { vergadering, geladen } = useVergaderingOpToken(token)

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
      <LeesweergaveVolledig vergadering={vergadering} toonPrintKnop />
    </div>
  )
}
