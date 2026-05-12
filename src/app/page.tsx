'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVergaderingen } from '@/hooks/useVergaderingen'
import { useAuth } from '@/hooks/useAuth'
import { formatDatum, sorteerOpDatum } from '@/lib/datum'
import Melding from '@/components/Melding'

export default function OverzichtPagina() {
  const router = useRouter()
  const { vergaderingen, geladen, maakNieuwe, kopieer, verwijder } = useVergaderingen()
  const { isAdmin } = useAuth()
  const [melding, setMelding] = useState<{ type: 'succes' | 'info'; tekst: string } | null>(null)
  const [bezig, setBezig] = useState(false)

  if (!geladen) return <Laden />

  const gesorteerd = [...vergaderingen].sort(sorteerOpDatum)

  const handleNieuw = async (vanTemplate: boolean) => {
    setBezig(true)
    const v = await maakNieuwe(vanTemplate)
    router.push(`/vergadering/${v.id}`)
  }

  const handleKopieer = async (id: string) => {
    setBezig(true)
    const kop = await kopieer(id)
    if (kop) router.push(`/vergadering/${kop.id}`)
  }

  const handleVerwijder = async (id: string) => {
    if (confirm('Weet je zeker dat je deze vergadering wilt verwijderen?')) {
      await verwijder(id)
    }
  }

  const kopieerDeellink = (token: string) => {
    const url = `${window.location.origin}/lees/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setMelding({ type: 'succes', tekst: 'Deellink gekopieerd naar klembord!' })
      setTimeout(() => setMelding(null), 3000)
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: 'normal' }}>Vergaderingen</h1>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Knop variant="outline" onClick={() => handleNieuw(false)} disabled={bezig}>+ Leeg</Knop>
            <Knop variant="primair" onClick={() => handleNieuw(true)} disabled={bezig}>
              {bezig ? '⏳ Bezig...' : '+ Nieuw vanuit template'}
            </Knop>
          </div>
        )}
      </div>
      <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', marginBottom: '24px' }}>
        Vergadering- en agendabeheer voor Gooise Meren
      </p>

      {melding && <Melding type={melding.type} tekst={melding.tekst} onSluit={() => setMelding(null)} />}

      {gesorteerd.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>📅</div>
          <p>Nog geen vergaderingen.</p>
          {isAdmin && <p style={{ marginTop: '8px' }}>Gebruik de knoppen rechtsboven om er een aan te maken.</p>}
        </div>
      ) : (
        gesorteerd.map(v => (
          <div key={v.id} style={{
            background: 'white',
            border: '1px solid var(--rand)',
            borderRadius: '8px',
            padding: '18px 20px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
          }}>
            <div>
              <h3 style={{ fontSize: '17px', color: 'var(--blauw)', fontWeight: 'normal', marginBottom: '6px' }}>
                {v.titel || 'Naamloos'}
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {v.datum
                  ? <span>📅 {formatDatum(v.datum)}</span>
                  : <span style={{ color: 'var(--rood)' }}>Datum niet ingesteld</span>
                }
                {v.aanvang && <span>🕐 {v.aanvang} uur</span>}
                {v.locatie && <span>📍 {v.locatie}</span>}
                <span>{v.punten.length} agendapunten</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
              <Knop variant="outline" klein onClick={() => router.push(`/lees/${v.deeltoken}`)}>👁 Bekijken</Knop>
              {isAdmin && (
                <>
                  <Knop variant="primair" klein onClick={() => router.push(`/vergadering/${v.id}`)}>✏️ Bewerken</Knop>
                  <Knop variant="outline" klein onClick={() => handleKopieer(v.id)}>⧉ Kopiëren</Knop>
                  <button
                    onClick={() => kopieerDeellink(v.deeltoken)}
                    style={{ fontSize: '11px', background: '#e8f5ed', border: '1px solid #a8d8b5', color: '#2d7a4f', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}
                  >
                    🔗 Deel
                  </button>
                  <Knop variant="gevaar" klein onClick={() => handleVerwijder(v.id)}>🗑</Knop>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function Laden() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
      <p>Vergaderingen laden...</p>
    </div>
  )
}

function Knop({ variant, klein, onClick, children, disabled }: {
  variant: 'primair' | 'outline' | 'gevaar'
  klein?: boolean
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  const basis: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: klein ? '5px 10px' : '8px 16px',
    borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: klein ? '12px' : '13px', fontFamily: 'Arial, sans-serif',
    border: '1px solid transparent', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
  }
  const stijlen: Record<string, React.CSSProperties> = {
    primair: { ...basis, background: 'var(--blauw)', color: 'white', borderColor: 'var(--blauw)' },
    outline: { ...basis, background: 'white', color: 'var(--blauw)', borderColor: 'var(--blauw)' },
    gevaar:  { ...basis, background: 'white', color: 'var(--rood)', borderColor: 'var(--rood)' },
  }
  return <button style={stijlen[variant]} onClick={onClick} disabled={disabled}>{children}</button>
}
