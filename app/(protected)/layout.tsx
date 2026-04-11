"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { Spinner } from '@/components/ui/spinner'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoggedIn, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/login')
    }
  }, [isLoggedIn, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="w-8 h-8 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
