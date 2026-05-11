'use client'


import { useVergaderingen } from '@/hooks/useVergaderingen'
import Leesweergave from '@/components/Leesweergave'

interface Props {
  params: { token: string }
}

export default function LeesPagina({ params }: Props) {
  const { token } = params
  const { vindOpToken, geladen } = useVergaderingen()

  if (!geladen) {
    return (
      <div style={{ fontFamily: 'Arial', color: 'var(--tekst-zacht)', padding: '40px', textAlign: 'center' }}>
        Laden...
      </div>
    )
  }

  const vergadering = vindOpToken(token)

  if (!vergadering) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', fontFamily: 'Arial, sans-serif', color: 'var(--tekst-zacht)' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>❌</div>
        <h2 style={{ fontSize: '18px', color: 'var(--blauw)', marginBottom: '8px' }}>Vergadering niet gevonden</h2>
        <p>De link is ongeldig of de vergadering is verwijderd.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="print-full">
      <Leesweergave vergadering={vergadering} toonPrintKnop />
    </div>
  )
}
