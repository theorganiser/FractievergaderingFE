import { supabase } from './supabase'

export async function schrijfLoginLog(entry: { naam: string; rol: string }): Promise<void> {
  const rij = { naam: entry.naam, rol: entry.rol, ingelogd_op: new Date().toISOString() }

  const { error } = await supabase.from('login_log').insert(rij)
  if (!error) return

  console.error('login_log insert mislukt, 1x retry:', error)

  // Eén retry — de meeste mislukkingen zijn transiënt (tijdelijke netwerk-/verbindingshapering
  // richting Supabase). Als het dan nog mislukt, loggen we het duidelijk zodat het zichtbaar
  // is in de server-log, in plaats van dat de logregel stilletjes verdwijnt.
  const { error: opnieuwFout } = await supabase.from('login_log').insert(rij)
  if (opnieuwFout) {
    console.error('login_log insert mislukt na retry — logregel is NIET opgeslagen:', opnieuwFout, rij)
  }
}
