'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVergaderingen } from '@/hooks/useVergaderingen'
import { useAuth } from '@/hooks/useAuth'
import { ApiDocument } from '@/lib/types'
import AgendaEditor from '@/components/AgendaEditor'
import { CentraalKalenderItem } from '@/lib/kalender'
import DocumentenSelector from '@/components/DocumentenSelector'
import Leesweergave from '@/components/Leesweergave'
import Melding from '@/components/Melding'
import Actielijst from '@/components/Actielijst'
import SupabaseFout, { OpslaanFoutBanner } from '@/components/SupabaseFout'
import Stemlijst from '@/components/Stemlijst'
import KalenderTab from '@/components/KalenderTab'
import AanwezigheidChecklist from '@/components/AanwezigheidChecklist'
import Kalender from '@/components/Kalender'

interface Props { params: { id: string } }
type Tabblad = 'details' | 'agenda' | 'acties' | 'kalender' | 'stemlijst' | 'documenten' | 'lees'

export default function VergaderingEditorPagina({ params }: Props) {
  const { id } = params
  const router = useRouter()
  const { isAdmin, geladen: authGeladen } = useAuth()
  const {
    vergaderingen, geladen, opslaan, supabaseFout, opslaanFout, herlaad, sluitOpslaanFout, update,
    updatePunt, verwijderPunt, voegPuntToe,
    voegSubpuntToe, verwijderSubpunt, updateSubpunt,
    herorden,
    voegActieToe, toggleActie, verwijderActie, neemActiesOver, updateActie,
    voegKalenderItemToe, verwijderKalenderItem, updateKalenderItem,
  } = useVergaderingen()

  const [tabblad, setTabblad] = useState<Tabblad>('details')
  const [melding, setMelding] = useState<{ type: 'succes' | 'info' | 'fout'; tekst: string } | null>(null)
  const [toonOvernemen, setToonOvernemen] = useState(false)

  if (!geladen || !authGeladen) return <div style={{ textAlign: 'center', padding: '80px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>⏳ Laden...</div>
  if (!isAdmin) { router.push('/inloggen?admin=1'); return null }

  const v = vergaderingen.find(x => x.id === id)
  if (!v) return <div style={{ fontFamily: 'Arial', padding: '40px', color: 'var(--rood)' }}>Vergadering niet gevonden.</div>

  const andereVergaderingen = vergaderingen.filter(x => x.id !== id && (x.actielijst?.length || 0) > 0)
  const vorigeVergadering = vergaderingen
    .filter(x => x.id !== id && x.datum && x.datum < (v.datum || '9999'))
    .sort((a, b) => b.datum.localeCompare(a.datum))[0] || null

  const kopieerDeellink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/lees/${v.deeltoken}`).then(() => {
      setMelding({ type: 'succes', tekst: 'Deellink gekopieerd!' })
      setTimeout(() => setMelding(null), 3000)
    })
  }

  const voegDocsDirectToe = async (geselecteerd: ApiDocument[], doelType: 'raadsmededelingen' | 'vragen') => {
    const nieuwePunten = JSON.parse(JSON.stringify(v.punten))
    geselecteerd.forEach(doc => {
      const puntIndex = nieuwePunten.findIndex((p: { apiType?: string }) =>
        doelType === 'raadsmededelingen' ? p.apiType === 'raadsmededelingen' : p.apiType === 'vragen'
      )
      if (puntIndex >= 0) {
        const punt = nieuwePunten[puntIndex]
        punt.subpunten.push({ 
                  id: String.fromCharCode(97 + punt.subpunten.length), 
                  titel: doc.titel, 
                  url: doc.url, 
                  afgedaan: !!(doc.afgedaan && doc.afgedaan !== ''),
                  publicatiedatum: doc.publicatiedatum || doc.afgedaan || '',
                  toelichting: doc.afgedaan && doc.afgedaan !== 'Afgedaan' ? `Afgedaan: ${doc.afgedaan}` : '',
                })
      }
    })
    await update(id, { punten: nieuwePunten })
    setMelding({ type: 'succes', tekst: `${geselecteerd.length} document(en) toegevoegd aan de agenda.` })
    setTabblad('agenda')
  }

  // Kalenderitem toevoegen als bespreekpunt onder "Te bespreken"
  const voegKalenderItemToeAanAgenda = async (item: CentraalKalenderItem) => {
    const nieuwePunten = JSON.parse(JSON.stringify(v.punten))
    const teBespreken = nieuwePunten.find((p: { titel: string }) =>
      p.titel.toLowerCase().includes('te bespreken')
    )
    if (teBespreken) {
      const letter = String.fromCharCode(97 + teBespreken.subpunten.length)
      const datumNL = new Date(item.datum + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })
      teBespreken.subpunten.push({
        id: letter,
        titel: `${item.omschrijving}${item.locatie ? ` — ${item.locatie}` : ''} (${datumNL})`,
        url: '', afgedaan: false,
      })
    }
    await update(id, { punten: nieuwePunten })
    setMelding({ type: 'succes', tekst: `"${item.omschrijving}" toegevoegd aan Te bespreken` })
    setTimeout(() => setMelding(null), 3000)
  }

  const neemPuntOver = async (puntIndex: number) => {
    if (!vorigeVergadering) return
    const over = JSON.parse(JSON.stringify(vorigeVergadering.punten[puntIndex]))
    const nieuweId = v.punten.length + 1
    over.id = nieuweId
    const nieuwePunten = [...v.punten, over]
    nieuwePunten.forEach((p, i) => { p.id = i + 1 })
    await update(id, { punten: nieuwePunten })
    setToonOvernemen(false)
    setMelding({ type: 'succes', tekst: `Punt "${over.titel}" overgenomen` })
    setTimeout(() => setMelding(null), 3000)
  }

  const TABS: { key: Tabblad; label: string; badge?: number }[] = [
    { key: 'details', label: 'Gegevens' },
    { key: 'agenda', label: 'Agenda' },
    { key: 'acties', label: 'Actielijst', badge: v.actielijst?.filter(a => !a.afgedaan).length },
    { key: 'kalender', label: '📅 Fract.kalender' },
    { key: 'documenten', label: 'Documenten' },
    { key: 'stemlijst', label: '⚖️ Stemlijst', badge: v.heeftRaadsvergadering ? undefined : undefined },
    { key: 'lees', label: 'Leesweergave' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => router.push('/')} style={btnOutline}>← Terug</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', color: 'var(--blauw)', fontWeight: 'normal', margin: 0 }}>{v.titel || 'Vergadering'}</h1>
            <span style={{ fontSize: '11px', background: '#f0ede8', color: 'var(--tekst-zacht)', padding: '2px 7px', borderRadius: '3px', fontFamily: 'Arial' }}>versie {v.versie || 1}</span>
          </div>
        </div>
        {opslaan && <span style={{ fontSize: '12px', color: 'var(--tekst-zacht)', fontFamily: 'Arial' }}>💾 Opslaan...</span>}
        <button onClick={kopieerDeellink} style={btnOutline}>🔗 Deel</button>
        <button onClick={() => router.push(`/lees/${v.deeltoken}`)} style={btnAccent}>👁 Bekijken</button>
        <button onClick={() => window.open(`/presentatie/${v.deeltoken}`, '_blank')} style={{ ...btnOutline, background: '#1a3a5c', color: '#e8c84a', borderColor: '#e8c84a' }}>📺 Presenteren</button>
      </div>

      {melding && <Melding type={melding.type} tekst={melding.tekst} onSluit={() => setMelding(null)} />}

      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--rand)', marginBottom: '24px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTabblad(t.key)} style={{
            background: 'none', border: 'none', padding: '10px 16px', fontSize: '13px', fontFamily: 'Arial', cursor: 'pointer',
            color: tabblad === t.key ? 'var(--blauw)' : 'var(--tekst-zacht)',
            borderBottom: tabblad === t.key ? '2px solid var(--blauw)' : '2px solid transparent',
            marginBottom: '-1px', fontWeight: tabblad === t.key ? 'bold' : 'normal',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span style={{ background: t.key === 'acties' ? '#c8a84b' : 'var(--blauw)', color: 'white', fontSize: '10px', padding: '1px 5px', borderRadius: '8px' }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tabblad === 'details' && (
        <DetailsTab vergadering={v} onUpdate={(w) => update(id, w)} onNaarAgenda={() => setTabblad('agenda')} />
      )}
      {tabblad === 'agenda' && (
        <>
          {vorigeVergadering && (
            <div style={{ marginBottom: '12px' }}>
              <button onClick={() => setToonOvernemen(!toonOvernemen)}
                style={{ background: 'white', color: '#5a1a8a', border: '1px solid #c0a0d8', padding: '7px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}>
                ← Punt overnemen van {vorigeVergadering.titel}
              </button>
              {toonOvernemen && (
                <div style={{ marginTop: '8px', border: '1px solid #c0a0d8', borderRadius: '10px', overflow: 'hidden', background: 'white' }}>
                  <div style={{ padding: '10px 14px', background: '#f5eeff', borderBottom: '1px solid #c0a0d8', fontSize: '13px', fontFamily: 'Arial', color: '#4a1a5c', fontWeight: '600' }}>
                    Kies een punt om over te nemen:
                  </div>
                  {vorigeVergadering.punten.map((punt, pi) => (
                    <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: pi < vorigeVergadering.punten.length - 1 ? '1px solid #f0ede8' : 'none', cursor: 'pointer' }}
                      onClick={() => neemPuntOver(pi)}
                      onMouseOver={e => (e.currentTarget.style.background = '#faf5ff')}
                      onMouseOut={e => (e.currentTarget.style.background = 'white')}>
                      <span style={{ fontSize: '12px', color: '#888', minWidth: '24px' }}>{punt.id}.</span>
                      {punt.puntType === 'politieke_avond' && <span style={{ fontSize: '10px', background: '#e8f0f8', color: '#1a5c8a', border: '1px solid #a0c0e0', padding: '1px 5px', borderRadius: '3px' }}>PA</span>}
                      {punt.puntType === 'raadsvergadering' && <span style={{ fontSize: '10px', background: '#f0e8f8', color: '#5a1a8a', border: '1px solid #c0a0d8', padding: '1px 5px', borderRadius: '3px' }}>RV</span>}
                      <span style={{ flex: 1, fontSize: '13px', fontFamily: 'Arial', color: 'var(--tekst)' }}>{punt.titel}</span>
                      {punt.subpunten?.length > 0 && <span style={{ fontSize: '11px', color: '#888' }}>{punt.subpunten.length} subpunten</span>}
                      <span style={{ fontSize: '12px', color: '#5a1a8a' }}>+ Overnemen</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <AgendaEditor
          vergaderingId={id} punten={v.punten}
          onUpdatePunt={(pi, w) => updatePunt(id, pi, w)}
          onVerwijderPunt={(pi) => verwijderPunt(id, pi)}
          onVoegPuntToe={() => voegPuntToe(id)}
          onVoegSubpuntToe={(pi) => voegSubpuntToe(id, pi)}
          onVerwijderSubpunt={(pi, si) => verwijderSubpunt(id, pi, si)}
          onUpdateSubpunt={(pi, si, w) => updateSubpunt(id, pi, si, w)}
          onSyncDocumenten={() => setTabblad('documenten')} ladenSync={false}
          onHerorden={(nieuw) => herorden(id, nieuw)}
        />
        </>
      )}
      {tabblad === 'acties' && (
        <Actielijst
          acties={v.actielijst || []}
          vergaderingen={andereVergaderingen}
          vergaderingId={id}
          onVoegToe={(naam, actie) => voegActieToe(id, naam, actie)}
          onToggle={(actieId) => toggleActie(id, actieId)}
          onVerwijder={(actieId) => verwijderActie(id, actieId)}
          onNeemOver={(vanId) => neemActiesOver(id, vanId)}
        />
      )}
      {tabblad === 'kalender' && (
        <KalenderTab onVoegToeAanAgenda={voegKalenderItemToeAanAgenda} />
      )}

      {tabblad === 'stemlijst' && (
        <Stemlijst punten={v.punten} rvDatum={v.raadsvergaderingDatum} />
      )}
      {tabblad === 'documenten' && (
        <DocumentenSelector
          onVoegRMToe={(docs) => voegDocsDirectToe(docs, 'raadsmededelingen')}
          onVoegVragenToe={(docs) => voegDocsDirectToe(docs, 'vragen')}
        />
      )}
      {tabblad === 'lees' && (
        <div style={{ maxWidth: '680px' }}>
          <Leesweergave vergadering={v} toonPrintKnop />
        </div>
      )}
      {opslaanFout && <OpslaanFoutBanner onSluit={sluitOpslaanFout} />}
    </div>
  )
}

function DetailsTab({ vergadering: v, onUpdate, onNaarAgenda }: {
  vergadering: { titel: string; datum: string; aanvang: string; locatie: string; aanwezig: string; online: string; afwezig: string }
  onUpdate: (w: object) => void
  onNaarAgenda: () => void
}) {
  return (
    <div style={{ maxWidth: '560px' }}>
      <Invoerveld label="Titel vergadering">
        <input style={invoerStijl} value={v.titel || ''} onChange={e => onUpdate({ titel: e.target.value })} />
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
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '10px' }}>Aanwezigheid</label>
        <AanwezigheidChecklist
          aanwezig={v.aanwezig || ''}
          afwezig={v.afwezig || ''}
          online={v.online || ''}
          onUpdate={onUpdate}
        />
      </div>
      <button onClick={onNaarAgenda} style={btnOutline}>Naar agenda bewerken →</button>
    </div>
  )
}

function Invoerveld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

const invoerStijl: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid var(--rand)', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial', background: 'white', color: 'var(--tekst)', outline: 'none' }
const btnOutline: React.CSSProperties = { background: 'white', color: 'var(--blauw)', border: '1px solid var(--blauw)', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }
const btnAccent: React.CSSProperties = { background: 'var(--accent)', color: 'var(--blauw)', border: '1px solid var(--accent)', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', fontWeight: 'bold' }
