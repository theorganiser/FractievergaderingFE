import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_LEZER = 'gdp_toegang'
export const COOKIE_ADMIN = 'gdp_admin'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is niet ingesteld')
  return new TextEncoder().encode(secret)
}

export async function maakToken(
  payload: Record<string, string>,
  geldigheid: string
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(geldigheid)
    .sign(getSecret())
}

export async function verifieerToken(
  token: string
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

function cookieOpties(maxAge: number): string {
  // SameSite=Lax werkt beter dan Strict bij redirects
  // Secure alleen in productie
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure}`
}

export async function maakLezerCookie(naam: string): Promise<string> {
  const token = await maakToken({ rol: 'lezer', naam }, '7d')
  return `${COOKIE_LEZER}=${token}; ${cookieOpties(7 * 24 * 60 * 60)}`
}

export async function maakAdminCookie(): Promise<string> {
  const token = await maakToken({ rol: 'admin' }, '8h')
  return `${COOKIE_ADMIN}=${token}; ${cookieOpties(8 * 60 * 60)}`
}

export function verwijderCookies(): string[] {
  return [
    `${COOKIE_LEZER}=; Max-Age=0; Path=/; HttpOnly`,
    `${COOKIE_ADMIN}=; Max-Age=0; Path=/; HttpOnly`,
  ]
}
