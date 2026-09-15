'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Bijlage } from '@/lib/types'

const TOEGESTANE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_GROOTTE = 10 * 1024 * 1024 // 10MB

function formatGrootte(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function BijlageKnop({ aantal, open, onClick }: { aantal: number; open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} title={aantal > 0 ? `${aantal} bijlage${aantal > 1 ? 's' : ''}` : 'Bijlage toevoegen'}
      className="no-print"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px', flexShrink: 0,
        background: aantal > 0 ? '#e8f0f8' : open ? '#f0ede8' : 'transparent',
        border: `1px solid ${aantal > 0 ? '#a0c0e0' : 'var(--rand)'}`,
        color: aantal > 0 ? '#1a5c8a' : 'var(--tekst-zacht)',
        fontSize: '11px', fontFamily: 'Arial', fontWeight: aantal > 0 ? 'normal' : 'bold',
        width: aantal > 0 ? undefined : '18px', height: aantal > 0 ? undefined : '18px',
        padding: aantal > 0 ? '1px 6px' : 0, borderRadius: aantal > 0 ? '9px' : '50%',
        cursor: 'pointer',
      }}>
      {aantal > 0 ? <>📎 {aantal}</> : '📎'}
    </button>
  )
}

export function BijlagePaneel({ bijlagen, vergaderingId, naam, onToegevoegd, onVerwijderd }: {
  bijlagen?: Bijlage[]
  vergaderingId: string
  naam: string
  onToegevoegd: (bijlage: { naam: string; pad: string; type: string; grootte: number; uploader: string }) => void
  onVerwijderd: (bijlageId: string) => void
}) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [bezigVerwijderId, setBezigVerwijderId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadBestand = async (file: File) => {
    setFout('')
    if (!TOEGESTANE_TYPES.includes(file.type)) {
      setFout('Alleen PDF of afbeeldingen (jpg, png, webp, gif) zijn toegestaan.')
      return
    }
    if (file.size > MAX_GROOTTE) {
      setFout(`Bestand is te groot (max ${MAX_GROOTTE / 1024 / 1024}MB).`)
      return
    }
    setBezig(true)
    try {
      const res = await fetch('/api/bijlagen/upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vergaderingId, type: file.type, grootte: file.size, bestandsnaam: file.name }),
      })
      const data = await res.json()
      if (data.fout) { setFout(data.fout); setBezig(false); return }

      const { error: uploadFout } = await supabase.storage.from('bijlagen').uploadToSignedUrl(data.pad, data.token, file)
      if (uploadFout) { setFout('Uploaden mislukt. Probeer het opnieuw.'); setBezig(false); return }

      onToegevoegd({ naam: file.name, pad: data.pad, type: file.type, grootte: file.size, uploader: naam || 'Onbekend' })
    } catch {
      setFout('Er ging iets mis bij het uploaden.')
    }
    setBezig(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const bekijk = async (pad: string) => {
    try {
      const res = await fetch('/api/bijlagen/bekijk-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pad }),
      })
      const data = await res.json()
      if (data.url) window.open(data.url, '_blank')
    } catch { /* stil falen, gebruiker kan het opnieuw proberen */ }
  }

  const verwijder = async (bijlage: Bijlage) => {
    setBezigVerwijderId(bijlage.id)
    try {
      await fetch('/api/bijlagen/verwijderen', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pad: bijlage.pad }),
      })
    } catch { /* metadata alsnog verwijderen, ook als storage-delete mislukt */ }
    onVerwijderd(bijlage.id)
    setBezigVerwijderId(null)
  }

  return (
    <div className="no-print" style={{ margin: '2px 0 8px 14px', padding: '10px 12px', background: '#fafaf8', border: '1px solid var(--rand)', borderRadius: '8px', maxWidth: '520px' }}>
      {bijlagen && bijlagen.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          {bijlagen.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <button onClick={() => bekijk(b.pad)}
                style={{ background: 'none', border: 'none', color: '#1a5c8a', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', padding: 0, textAlign: 'left' as const, flex: 1 }}>
                📎 {b.naam}
              </button>
              <span style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', flexShrink: 0 }}>{formatGrootte(b.grootte)} · {b.uploader}</span>
              <button onClick={() => verwijder(b)} disabled={bezigVerwijderId === b.id}
                style={{ background: 'none', border: 'none', color: 'var(--rood)', cursor: 'pointer', fontSize: '12px', padding: '0 2px', flexShrink: 0 }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept={TOEGESTANE_TYPES.join(',')} disabled={bezig}
        onChange={e => e.target.files?.[0] && uploadBestand(e.target.files[0])}
        style={{ fontSize: '12px', fontFamily: 'Arial' }} />
      {bezig && <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', margin: '6px 0 0' }}>⏳ Uploaden...</p>}
      {fout && <p style={{ fontSize: '12px', color: 'var(--rood)', fontFamily: 'Arial', margin: '6px 0 0' }}>⚠️ {fout}</p>}
    </div>
  )
}
