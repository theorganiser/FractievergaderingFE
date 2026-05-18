import { SignJWT, jwtVerify } from 'jose'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET omgevingsvariabele is niet ingesteld. Voeg deze toe in Vercel of .env.local')
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

const COOKIE_LEZER = 'gdp_toegang'
const COOKIE_ADMIN = 'gdp_admin'
const COOKIE_OPTIES = 'HttpOnly; Secure; SameSite=Strict; Path=/'

// Maak een gesigneerd JWT token aan
export async function maakToken(payload: Record<string, string>, geldigheid: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(geldigheid)
    .sign(JWT_SECRET)
}

// Verifieer een JWT token
export async function verifieerToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

// Maak cookie string voor lezer (7 dagen)
export async function maakLezerCookie(naam: string): Promise<string> {
  const token = await maakToken({ rol: 'lezer', naam }, '7d')
  return `${COOKIE_LEZER}=${token}; Max-Age=${7 * 24 * 60 * 60}; ${COOKIE_OPTIES}`
}

// Maak cookie string voor beheerder (8 uur)
export async function maakAdminCookie(): Promise<string> {
  const token = await maakToken({ rol: 'admin' }, '8h')
  return `${COOKIE_ADMIN}=${token}; Max-Age=${8 * 60 * 60}; ${COOKIE_OPTIES}`
}

// Verwijder cookies
export function verwijderCookies(): string[] {
  return [
    `${COOKIE_LEZER}=; Max-Age=0; ${COOKIE_OPTIES}`,
    `${COOKIE_ADMIN}=; Max-Age=0; ${COOKIE_OPTIES}`,
  ]
}

export { COOKIE_LEZER, COOKIE_ADMIN }
