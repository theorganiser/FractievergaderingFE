'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVergaderingen } from '@/hooks/useVergaderingen'
import { useAuth } from '@/hooks/useAuth'
import { formatDatum, sorteerOpDatum } from '@/lib/datum'
import Melding from '@/components/Melding'

interface NieuweVergaderingOpties {
  heeftPA: boolean
  paDatum: string
  paUrl: string
  heeftRV: boolean
  rvDatum: string
  rvUrl: string
}

export default function OverzichtPagina() {
  const router = useRouter()
  const { vergaderingen, geladen, maakNieuwe, kopieer, verwijder } = useVergaderingen()
  const { isAdmin } = useAuth()
  const [melding, setMelding] = useState<{ type: 'succes' | 'info'; tekst: string } | null>(null)
  const [bezig, setBezig] = useState(false)
  const [toonDialoog, setToonDialoog] = useState(false)
  const [opties, setOpties] = useState<NieuweVergaderingOpties>({
    heeftPA: false, paDatum: '', paUrl: '',
    heeftRV: false, rvDatum: '', rvUrl: '',
  })

  if (!geladen) return <Laden />

  const gesorteerd = [...vergaderingen].sort(sorteerOpDatum)

  const handleNieuw = async (vanTemplate: boolean) => {
    if (vanTemplate) { setToonDialoog(true); return }
    setBezig(true)
    const v = await maakNieuwe({ vanTemplate: false, heeftPA: false, paDatum: '', paUrl: '', heeftRV: false, rvDatum: '', rvUrl: '' })
    router.push(`/vergadering/${v.id}`)
  }

  const handleAanmaken = async () => {
    setBezig(true)
    setToonDialoog(false)
    const v = await maakNieuwe({ vanTemplate: true, ...opties })
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
    navigator.clipboard.writeText(`${window.location.origin}/lees/${token}`).then(() => {
      setMelding({ type: 'succes', tekst: 'Deellink gekopieerd!' })
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
        Vergadering- en agendabeheer — Goois Democratisch Platform
      </p>

      {melding && <Melding type={melding.type} tekst={melding.tekst} onSluit={() => setMelding(null)} />}

      {/* Aanmaak dialoog */}
      {toonDialoog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '520px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--blauw)', fontWeight: 'normal', marginBottom: '20px' }}>
              Nieuwe vergadering aanmaken
            </h2>

            {/* Politieke Avond */}
            <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid var(--rand)', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: opties.heeftPA ? '14px' : '0' }}>
                <input type="checkbox" checked={opties.heeftPA} onChange={e => setOpties(o => ({ ...o, heeftPA: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: 'bold', color: 'var(--blauw)' }}>Er is een Politieke Avond</span>
              </label>
              {opties.heeftPA && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStijl}>Datum PA</label>
                    <input type="date" style={invoerStijl} value={opties.paDatum} onChange={e => setOpties(o => ({ ...o, paDatum: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStijl}>Link agenda (optioneel)</label>
                    <input style={invoerStijl} placeholder="https://bestuur.gooisemeren.nl/..." value={opties.paUrl} onChange={e => setOpties(o => ({ ...o, paUrl: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            {/* Raadsvergadering */}
            <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--rand)', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: opties.heeftRV ? '14px' : '0' }}>
                <input type="checkbox" checked={opties.heeftRV} onChange={e => setOpties(o => ({ ...o, heeftRV: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: 'bold', color: 'var(--blauw)' }}>Er is een Raadsvergadering</span>
              </label>
              {opties.heeftRV && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStijl}>Datum RV</label>
                    <input type="date" style={invoerStijl} value={opties.rvDatum} onChange={e => setOpties(o => ({ ...o, rvDatum: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStijl}>Link agenda (optioneel)</label>
                    <input style={invoerStijl} placeholder="https://bestuur.gooisemeren.nl/..." value={opties.rvUrl} onChange={e => setOpties(o => ({ ...o, rvUrl: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Knop variant="outline" onClick={() => setToonDialoog(false)}>Annuleren</Knop>
              <Knop variant="primair" onClick={handleAanmaken}>Vergadering aanmaken →</Knop>
            </div>
          </div>
        </div>
      )}

      {gesorteerd.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>📅</div>
          <p>Nog geen vergaderingen. Gebruik de knop rechtsboven om er een aan te maken.</p>
        </div>
      ) : (
        gesorteerd.map(v => (
          <div key={v.id} style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '8px', padding: '18px 20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '17px', color: 'var(--blauw)', fontWeight: 'normal' }}>{v.titel || 'Naamloos'}</h3>
                <span style={{ fontSize: '10px', background: '#f0ede8', color: 'var(--tekst-zacht)', padding: '1px 6px', borderRadius: '3px', fontFamily: 'Arial' }}>v{v.versie || 1}</span>
                {v.heeftPolitiekeAvond && <span style={{ fontSize: '10px', background: '#e8f0f8', color: 'var(--blauw)', border: '1px solid #a0c0e0', padding: '1px 6px', borderRadius: '3px', fontFamily: 'Arial' }}>PA</span>}
                {v.heeftRaadsvergadering && <span style={{ fontSize: '10px', background: '#f0e8f8', color: '#5a3a8a', border: '1px solid #c0a0d8', padding: '1px 6px', borderRadius: '3px', fontFamily: 'Arial' }}>RV</span>}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {v.datum ? <span>📅 {formatDatum(v.datum)}</span> : <span style={{ color: 'var(--rood)' }}>Datum niet ingesteld</span>}
                {v.aanvang && <span>🕐 {v.aanvang} uur</span>}
                {v.locatie && <span>📍 {v.locatie}</span>}
                <span>{v.punten.length} punten</span>
                {(v.actielijst?.length || 0) > 0 && <span>✓ {v.actielijst.filter(a => !a.afgedaan).length}/{v.actielijst.length} acties open</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
              <Knop variant="outline" klein onClick={() => router.push(`/lees/${v.deeltoken}`)}>👁 Bekijken</Knop>
              {isAdmin && (
                <>
                  <Knop variant="primair" klein onClick={() => router.push(`/vergadering/${v.id}`)}>✏️ Bewerken</Knop>
                  <Knop variant="outline" klein onClick={() => handleKopieer(v.id)}>⧉ Kopiëren</Knop>
                  <button onClick={() => kopieerDeellink(v.deeltoken)} style={{ fontSize: '11px', background: '#e8f5ed', border: '1px solid #a8d8b5', color: '#2d7a4f', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'Arial' }}>🔗 Deel</button>
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
  return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>⏳ Laden...</div>
}

function Knop({ variant, klein, onClick, children, disabled }: {
  variant: 'primair' | 'outline' | 'gevaar'; klein?: boolean; onClick?: () => void; children: React.ReactNode; disabled?: boolean
}) {
  const basis: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: klein ? '5px 10px' : '8px 16px', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: klein ? '12px' : '13px', fontFamily: 'Arial, sans-serif', border: '1px solid transparent', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1 }
  const s: Record<string, React.CSSProperties> = {
    primair: { ...basis, background: 'var(--blauw)', color: 'white', borderColor: 'var(--blauw)' },
    outline: { ...basis, background: 'white', color: 'var(--blauw)', borderColor: 'var(--blauw)' },
    gevaar: { ...basis, background: 'white', color: 'var(--rood)', borderColor: 'var(--rood)' },
  }
  return <button style={s[variant]} onClick={onClick} disabled={disabled}>{children}</button>
}

const labelStijl: React.CSSProperties = { display: 'block', fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '4px' }
const invoerStijl: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid var(--rand)', borderRadius: '6px', fontSize: '13px', fontFamily: 'Arial', background: 'white', color: 'var(--tekst)', outline: 'none' }
