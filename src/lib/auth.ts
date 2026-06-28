// auth.ts — Edge-compatible JWT via jose
// jose ondersteunt zowel Node.js als Edge runtime

import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_LEZER = 'gdp_toegang'
export const COOKIE_ADMIN = 'gdp_admin'
export const COOKIE_MODERATOR = 'gdp_moderator'
const COOKIE_OPTIES = 'HttpOnly; Path=/; SameSite=Strict'

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

export async function maakLezerCookie(naam: string): Promise<string> {
  const token = await maakToken({ rol: 'lezer', naam }, '7d')
  const maxAge = 7 * 24 * 60 * 60
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_LEZER}=${token}; Max-Age=${maxAge}; ${COOKIE_OPTIES}${secure}`
}

export async function maakAdminCookie(): Promise<string> {
  const token = await maakToken({ rol: 'admin' }, '8h')
  const maxAge = 8 * 60 * 60
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_ADMIN}=${token}; Max-Age=${maxAge}; ${COOKIE_OPTIES}${secure}`
}

export async function maakModeratorCookie(): Promise<string> {
  const token = await maakToken({ rol: 'moderator' }, '8h')
  const maxAge = 8 * 60 * 60
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_MODERATOR}=${token}; Max-Age=${maxAge}; ${COOKIE_OPTIES}${secure}`
}

export function verwijderCookies(): string[] {
  return [
    `${COOKIE_LEZER}=; Max-Age=0; ${COOKIE_OPTIES}`,
    `${COOKIE_ADMIN}=; Max-Age=0; ${COOKIE_OPTIES}`,
    `${COOKIE_MODERATOR}=; Max-Age=0; ${COOKIE_OPTIES}`,
  ]
}
