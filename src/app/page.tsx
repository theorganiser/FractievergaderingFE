'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useVergaderingen } from '@/hooks/useVergaderingen'
import { useAuth } from '@/hooks/useAuth'
import { formatDatum, sorteerOpDatum, eersteVolgendeMaandag, vandaag } from '@/lib/datum'
import { getSprekerNaam } from '@/components/Toegangspoort'
import Melding from '@/components/Melding'
import SupabaseFout, { OpslaanFoutBanner } from '@/components/SupabaseFout'
import { Vergadering } from '@/lib/types'

const MAX_WOORDEN = 15

interface NieuweOpties {
  heeftPA: boolean; paDatum: string; paUrl: string
  heeftRV: boolean; rvDatum: string; rvUrl: string
  vergaderingDatum: string
}

export default function OverzichtPagina() {
  const router = useRouter()
  const { vergaderingen, geladen, maakNieuwe, kopieer, verwijder, update, supabaseFout, opslaanFout, herlaad, sluitOpslaanFout } = useVergaderingen()
  const { isAdmin } = useAuth()
  const [melding, setMelding] = useState<{ type: 'succes' | 'info'; tekst: string } | null>(null)
  const [bezig, setBezig] = useState(false)
  const [toonDialoog, setToonDialoog] = useState(false)
  const [zoek, setZoek] = useState('')
  const [opties, setOpties] = useState<NieuweOpties>({
    heeftPA: false, paDatum: '', paUrl: '',
    heeftRV: false, rvDatum: '', rvUrl: '',
    vergaderingDatum: vandaag(),
  })
  // Agendapunt indienen
  const [indienVergadering, setIndienVergadering] = useState<Vergadering | null>(null)
  const [indienPunt, setIndienPunt] = useState('')
  const [indienBezig, setIndienBezig] = useState(false)
  const [sprekerNaam, setSprekerNaam] = useState('')

  useEffect(() => {
    setSprekerNaam(getSprekerNaam())
  }, [])

  useEffect(() => {
    if (toonDialoog) {
      setOpties(o => ({ ...o, vergaderingDatum: eersteVolgendeMaandag() }))
    }
  }, [toonDialoog])

  if (!geladen) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>⏳ Laden...</div>
  if (supabaseFout) return <SupabaseFout opnieuw={herlaad} />

  const gesorteerd = [...vergaderingen]
    .filter(v => !zoek ||
      v.titel.toLowerCase().includes(zoek.toLowerCase()) ||
      (v.datum && v.datum.includes(zoek)) ||
      (v.locatie || '').toLowerCase().includes(zoek.toLowerCase())
    )
    .sort(sorteerOpDatum)

  const isToekomstig = (datum: string) => datum >= vandaag()

  const aantalWoorden = (tekst: string) => tekst.trim().split(/\s+/).filter(Boolean).length

  const handleNieuw = (vanTemplate: boolean) => {
    if (vanTemplate) { setToonDialoog(true); return }
    setBezig(true)
    maakNieuwe({ vanTemplate: false, heeftPA: false, paDatum: '', paUrl: '', heeftRV: false, rvDatum: '', rvUrl: '', vergaderingDatum: vandaag() }).then(v => router.push(`/vergadering/${v.id}`))
  }

  const handleAanmaken = async () => {
    setBezig(true); setToonDialoog(false)
    const v = await maakNieuwe({ vanTemplate: true, ...opties })
    router.push(`/vergadering/${v.id}`)
  }

  const handleKopieer = async (id: string) => {
    setBezig(true)
    const kop = await kopieer(id)
    if (kop) router.push(`/vergadering/${kop.id}`)
  }

  const handleVerwijder = async (id: string) => {
    if (confirm('Vergadering verwijderen?')) await verwijder(id)
  }

  const kopieerDeellink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/lees/${token}`).then(() => {
      setMelding({ type: 'succes', tekst: 'Deellink gekopieerd!' })
      setTimeout(() => setMelding(null), 3000)
    })
  }

  const openIndienen = (v: Vergadering) => {
    setIndienVergadering(v)
    setIndienPunt('')
  }

  const handleIndienen = async () => {
    if (!indienVergadering || !indienPunt.trim()) return
    if (aantalWoorden(indienPunt) > MAX_WOORDEN) return

    setIndienBezig(true)
    const naam = sprekerNaam || 'Onbekend'
    const nieuwePunten = JSON.parse(JSON.stringify(indienVergadering.punten))

    // Zoek "Te bespreken" punt
    const teBespreken = nieuwePunten.find((p: { titel: string }) =>
      p.titel.toLowerCase().includes('te bespreken')
    )

    if (teBespreken) {
      const letter = String.fromCharCode(97 + teBespreken.subpunten.length)
      teBespreken.subpunten.push({
        id: letter,
        titel: `${indienPunt.trim()} (${naam})`,
        url: '',
        afgedaan: false,
      })
    }

    await update(indienVergadering.id, { punten: nieuwePunten })
    setIndienVergadering(null)
    setIndienPunt('')
    setIndienBezig(false)
    setMelding({ type: 'succes', tekst: `✓ Jouw agendapunt is ingediend bij "${indienVergadering.titel}"` })
    setTimeout(() => setMelding(null), 5000)
  }

  const woorden = aantalWoorden(indienPunt)
  const teVeel = woorden > MAX_WOORDEN

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>Fractievergaderingen</h1>
          <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', margin: '2px 0 0', fontFamily: 'Arial' }}>Goois Democratisch Platform — Gooise Meren</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Knop variant="outline" onClick={() => handleNieuw(false)} disabled={bezig}>+ Leeg</Knop>
            <Knop variant="primair" onClick={() => handleNieuw(true)} disabled={bezig}>{bezig ? '⏳ Bezig...' : '+ Nieuwe vergadering'}</Knop>
          </div>
        )}
      </div>

      <div style={{ height: '1px', background: 'linear-gradient(to right, var(--accent), transparent)', margin: '12px 0 16px' }} />

      {/* Zoekbalk */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tekst-zacht)', fontSize: '14px' }}>🔍</span>
        <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoeken op titel, datum of locatie..."
          style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '13px', fontFamily: 'Arial', outline: 'none', boxSizing: 'border-box' as const }} />
        {zoek && <button onClick={() => setZoek('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tekst-zacht)', fontSize: '16px' }}>×</button>}
      </div>

      {melding && <Melding type={melding.type} tekst={melding.tekst} onSluit={() => setMelding(null)} />}

      {/* Aanmaakdialoog */}
      {toonDialoog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,10,64,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '540px', maxWidth: '95vw', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--accent)', color: 'var(--blauw)', fontWeight: '900', fontSize: '12px', padding: '3px 8px', borderRadius: '3px' }}>GDP</div>
              <h2 style={{ fontSize: '17px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>Nieuwe fractievergadering</h2>
            </div>
            <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'var(--blauw-licht)', borderRadius: '8px', border: '1px solid #a0c0e0' }}>
              <label style={labelStijl}>Datum fractievergadering</label>
              <input type="date" style={invoerStijl} value={opties.vergaderingDatum} onChange={e => setOpties(o => ({ ...o, vergaderingDatum: e.target.value }))} />
              <p style={{ fontSize: '11px', color: 'var(--tekst-zacht)', marginTop: '5px', fontFamily: 'Arial' }}>Standaard ingesteld op de eerst volgende maandag</p>
            </div>
            <div style={{ marginBottom: '14px', padding: '14px 16px', border: `2px solid ${opties.heeftPA ? 'var(--blauw)' : 'var(--rand)'}`, borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: opties.heeftPA ? '12px' : '0' }}>
                <input type="checkbox" checked={opties.heeftPA} onChange={e => setOpties(o => ({ ...o, heeftPA: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: 'bold', color: 'var(--blauw)' }}>🏛 Er is een Politieke Avond</span>
              </label>
              {opties.heeftPA && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={labelStijl}>Datum PA</label><input type="date" style={invoerStijl} value={opties.paDatum} onChange={e => setOpties(o => ({ ...o, paDatum: e.target.value }))} /></div>
                  <div><label style={labelStijl}>Link agenda (optioneel)</label><input style={invoerStijl} placeholder="https://..." value={opties.paUrl} onChange={e => setOpties(o => ({ ...o, paUrl: e.target.value }))} /></div>
                </div>
              )}
            </div>
            <div style={{ marginBottom: '24px', padding: '14px 16px', border: `2px solid ${opties.heeftRV ? '#5a3a8a' : 'var(--rand)'}`, borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: opties.heeftRV ? '12px' : '0' }}>
                <input type="checkbox" checked={opties.heeftRV} onChange={e => setOpties(o => ({ ...o, heeftRV: e.target.checked }))} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px', fontFamily: 'Arial', fontWeight: 'bold', color: '#5a3a8a' }}>⚖️ Er is een Raadsvergadering</span>
              </label>
              {opties.heeftRV && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label style={labelStijl}>Datum RV</label><input type="date" style={invoerStijl} value={opties.rvDatum} onChange={e => setOpties(o => ({ ...o, rvDatum: e.target.value }))} /></div>
                  <div><label style={labelStijl}>Link agenda (optioneel)</label><input style={invoerStijl} placeholder="https://..." value={opties.rvUrl} onChange={e => setOpties(o => ({ ...o, rvUrl: e.target.value }))} /></div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Knop variant="outline" onClick={() => setToonDialoog(false)}>Annuleren</Knop>
              <Knop variant="primair" onClick={handleAanmaken}>Aanmaken →</Knop>
            </div>
          </div>
        </div>
      )}

      {/* Punt indienen dialoog */}
      {indienVergadering && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(45,10,64,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '32px', width: '480px', maxWidth: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ background: '#4a1a5c', color: '#a89060', fontWeight: '900', fontSize: '12px', padding: '3px 8px', borderRadius: '3px', fontFamily: 'Arial Black' }}>GDP</div>
              <h2 style={{ fontSize: '17px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>Agendapunt indienen</h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '20px' }}>
              {indienVergadering.titel} · {indienVergadering.datum ? formatDatum(indienVergadering.datum) : ''}
            </p>

            {/* Naam */}
            <div style={{ background: 'var(--blauw-licht)', border: '1px solid #c0a0d8', borderRadius: '8px', padding: '10px 14px', marginBottom: '18px', fontSize: '13px', fontFamily: 'Arial', color: 'var(--blauw)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👤</span>
              <span>Ingediend door: <strong>{sprekerNaam || 'Onbekend'}</strong></span>
            </div>

            {/* Invoer */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ ...labelStijl, marginBottom: '8px' }}>
                Agendapunt — maximaal {MAX_WOORDEN} woorden
              </label>
              <textarea
                rows={3}
                value={indienPunt}
                onChange={e => setIndienPunt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleIndienen() } }}
                placeholder="Beschrijf kort wat je wilt bespreken..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `2px solid ${teVeel ? 'var(--rood)' : '#dde3ed'}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'Arial',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box' as const,
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Woordteller */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', fontFamily: 'Arial', color: teVeel ? 'var(--rood)' : woorden > 12 ? 'var(--oranje)' : 'var(--tekst-zacht)', fontWeight: teVeel ? 'bold' : 'normal' }}>
                {woorden}/{MAX_WOORDEN} woorden {teVeel && '— te lang!'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Knop variant="outline" onClick={() => { setIndienVergadering(null); setIndienPunt('') }}>Annuleren</Knop>
              <Knop variant="primair" onClick={handleIndienen} disabled={!indienPunt.trim() || teVeel || indienBezig}>
                {indienBezig ? '⏳ Bezig...' : '✓ Indienen'}
              </Knop>
            </div>
          </div>
        </div>
      )}

      {/* Vergaderingenlijst */}
      {gesorteerd.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>📅</div>
          <p>Nog geen vergaderingen aangemaakt.</p>
        </div>
      ) : gesorteerd.map(v => {
        const toekomstig = v.datum && isToekomstig(v.datum)
        return (
          <div key={v.id} style={{ background: 'white', border: '1px solid var(--rand)', borderRadius: '10px', padding: '16px 20px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>{v.titel || 'Naamloos'}</h3>
                <span style={{ fontSize: '10px', background: '#f0ede8', color: 'var(--tekst-zacht)', padding: '1px 6px', borderRadius: '3px', fontFamily: 'Arial' }}>v{v.versie || 1}</span>
                {v.heeftPolitiekeAvond && <span style={{ fontSize: '10px', background: '#e8f0f8', color: 'var(--blauw)', border: '1px solid #a0c0e0', padding: '1px 6px', borderRadius: '3px' }}>PA</span>}
                {v.heeftRaadsvergadering && <span style={{ fontSize: '10px', background: '#f0e8f8', color: '#5a3a8a', border: '1px solid #c0a0d8', padding: '1px 6px', borderRadius: '3px' }}>RV</span>}
                {toekomstig && <span style={{ fontSize: '10px', background: '#e8f5ed', color: '#2d7a4f', border: '1px solid #a8d8b5', padding: '1px 6px', borderRadius: '3px', fontFamily: 'Arial' }}>Aankomend</span>}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {v.datum ? <span>📅 {formatDatum(v.datum)}</span> : <span style={{ color: 'var(--rood)' }}>Datum niet ingesteld</span>}
                {v.aanvang && <span>🕐 {v.aanvang} uur</span>}
                {v.locatie && <span>📍 {v.locatie}</span>}
                <span>{v.punten.length} punten</span>
                {(v.actielijst?.filter(a => !a.afgedaan).length || 0) > 0 && (
                  <span style={{ color: 'var(--oranje)' }}>⚡ {v.actielijst.filter(a => !a.afgedaan).length} open acties</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flexShrink: 0 }}>
              <Knop variant="outline" klein onClick={() => router.push(`/lees/${v.deeltoken}`)}>👁 Bekijken</Knop>
              {/* Agendapunt indienen — voor iedereen bij toekomstige vergaderingen */}
              {toekomstig && (
                <Knop variant="indienen" klein onClick={() => openIndienen(v)}>📝 Punt indienen</Knop>
              )}
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
        )
      })}
      {opslaanFout && <OpslaanFoutBanner onSluit={sluitOpslaanFout} />}
    </div>
  )
}

