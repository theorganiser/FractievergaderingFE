import { NextRequest, NextResponse } from 'next/server'
import { leesSessie } from '@/lib/sessie'
import { wachtwoordVerplicht } from '@/lib/wachtwoord'

export async function GET(req: NextRequest) {
  const sessie = await leesSessie(req.cookies)
  return NextResponse.json({
    heeftToegang: !!sessie,
    isAdmin: !!sessie?.isAdmin,
    isModerator: !!sessie?.isModerator, // admin heeft ook moderator rechten
    naam: sessie?.naam || '',
    heeftEigenWachtwoord: !!sessie?.eigenWachtwoord,
    // Beheerder/moderator zonder eigen wachtwoord: eerst instellen, dan pas de extra rechten
    rolWacht: sessie?.rolWacht || '',
    wachtwoordVerplicht: wachtwoordVerplicht(),
  })
}
