"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plane, Lock, AlertCircle } from 'lucide-react'
import { getSettings } from '@/lib/storage'
import { Spinner } from '@/components/ui/spinner'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groupName, setGroupName] = useState<string | null>(null)
  const { login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setGroupName(getSettings().groupName)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))

    if (login(password)) {
      router.push('/home')
    } else {
      setError('Oops! That password is not quite right. Try again!')
      setPassword('')
    }
    setIsSubmitting(false)
  }

  if (groupName === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground text-balance">
            {groupName}
          </h1>
          <p className="text-muted-foreground mt-2">
            Your private memory vault awaits
          </p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Lock className="w-5 h-5 text-primary" />
              Enter the Clubhouse
            </CardTitle>
            <CardDescription>
              Enter the shared password to access your team space
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center text-lg h-12"
                  autoFocus
                  disabled={isSubmitting}
                />
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm justify-center">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-medium"
                disabled={!password || isSubmitting}
              >
                {isSubmitting ? 'Opening...' : 'Open the Door'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          A cozy space for trips, memories, and celebrations
        </p>
      </div>
    </div>
  )
}