function Knop({ variant, klein, onClick, children, disabled }: {
  variant: 'primair' | 'outline' | 'gevaar' | 'indienen'
  klein?: boolean; onClick?: () => void; children: React.ReactNode; disabled?: boolean
}) {
  const basis: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: klein ? '5px 10px' : '8px 16px', borderRadius: '7px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: klein ? '12px' : '13px', fontFamily: 'Arial',
    border: '1px solid transparent', transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1, fontWeight: '500',
  }
  const s: Record<string, React.CSSProperties> = {
    primair: { ...basis, background: 'var(--blauw)', color: 'white', borderColor: 'var(--blauw)' },
    outline: { ...basis, background: 'white', color: 'var(--blauw)', borderColor: 'var(--blauw)' },
    gevaar: { ...basis, background: 'white', color: 'var(--rood)', borderColor: 'var(--rood)' },
    indienen: { ...basis, background: '#f5eeff', color: '#4a1a5c', borderColor: '#c0a0d8' },
  }
  return <button style={s[variant]} onClick={onClick} disabled={disabled}>{children}</button>
}

const labelStijl: React.CSSProperties = {
  display: 'block', fontSize: '11px', color: 'var(--tekst-zacht)',
  fontFamily: 'Arial', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px',
}
const invoerStijl: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid var(--rand)',
  borderRadius: '6px', fontSize: '13px', fontFamily: 'Arial',
  background: 'white', color: 'var(--tekst)', outline: 'none',
}
