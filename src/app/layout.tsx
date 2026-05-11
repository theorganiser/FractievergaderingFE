import type { Metadata } from 'next'
import './globals.css'
import Topbalk from '@/components/Topbalk'

export const metadata: Metadata = {
  title: 'Vergaderagenda – Gooise Meren',
  description: 'Vergaderagenda voor de commissie van Gooise Meren',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body>
        <Topbalk />
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 20px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
