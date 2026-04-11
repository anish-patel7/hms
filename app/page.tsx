"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { Spinner } from '@/components/ui/spinner'

export default function RootPage() {
  const { isLoggedIn, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn) {
        router.replace('/home')
      } else {
        router.replace('/login')
      }
    }
  }, [isLoggedIn, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="w-8 h-8 text-primary" />
        <p className="text-muted-foreground">Loading your space...</p>
      </div>
    </div>
  )
}
