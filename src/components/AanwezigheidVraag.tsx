'use client'

import { useState } from 'react'

type Status = 'aanwezig' | 'online' | 'afwezig'

function parseNamen(str: string) { return (str || '').split(',').map(n => n.trim()).filter(Boolean) }

export default function AanwezigheidVraag({ aanwezig, online, afwezig, naam, onKiezen }: {
  aanwezig: string; online: string; afwezig: string; naam: string
  onKiezen: (status: Status) => void
}) {
  const huidigeStatus: Status | null =
    parseNamen(aanwezig).includes(naam) ? 'aanwezig' :
    parseNamen(online).includes(naam) ? 'online' :
    parseNamen(afwezig).includes(naam) ? 'afwezig' : null

  const [toonWijzigen, setToonWijzigen] = useState(false)
  const [bezig, setBezig] = useState<Status | null>(null)

  if (!naam) return null

  const moetVragen = huidigeStatus === null

  const kies = async (status: Status) => {
    setBezig(status)
    await onKiezen(status)
    setBezig(null)
    setToonWijzigen(false)
  }

  return (
    <>
      {huidigeStatus && !moetVragen && (
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'Arial', color: 'var(--tekst-zacht)', marginBottom: '14px' }}>
          <span>
            Jouw status: {huidigeStatus === 'aanwezig' ? '✓ Aanwezig' : huidigeStatus === 'online' ? '💻 Online' : '✗ Niet aanwezig'}
          </span>
          <button onClick={() => setToonWijzigen(true)}
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
              <KeuzeKnop label="✓ Ja, ik ben er fysiek bij" kleur="#2d7a4f" bg="#e8f5ed" bezig={bezig === 'aanwezig'} onClick={() => kies('aanwezig')} />
              <KeuzeKnop label="💻 Ja, ik doe online mee" kleur="#1a5c8a" bg="#e8f0f8" bezig={bezig === 'online'} onClick={() => kies('online')} />
              <KeuzeKnop label="✗ Nee, ik kan niet" kleur="#c0392b" bg="#fdf0ef" bezig={bezig === 'afwezig'} onClick={() => kies('afwezig')} />
            </div>
            {toonWijzigen && !moetVragen && (
              <button onClick={() => setToonWijzigen(false)}
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

function KeuzeKnop({ label, kleur, bg, bezig, onClick }: { label: string; kleur: string; bg: string; bezig: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={bezig}
      style={{ background: bg, color: kleur, border: `1.5px solid ${kleur}`, padding: '11px 14px', borderRadius: '9px', fontSize: '14px', fontFamily: 'Arial', fontWeight: '600', cursor: bezig ? 'not-allowed' : 'pointer', textAlign: 'left' as const, opacity: bezig ? 0.6 : 1 }}>
      {label}
    </button>
  )
}
