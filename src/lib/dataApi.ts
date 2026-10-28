// Browser-kant: alle data loopt via onze eigen API-routes (die de login controleren),
// niet meer rechtstreeks met de anon-key naar Supabase.

export class ApiFout extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function apiJson<T>(pad: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(pad, {
    ...init,
    cache: 'no-store',
    headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiFout(body.fout || `${init.method || 'GET'} ${pad} mislukt (${res.status})`, res.status)
  }
  return res.json()
}

export const stuur = (methode: string, body?: unknown): RequestInit => ({
  method: methode,
  body: body === undefined ? undefined : JSON.stringify(body),
})

// Eén plek voor de tekst bij een verlopen sessie, zodat de gebruiker weet wat te doen.
export const SESSIE_VERLOPEN = 'Je sessie is verlopen. Log opnieuw in; je laatste wijziging is niet opgeslagen.'
