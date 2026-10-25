'use client'

import { use } from 'react'

export const dynamic = 'force-dynamic'

import { useVergaderingOpToken } from '@/hooks/useVergaderingen'
import { LeesweergaveVolledig } from '@/components/Leesweergave'
import Notulen from '@/components/Notulen'
import AanwezigheidVraag from '@/components/AanwezigheidVraag'
import { useAuth } from '@/hooks/useAuth'
import { vandaagNL } from '@/lib/tijd'
import Melding from '@/components/Melding'
import { SESSIE_VERLOPEN } from '@/lib/dataApi'

interface Props { params: Promise<{ token: string }> }

export default function LeesPagina({ params }: Props) {
  const { token } = use(params)
  const { vergadering, geladen, fout, herlaad, actieFout, sluitActieFout, updateNotulen, voegNotitieToe, wijzigNotitie, verwijderNotitie, zetBespreken, wijzigEigenPunt, verwijderEigenPunt, zetAanwezigheid, voegVrijPuntToe, voegBijlageToe, verwijderBijlage } = useVergaderingOpToken(token)
  const { isAdmin, heeftToegang, naam } = useAuth()

  if (!geladen) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
      ⏳ Agenda laden...
    </div>
  )

  if (fout) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <p>Kon de vergadering niet laden.</p>
      <button onClick={herlaad} style={{ marginTop: '12px', background: 'var(--blauw)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px' }}>
        Opnieuw proberen
      </button>
    </div>
  )

  if (!vergadering) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'Arial', color: 'var(--tekst-zacht)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
      <h2 style={{ color: 'var(--blauw)', marginBottom: '8px', fontWeight: 'normal' }}>Vergadering niet gevonden</h2>
      <p>De link is ongeldig of de vergadering is verwijderd.</p>
    </div>
  )

  // Check of er stemlijst items zijn
  const heeftStemlijst = vergadering.punten?.some(p =>
    p.puntType === 'raadsvergadering' && p.subpunten?.some(s => s.inStemlijst)
  )

  const vandaag = vandaagNL()
  const isAankomend = !!vergadering.datum && vergadering.datum >= vandaag


  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="print-full">
      {isAankomend && heeftToegang && (
        <AanwezigheidVraag
          aanwezig={vergadering.aanwezig || ''} online={vergadering.online || ''} afwezig={vergadering.afwezig || ''}
          naam={naam} onKiezen={(status) => zetAanwezigheid(naam, status)} foutmelding={actieFout} />
      )}
      {actieFout && (
        <div className="no-print">
          <Melding type="fout" tekst={actieFout} onSluit={sluitActieFout} />
          {actieFout === SESSIE_VERLOPEN && (
            <p style={{ margin: '-8px 0 16px', fontSize: '13px', fontFamily: 'Arial' }}>
              <a href={`/inloggen?terug=${encodeURIComponent(`/lees/${token}`)}`} style={{ color: 'var(--blauw)', fontWeight: 'bold' }}>Opnieuw inloggen →</a>
            </p>
          )}
        </div>
      )}
      <div className="no-print" style={{ marginBottom: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {heeftStemlijst && (
          <a href={`/stemlijst/${token}`} target="_blank"
            style={{ background: 'white', color: '#4a1a5c', border: '1px solid #4a1a5c', padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            ⚖️ Stemlijst
          </a>
        )}
        {isAdmin && (
          <button
            onClick={() => window.open(`/presentatie/${token}`, '_blank')}
            style={{ background: '#4a1a5c', color: '#a89060', border: '1px solid #a89060', padding: '7px 16px', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Arial', fontWeight: 'bold' }}
          >
            📺 Presentatiemodus
          </button>
        )}
      </div>
      <LeesweergaveVolledig vergadering={vergadering} toonPrintKnop naam={naam} isAdmin={isAdmin}
        onNotitieToevoegen={(puntId, subIndex, tekst) => voegNotitieToe(puntId, subIndex, naam, tekst)}
        onNotitieWijzig={(puntId, subIndex, notitieId, tekst) => wijzigNotitie(puntId, subIndex, notitieId, tekst, naam, isAdmin)}
        onNotitieVerwijder={(puntId, subIndex, notitieId) => verwijderNotitie(puntId, subIndex, notitieId, naam, isAdmin)}
        onVrijPuntToevoegen={(puntId, tekst) => voegVrijPuntToe(puntId, naam, tekst)}
        onBespreekZet={(puntId, subIndex, aan) => zetBespreken(puntId, subIndex, naam, aan, isAdmin)}
        onEigenPuntWijzig={(puntId, subIndex, titel) => wijzigEigenPunt(puntId, subIndex, titel, naam, isAdmin)}
        onEigenPuntVerwijder={(puntId, subIndex) => verwijderEigenPunt(puntId, subIndex, naam, isAdmin)}
        onBijlageToevoegen={(puntId, subIndex, bijlage) => voegBijlageToe(puntId, subIndex, bijlage)}
        onBijlageVerwijderen={(puntId, subIndex, bijlageId) => verwijderBijlage(puntId, subIndex, bijlageId)} />
      <Notulen
        notulen={vergadering.notulen || ''}
        onUpdate={heeftToegang ? updateNotulen : undefined}
        magBewerken={heeftToegang}
      />
    </div>
  )
}
