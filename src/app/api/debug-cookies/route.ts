import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const cookies = req.cookies.getAll()
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })
  
  return NextResponse.json({
    cookies: cookies.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length })),
    host: headers['host'],
    nodeEnv: process.env.NODE_ENV,
    hasAdminPw: !!process.env.ADMIN_PASSWORD,
    hasReaderPw: !!process.env.READER_PASSWORD,
    hasJwtSecret: !!process.env.JWT_SECRET,
  })
}
