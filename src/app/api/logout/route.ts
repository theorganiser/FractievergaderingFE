import { NextResponse } from 'next/server'
import { verwijderCookies } from '../../../lib/auth'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  verwijderCookies().forEach(cookie => response.headers.append('Set-Cookie', cookie))
  return response
}
