'use client'

import { useState, useEffect } from 'react'

interface AuthStatus {
  heeftToegang: boolean
  isAdmin: boolean
  naam: string
  geladen: boolean
}

export function useAuth(): AuthStatus & { logout: () => Promise<void> } {
  const [status, setStatus] = useState<AuthStatus>({
    heeftToegang: false,
    isAdmin: false,
    naam: '',
    geladen: false,
  })

  useEffect(() => {
    // Haal auth status op via API (leest cookies server-side)
    fetch('/api/check-auth')
      .then(r => r.json())
      .then(data => setStatus({ ...data, geladen: true }))
      .catch(() => setStatus({ heeftToegang: false, isAdmin: false, naam: '', geladen: true }))
  }, [])

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/inloggen'
  }

  return { ...status, logout }
}
