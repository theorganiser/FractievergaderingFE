'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Oude loginpagina - redirect naar nieuwe /inloggen pagina
export default function OudLoginPagina() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/inloggen?admin=1')
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2d0a40 0%, #4a1a5c 50%, #2d0a40 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'Arial', fontSize: '14px',
    }}>
      Doorsturen...
    </div>
  )
}
