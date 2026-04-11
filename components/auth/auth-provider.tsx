"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isAuthenticated, login as storageLogin, logout as storageLogout } from '@/lib/storage'

interface AuthContextType {
  isLoggedIn: boolean
  login: (password: string) => boolean
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoggedIn(isAuthenticated())
    setIsLoading(false)
  }, [])

  const login = (password: string): boolean => {
    const success = storageLogin(password)
    if (success) {
      setIsLoggedIn(true)
    }
    return success
  }

  const logout = () => {
    storageLogout()
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
