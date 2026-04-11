"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isAuthenticated, login as storageLogin, logout as storageLogout, getRole, getCurrentUserId, type LoginResult } from '@/lib/storage'

interface AuthContextType {
  isLoggedIn: boolean
  role: 'admin' | 'user' | null
  userId: string | null
  login: (password: string, pin?: string) => Promise<LoginResult>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [role, setRole] = useState<'admin' | 'user' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoggedIn(isAuthenticated())
    setRole(getRole())
    setUserId(getCurrentUserId())
    setIsLoading(false)
  }, [])

  const login = async (password: string, pin?: string): Promise<LoginResult> => {
    const response = await storageLogin(password, pin)
    if (response.success) {
      setIsLoggedIn(true)
      setRole(getRole())
      setUserId(getCurrentUserId())
    }
    return response
  }

  const logout = () => {
    storageLogout()
    setIsLoggedIn(false)
    setRole(null)
    setUserId(null)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, userId, login, logout, isLoading }}>
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
