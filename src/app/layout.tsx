import type { Metadata } from 'next'
import Topbalk from '@/components/Topbalk'
import BackendPing from '@/components/BackendPing'
import '../app/globals.css'

export const metadata: Metadata = {
  title: 'Fractie Vergaderagenda — GDP',
  description: 'Vergaderagenda voor de fractie van Goois Democratisch Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <BackendPing />
        <Topbalk />
        <main style={{ maxWidth: '960px', margin: '0 auto', padding: '28px 20px' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
