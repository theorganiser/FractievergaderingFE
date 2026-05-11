'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVergaderingen } from '@/hooks/useVergaderingen'
import { useAuth } from '@/hooks/useAuth'
import { ApiDocument, Subpunt } from '@/lib/types'
import { startSync, haalNieuweDocumenten, DEMO_DOCUMENTEN } from '@/lib/api'
import { vandaag } from '@/lib/datum'
import AgendaEditor from '@/components/AgendaEditor'
import DocumentenSelector from '@/components/DocumentenSelector'
import Leesweergave from '@/components/Leesweergave'
import Melding from '@/components/Melding'

interface Props {
  params: { id: string }
}

type Tabblad = 'details' | 'agenda' | 'documenten' | 'lees'

export default function VergaderingEditorPagina({ params }: Props) {
  const { id } = params
  const router = useRouter()
  const { isAdmin } = useAuth()
  const {
    vergaderingen, geladen,
    update, updatePunt, verwijderPunt, voegPuntToe,
    voegSubpuntToe, verwijderSubpunt, updateSubpunt,
  } = useVergaderingen()

  const [tabblad, setTabblad] = useState<Tabblad>('details')
  const [melding, setMelding] = useState<{ type: 'succes' | 'info' | 'fout'; tekst: string } | null>(null)
  const [ladenSync, setLadenSync] = useState(false)
  const [nieuweDocs, setNieuweDocs] = useState<ApiDocument[]>([])

  if (!geladen) return <div style={{ fontFamily: 'Arial', color: 'var(--tekst-zacht)', padding: '40px' }}>Laden...</div>
  if (!isAdmin) { router.push('/login'); return null }

  const v = vergaderingen.find(x => x.id === id)
  if (!v) return <div style={{ fontFamily: 'Arial', padding: '40px', color: 'var(--rood)' }}>Vergadering niet gevonden.</div>

  const kopieerDeellink = () => {
    const url = `${window.location.origin}/lees/${v.deeltoken}`
    navigator.clipboard.writeText(url).then(() => {
      setMelding({ type: 'succes', tekst: 'Deellink gekopieerd!' })
      setTimeout(() => setMelding(null), 3000)
    })
  }

  const syncDocumenten = async () => {
    setLadenSync(true)
    setMelding({ type: 'info', tekst: 'Scraper gestart, documenten worden opgehaald...' })
    try {
      await startSync()
      await new Promise(r => setTimeout(r, 2000))
      const datum = v.datum || vandaag()
      const docs = await haalNieuweDocumenten(datum)
      setNieuweDocs(docs)
      setMelding({ type: 'succes', tekst: `${docs.length} nieuw document(en) gevonden.` })
      setTabblad('documenten')
    } catch {
      setNieuweDocs(DEMO_DOCUMENTEN)
      setMelding({ type: 'info', tekst: 'Demogegevens geladen (API niet bereikbaar).' })
      setTabblad('documenten')
    }
    setLadenSync(false)
  }

  const voegDocsToeBekijkAl = (geselecteerd: ApiDocument[]) => {
    geselecteerd.forEach(doc => {
      const isRM = doc.type === 'raadsmededelingen'
      const puntnr = isRM ? 6 : 7
      const puntIndex = v.punten.findIndex(p => p.id === puntnr)
      if (puntIndex >= 0) {
        const punt = v.punten[puntIndex]
        const nieuweSubpunt: Subpunt = {
          id: String.fromCharCode(97 + punt.subpunten.length),
          titel: doc.titel,
          url: doc.url,
          afgedaan: doc.afgedaan === 'Afgedaan',
        }
        updateSubpunt(id, puntIndex, punt.subpunten.length, nieuweSubpunt)
        voegSubpuntToe(id, puntIndex)
        // Correctie: direct de subpunt data schrijven ipv voegSubpuntToe aanroepen
      }
    })
    // Alternatieve implementatie: batch update
    voegDocsDirectToe(geselecteerd)
    setNieuweDocs([])
    setMelding({ type: 'succes', tekst: `${geselecteerd.length} document(en) toegevoegd aan de agenda.` })
    setTabblad('agenda')
  }

  const voegDocsDirectToe = (geselecteerd: ApiDocument[]) => {
    const nieuwePunten = JSON.parse(JSON.stringify(v.punten))
    geselecteerd.forEach(doc => {
      const isRM = doc.type === 'raadsmededelingen'
      const puntnr = isRM ? 6 : 7
      const puntIndex = nieuwePunten.findIndex((p: { id: number }) => p.id === puntnr)
      if (puntIndex >= 0) {
        const punt = nieuwePunten[puntIndex]
        punt.subpunten.push({
          id: String.fromCharCode(97 + punt.subpunten.length),
          titel: doc.titel,
          url: doc.url,
          afgedaan: doc.afgedaan === 'Afgedaan',
        })
      }
    })
    update(id, { punten: nieuwePunten })
  }

  const TABS: { key: Tabblad; label: string }[] = [
    { key: 'details', label: 'Gegevens' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'documenten', label: 'Documenten' },
    { key: 'lees', label: 'Leesweergave' },
  ]

  return (
    <div>
      {/* Bovenste balk */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => router.push('/')}
          style={{ background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}
        >
          ← Terug
        </button>
        <h1 style={{ fontSize: '20px', color: 'var(--blauw)', fontWeight: 'normal', flex: 1, margin: 0 }}>
          {v.titel || 'Vergadering bewerken'}
        </h1>
        <button onClick={kopieerDeellink} style={btnStijlOutline}>🔗 Kopieer deellink</button>
        <button onClick={() => router.push(`/lees/${v.deeltoken}`)} style={btnStijlAccent}>👁 Leesweergave</button>
      </div>

      {melding && <Melding type={melding.type} tekst={melding.tekst} onSluit={() => setMelding(null)} />}

      {/* Tabbladen */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--rand)', marginBottom: '24px' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTabblad(t.key)}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 18px',
              fontSize: '13px',
              fontFamily: 'Arial, sans-serif',
              cursor: 'pointer',
              color: tabblad === t.key ? 'var(--blauw)' : 'var(--tekst-zacht)',
              borderBottom: tabblad === t.key ? '2px solid var(--blauw)' : '2px solid transparent',
              marginBottom: '-1px',
              fontWeight: tabblad === t.key ? 'bold' : 'normal',
            }}
          >
            {t.label}
            {t.key === 'documenten' && nieuweDocs.length > 0 && (
              <span style={{ marginLeft: '6px', background: 'var(--accent)', color: 'var(--blauw)', fontSize: '10px', padding: '1px 5px', borderRadius: '8px', fontWeight: 'bold' }}>
                {nieuweDocs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Inhoud per tabblad */}
      {tabblad === 'details' && (
        <DetailsTab vergadering={v} onUpdate={(w) => update(id, w)} onNaarAgenda={() => setTabblad('agenda')} />
      )}
      {tabblad === 'agenda' && (
        <AgendaEditor
          vergaderingId={id}
          punten={v.punten}
          onUpdatePunt={(pi, w) => updatePunt(id, pi, w)}
          onVerwijderPunt={(pi) => verwijderPunt(id, pi)}
          onVoegPuntToe={() => voegPuntToe(id)}
          onVoegSubpuntToe={(pi) => voegSubpuntToe(id, pi)}
          onVerwijderSubpunt={(pi, si) => verwijderSubpunt(id, pi, si)}
          onUpdateSubpunt={(pi, si, w) => updateSubpunt(id, pi, si, w)}
          onSyncDocumenten={syncDocumenten}
          ladenSync={ladenSync}
        />
      )}
      {tabblad === 'documenten' && (
        <DocumentenSelector
          documenten={nieuweDocs}
          onToevoegen={voegDocsDirectToe}
          onSyncNu={syncDocumenten}
          laden={ladenSync}
        />
      )}
      {tabblad === 'lees' && (
        <div style={{ maxWidth: '680px' }}>
          <Leesweergave vergadering={v} toonPrintKnop />
        </div>
      )}
    </div>
  )
}

// Details tab component
function DetailsTab({
  vergadering: v,
  onUpdate,
  onNaarAgenda,
}: {
  vergadering: ReturnType<typeof useVergaderingen>['vergaderingen'][0]
  onUpdate: (w: Partial<typeof v>) => void
  onNaarAgenda: () => void
}) {
  return (
    <div style={{ maxWidth: '560px' }}>
      <Invoerveld label="Titel vergadering">
        <input
          style={invoerStijl}
          value={v.titel || ''}
          onChange={e => onUpdate({ titel: e.target.value })}
        />
      </Invoerveld>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Invoerveld label="Datum">
          <input type="date" style={invoerStijl} value={v.datum || ''} onChange={e => onUpdate({ datum: e.target.value })} />
        </Invoerveld>
        <Invoerveld label="Aanvang">
          <input type="time" style={invoerStijl} value={v.aanvang || '20:00'} onChange={e => onUpdate({ aanvang: e.target.value })} />
        </Invoerveld>
      </div>

      <Invoerveld label="Locatie">
        <input style={invoerStijl} value={v.locatie || ''} onChange={e => onUpdate({ locatie: e.target.value })} />
      </Invoerveld>

      <hr style={{ border: 'none', borderTop: '1px solid var(--rand)', margin: '20px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {(['aanwezig', 'online', 'afwezig'] as const).map(veld => (
          <div key={veld} style={{ background: 'var(--blauw-licht)', border: '1px solid #a0c0e0', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--blauw-mid)', fontFamily: 'Arial, sans-serif', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
              {veld.charAt(0).toUpperCase() + veld.slice(1)}
            </div>
            <textarea
              rows={3}
              style={{ ...invoerStijl, resize: 'vertical' }}
              value={v[veld] || ''}
              onChange={e => onUpdate({ [veld]: e.target.value })}
              placeholder="Namen, gescheiden door komma"
            />
          </div>
        ))}
      </div>

      <button onClick={onNaarAgenda} style={btnStijlOutline}>
        Naar agenda bewerken →
      </button>
    </div>
  )
}

function Invoerveld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial, sans-serif', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const invoerStijl: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--rand)',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'Arial, sans-serif',
  background: 'white',
  color: 'var(--tekst)',
  outline: 'none',
}

const btnStijlOutline: React.CSSProperties = {
  background: 'white',
  color: 'var(--blauw)',
  border: '1px solid var(--blauw)',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontFamily: 'Arial, sans-serif',
}

const btnStijlAccent: React.CSSProperties = {
  background: 'var(--accent)',
  color: 'var(--blauw)',
  border: '1px solid var(--accent)',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'bold',
}
