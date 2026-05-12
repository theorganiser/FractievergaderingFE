'use client'

import { useState, useEffect } from 'react'
import { isBeheerder, setBeheerder } from '@/lib/storage'

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [geladen, setGeladen] = useState(false)

  useEffect(() => {
    setIsAdmin(isBeheerder())
    setGeladen(true)
  }, [])

  const login = (wachtwoord: string): boolean => {
    const correct = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    if (wachtwoord === correct) {
      setBeheerder(true)
      setIsAdmin(true)
      return true
    }
    return false
  }

  const logout = () => {
    setBeheerder(false)
    setIsAdmin(false)
  }

  return { isAdmin, geladen, login, logout }
}
