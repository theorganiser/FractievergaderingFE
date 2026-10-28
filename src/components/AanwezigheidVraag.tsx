'use client'

import { useState } from 'react'
import { statusVan, AanwezigheidStatus } from '@/lib/aanwezigheid'
import { SESSIE_VERLOPEN } from '@/lib/dataApi'

export default function AanwezigheidVraag({ aanwezig, online, afwezig, naam, onKiezen, foutmelding }: {
  aanwezig: string; online: string; afwezig: string; naam: string
  // true = opgeslagen. Bij false blijft de pop-up open en tonen we de foutmelding.
  onKiezen: (status: AanwezigheidStatus) => Promise<boolean>
  foutmelding?: string | null
}) {
  const huidigeStatus = statusVan({ aanwezig, online, afwezig }, naam)

  const [toonWijzigen, setToonWijzigen] = useState(false)
  const [bezig, setBezig] = useState<AanwezigheidStatus | null>(null)
  const [mislukt, setMislukt] = useState(false)

  if (!naam) return null

  const moetVragen = huidigeStatus === null

  const kies = async (status: AanwezigheidStatus) => {
    setBezig(status)
    setMislukt(false)
    const ok = await onKiezen(status)
    setBezig(null)
    if (ok) setToonWijzigen(false)
    else setMislukt(true)
  }

  const sessieVerlopen = mislukt && foutmelding === SESSIE_VERLOPEN

  return (
    <>
      {huidigeStatus && !moetVragen && (
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst-zacht)', marginBottom: '14px' }}>
          <span>
            Jouw status: {huidigeStatus === 'aanwezig' ? '✓ Aanwezig' : huidigeStatus === 'online' ? '💻 Online' : '✗ Niet aanwezig'}
          </span>
          <button onClick={() => { setMislukt(false); setToonWijzigen(true) }}
            style={{ background: 'none', border: 'none', color: 'var(--blauw)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial', padding: 0 }}>
            wijzigen
          </button>
        </div>
      )}

      {(moetVragen || toonWijzigen) && (
        <div className="no-print" style={{ position: 'fixed', inset: 0, background: 'rgba(20,10,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '28px 30px', maxWidth: '360px', width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '17px', color: 'var(--blauw)', fontWeight: '600', margin: '0 0 6px', fontFamily: 'Arial' }}>Ben je aanwezig?</h2>
            <p style={{ fontSize: '13px', color: 'var(--tekst-zacht)', fontFamily: 'Arial', margin: '0 0 18px' }}>
              Geef aan of je bij deze vergadering aanwezig bent, zodat de aanwezigheidslijst klopt.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <KeuzeKnop label="✓ Ja, ik ben er fysiek bij" kleur="#2d7a4f" bg="#e8f5ed" bezig={bezig === 'aanwezig'} uit={!!bezig} onClick={() => kies('aanwezig')} />
              <KeuzeKnop label="💻 Ja, ik doe online mee" kleur="#1a5c8a" bg="#e8f0f8" bezig={bezig === 'online'} uit={!!bezig} onClick={() => kies('online')} />
              <KeuzeKnop label="✗ Nee, ik kan niet" kleur="#c0392b" bg="#fdf0ef" bezig={bezig === 'afwezig'} uit={!!bezig} onClick={() => kies('afwezig')} />
            </div>
            {mislukt && (
              <div role="alert" style={{ marginTop: '14px', background: '#fdf0ef', border: '1px solid #e8a090', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#c0392b', fontFamily: 'Arial' }}>
                {foutmelding || 'Je keuze is niet opgeslagen. Probeer het opnieuw.'}
                {sessieVerlopen && (
                  <div style={{ marginTop: '8px' }}>
                    <a href={`/inloggen?terug=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}
                      style={{ color: '#c0392b', fontWeight: 'bold' }}>Opnieuw inloggen →</a>
                  </div>
                )}
              </div>
            )}
            {toonWijzigen && !moetVragen && (
              <button onClick={() => { setToonWijzigen(false); setMislukt(false) }}
                style={{ marginTop: '14px', background: 'none', border: 'none', color: 'var(--tekst-zacht)', fontSize: '12px', fontFamily: 'Arial', cursor: 'pointer', textDecoration: 'underline' }}>
                Annuleren
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function KeuzeKnop({ label, kleur, bg, bezig, uit, onClick }: { label: string; kleur: string; bg: string; bezig: boolean; uit: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={uit}
      style={{ background: bg, color: kleur, border: `1.5px solid ${kleur}`, padding: '11px 14px', borderRadius: '9px', fontSize: '14px', fontFamily: 'Arial', fontWeight: '600', cursor: uit ? 'not-allowed' : 'pointer', textAlign: 'left' as const, opacity: uit && !bezig ? 0.5 : 1 }}>
      {bezig ? '⏳ Opslaan…' : label}
    </button>
  )
}
