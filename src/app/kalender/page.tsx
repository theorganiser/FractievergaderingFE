'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useKalender } from '@/hooks/useKalender'
import { useAuth } from '@/hooks/useAuth'
import { CentraalKalenderItem } from '@/lib/kalender'
import { eersteVolgendeMaandag } from '@/lib/datum'

export default function KalenderPagina() {
  const { items, geladen, bezig, voegToe, update, verwijder } = useKalender(false)
  const { isAdmin, geladen: authGeladen } = useAuth()
  const [toonHistorisch, setToonHistorisch] = useState(false)
  const [toonFormulier, setToonFormulier] = useState(false)
  const [bewerkId, setBewerkId] = useState<string | null>(null)
  const [formulier, setFormulier] = useState({
    datum: eersteVolgendeMaandag(),
    starttijd: '',
    omschrijving: '',
    locatie: 'Gemeentehuis Bussum',
    personen: '',
  })

  const vandaag = new Date().toISOString().split('T')[0]

  const zichtbareItems = toonHistorisch
    ? items
    : items.filter(i => i.datum >= vandaag)

  const verledenItems = items.filter(i => i.datum < vandaag)
  const toekomstItems = items.filter(i => i.datum >= vandaag)

  const resetFormulier = () => {
    setFormulier({ datum: eersteVolgendeMaandag(), starttijd: '', omschrijving: '', locatie: 'Gemeentehuis Bussum', personen: '' })
    setToonFormulier(false)
    setBewerkId(null)
  }

  const openBewerken = (item: CentraalKalenderItem) => {
    setFormulier({ datum: item.datum, starttijd: item.starttijd || '', omschrijving: item.omschrijving, locatie: item.locatie, personen: item.personen })
    setBewerkId(item.id)
    setToonFormulier(true)
  }

  const handleOpslaan = async () => {
    if (!formulier.omschrijving.trim() || !formulier.datum) return
    if (bewerkId) {
      await update(bewerkId, formulier)
    } else {
      await voegToe(formulier)
    }
    resetFormulier()
  }

  const formatDatum = (datum: string) => {
    try {
      return new Date(datum + 'T12:00:00').toLocaleDateString('nl-NL', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
      })
    } catch { return datum }
  }

  const isVandaag = (datum: string) => datum === vandaag
  const isMorgen = (datum: string) => {
    const morgen = new Date()
    morgen.setDate(morgen.getDate() + 1)
    return datum === morgen.toISOString().split('T')[0]
  }

  if (!geladen) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
      ⏳ Kalender laden...
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--blauw)', fontWeight: '600', margin: 0 }}>
            📅 Fractiekalender
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--tekst-zacht)', margin: '2px 0 0', fontFamily: 'Arial' }}>
            Goois Democratisch Platform — {toekomstItems.length} aankomende evenementen
          </p>
        </div>
        {authGeladen && (
          <button
            onClick={() => { resetFormulier(); setToonFormulier(true) }}
            style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600' }}
          >
            + Evenement toevoegen
          </button>
        )}
      </div>

      <div style={{ height: '2px', background: 'linear-gradient(to right, var(--blauw), #a89060, transparent)', margin: '12px 0 20px' }} />

      {/* Formulier */}
      {toonFormulier && (
        <div style={{ background: 'white', border: '2px solid var(--blauw)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--blauw)', fontFamily: 'Arial', fontWeight: '600', margin: '0 0 16px' }}>
            {bewerkId ? 'Evenement bewerken' : 'Nieuw evenement'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStijl}>Datum *</label>
              <input type="date" style={invoerStijl} value={formulier.datum}
                onChange={e => setFormulier(f => ({ ...f, datum: e.target.value }))} />
            </div>
            <div>
              <label style={labelStijl}>Starttijd</label>
              <input type="time" style={invoerStijl} value={formulier.starttijd}
                onChange={e => setFormulier(f => ({ ...f, starttijd: e.target.value }))} />
            </div>
            <div>
              <label style={labelStijl}>Locatie</label>
              <input style={invoerStijl} placeholder="Locatie" value={formulier.locatie}
                onChange={e => setFormulier(f => ({ ...f, locatie: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStijl}>Omschrijving *</label>
            <input style={invoerStijl} placeholder="Wat is het evenement?" value={formulier.omschrijving}
              onChange={e => setFormulier(f => ({ ...f, omschrijving: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleOpslaan()} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStijl}>Wie (optioneel)</label>
            <input style={invoerStijl} placeholder="Namen gescheiden door komma" value={formulier.personen}
              onChange={e => setFormulier(f => ({ ...f, personen: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleOpslaan} disabled={!formulier.omschrijving.trim() || !formulier.datum || bezig}
              style={{ background: 'var(--blauw)', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: '600', opacity: (!formulier.omschrijving.trim() || !formulier.datum) ? 0.5 : 1 }}>
              {bezig ? '⏳ Opslaan...' : bewerkId ? '✓ Opslaan' : '+ Toevoegen'}
            </button>
            <button onClick={resetFormulier}
              style={{ background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '9px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial' }}>
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Aankomende evenementen */}
      {toekomstItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
          <p>Geen aankomende evenementen.</p>
          {isAdmin && <p style={{ marginTop: '8px', fontSize: '13px' }}>Gebruik de knop rechtsboven om er een toe te voegen.</p>}
        </div>
      ) : (
        <div>
          {toekomstItems.map(item => (
            <KalenderRij key={item.id} item={item} isAdmin={isAdmin}
              isVandaag={isVandaag(item.datum)} isMorgen={isMorgen(item.datum)}
              formatDatum={formatDatum}
              onBewerk={() => openBewerken(item)}
              onVerwijder={() => { if (confirm('Verwijderen?')) verwijder(item.id) }}
            />
          ))}
        </div>
      )}

      {/* Historische items */}
      {verledenItems.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <button onClick={() => setToonHistorisch(!toonHistorisch)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', color: 'var(--tekst-zacht)', padding: '8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {toonHistorisch ? '▾' : '▸'} {verledenItems.length} historische evenementen
          </button>
          {toonHistorisch && verledenItems.map(item => (
            <KalenderRij key={item.id} item={item} isAdmin={isAdmin}
              isVandaag={false} isMorgen={false} historisch
              formatDatum={formatDatum}
              onBewerk={() => openBewerken(item)}
              onVerwijder={() => { if (confirm('Verwijderen?')) verwijder(item.id) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function KalenderRij({ item, isAdmin, isVandaag, isMorgen, historisch, formatDatum, onBewerk, onVerwijder }: {
  item: CentraalKalenderItem
  isAdmin: boolean
  isVandaag: boolean
  isMorgen: boolean
  historisch?: boolean
  formatDatum: (d: string) => string
  onBewerk: () => void
  onVerwijder: () => void
}) {
  return (
    <div style={{
      background: isVandaag ? '#fff8e8' : isMorgen ? '#f5eeff' : 'white',
      border: `1px solid ${isVandaag ? '#e8c84a' : isMorgen ? '#c0a0d8' : 'var(--rand)'}`,
      borderRadius: '8px', padding: '12px 16px', marginBottom: '8px',
      display: 'flex', alignItems: 'center', gap: '16px',
      opacity: historisch ? 0.6 : 1,
      boxShadow: isVandaag ? '0 2px 8px rgba(232,200,74,0.2)' : 'none',
    }}>
      {/* Datum blok */}
      <div style={{ textAlign: 'center', minWidth: '52px', flexShrink: 0 }}>
        <div style={{ fontSize: '22px', fontWeight: '700', color: isVandaag ? '#a86a00' : isMorgen ? '#4a1a5c' : 'var(--blauw)', lineHeight: 1 }}>
          {new Date(item.datum + 'T12:00:00').getDate()}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {new Date(item.datum + 'T12:00:00').toLocaleDateString('nl-NL', { month: 'short' })}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
          {new Date(item.datum + 'T12:00:00').getFullYear()}
        </div>
      </div>

      <div style={{ width: '1px', height: '40px', background: 'var(--rand)', flexShrink: 0 }} />

      {/* Inhoud */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '15px', fontFamily: 'Georgia, serif', color: 'var(--tekst)' }}>
            {item.omschrijving}
          </span>
          {isVandaag && <span style={{ fontSize: '10px', background: '#e8c84a', color: '#7a5000', padding: '2px 7px', borderRadius: '3px', fontFamily: 'Arial', fontWeight: 'bold' }}>VANDAAG</span>}
          {isMorgen && <span style={{ fontSize: '10px', background: '#f5eeff', color: '#4a1a5c', border: '1px solid #c0a0d8', padding: '2px 7px', borderRadius: '3px', fontFamily: 'Arial', fontWeight: 'bold' }}>MORGEN</span>}
        </div>
        <div style={{ display: 'flex', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
          {item.locatie && (
            <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '3px' }}>
              📍 {item.locatie}
            </span>
          )}
          {item.personen && (
            <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', display: 'flex', alignItems: 'center', gap: '3px' }}>
              👤 {item.personen}
            </span>
          )}
          {!item.locatie && !item.personen && (
            <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>
              {new Date(item.datum + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long' })}
            </span>
          )}
        </div>
      </div>

      {/* Acties - alleen admin */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button onClick={onBewerk} style={{ background: 'none', border: '1px solid var(--rand)', color: 'var(--tekst-zacht)', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}>
            ✎ Bewerken
          </button>
          <button onClick={onVerwijder} style={{ background: 'none', border: '1px solid #e8a090', color: 'var(--rood)', padding: '5px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

const labelStijl: React.CSSProperties = {
  display: 'block', fontSize: '11px', color: 'var(--tekst-zacht)',
  fontFamily: 'Arial', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px',
}
const invoerStijl: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid var(--rand)',
  borderRadius: '6px', fontSize: '13px', fontFamily: 'Arial',
  background: 'white', color: 'var(--tekst)', outline: 'none', boxSizing: 'border-box' as const,
}
