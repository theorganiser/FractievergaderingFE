'use client'

import { useState, useEffect } from 'react'

interface AuthStatus {
  heeftToegang: boolean
  isAdmin: boolean
  isModerator: boolean
  naam: string
  heeftEigenWachtwoord: boolean
  wachtwoordVerplicht: boolean
  geladen: boolean
}

export function useAuth(): AuthStatus & { logout: () => Promise<void> } {
  const [status, setStatus] = useState<AuthStatus>({
    heeftToegang: false,
    isAdmin: false,
    isModerator: false,
    naam: '',
    heeftEigenWachtwoord: false,
    wachtwoordVerplicht: false,
    geladen: false,
  })

  useEffect(() => {
    fetch('/api/check-auth')
      .then(r => r.json())
      .then(data => setStatus({ ...data, geladen: true }))
      .catch(() => setStatus({ heeftToegang: false, isAdmin: false, isModerator: false, naam: '', heeftEigenWachtwoord: false, wachtwoordVerplicht: false, geladen: true }))
  }, [])

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/inloggen'
  }

  return { ...status, logout }
}
