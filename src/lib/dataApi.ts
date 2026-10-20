// Browser-kant: alle data loopt via onze eigen API-routes (die de login controleren),
// niet meer rechtstreeks met de anon-key naar Supabase.

export async function apiJson<T>(pad: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(pad, {
    ...init,
    cache: 'no-store',
    headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.fout || `${init.method || 'GET'} ${pad} mislukt (${res.status})`)
  }
  return res.json()
}

export const stuur = (methode: string, body?: unknown): RequestInit => ({
  method: methode,
  body: body === undefined ? undefined : JSON.stringify(body),
})
