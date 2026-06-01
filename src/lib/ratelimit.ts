// Eenvoudige in-memory rate limiter
// Max 5 pogingen per minuut per IP

interface Poging {
  count: number
  resetAt: number
}

const pogingen = new Map<string, Poging>()

// Ruim verlopen entries op elke 5 minuten
setInterval(() => {
  const nu = Date.now()
  pogingen.forEach((v, k) => { if (v.resetAt < nu) pogingen.delete(k) })
}, 5 * 60 * 1000)

export function checkRateLimit(ip: string, max = 5, vensterMs = 60 * 1000): {
  toegestaan: boolean
  resterend: number
  resetOver: number
} {
  const nu = Date.now()
  const bestaand = pogingen.get(ip)

  if (!bestaand || bestaand.resetAt < nu) {
    // Nieuw venster
    pogingen.set(ip, { count: 1, resetAt: nu + vensterMs })
    return { toegestaan: true, resterend: max - 1, resetOver: vensterMs }
  }

  if (bestaand.count >= max) {
    return { toegestaan: false, resterend: 0, resetOver: bestaand.resetAt - nu }
  }

  bestaand.count++
  return { toegestaan: true, resterend: max - bestaand.count, resetOver: bestaand.resetAt - nu }
}
