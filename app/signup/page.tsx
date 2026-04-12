"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/storage'
import { compressImage } from '@/lib/image-utils'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    area: '',
    marriage_date: '',
    password: '',
    pin: ''
  })
  const [profilePhoto, setProfilePhoto] = useState<string>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Validates DD-MM format strictly
  const isValidDDMM = (value: string): boolean => {
    if (!/^\d{2}-\d{2}$/.test(value)) return false
    const [dd, mm] = value.split('-').map(Number)
    return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31
  }

  // Auto-formats date input: inserts '-' after 2 digits, strips non-digits except '-'
  const handleDateInput = (raw: string, field: 'dob' | 'marriage_date') => {
    // Remove everything except digits
    let digits = raw.replace(/[^0-9]/g, '')
    // Limit to 4 digits (DDMM)
    digits = digits.slice(0, 4)
    // Auto-insert hyphen after first 2 digits
    let formatted = digits
    if (digits.length > 2) {
      formatted = digits.slice(0, 2) + '-' + digits.slice(2)
    }
    setFormData({ ...formData, [field]: formatted })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // Now allow up to 10MB since we compress
        setError('Photo size must be less than 10MB')
        return
      }
      try {
        const compressed = await compressImage(file)
        setProfilePhoto(compressed)
      } catch (err) {
        setError('Failed to process image')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!formData.name || !formData.dob || !formData.area || !formData.password || !formData.pin) {
      setError('Please fill in all required fields.')
      return
    }

    if (formData.pin.length !== 4) {
      setError('PIN must be exactly 4 digits.')
      return
    }

    if (!isValidDDMM(formData.dob)) {
      setError('Date of Birth must be in DD-MM format (e.g. 15-08). Please correct it.')
      return
    }

    if (formData.marriage_date && !isValidDDMM(formData.marriage_date)) {
      setError('Marriage Date must be in DD-MM format (e.g. 25-12). Please correct it.')
      return
    }

    setLoading(true)
    const { error: dbError } = await supabase.from('users').insert([{
      name: formData.name,
      dob: formData.dob,
      area: formData.area,
      marriage_date: formData.marriage_date || null,
      profile_photo: profilePhoto || null,
      password: hashPassword(formData.password),
      pin: formData.pin,
      status: 'pending'
    }])

    setLoading(false)
    if (dbError) {
      setError(dbError.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Signup Successful! 🎉</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              Your account has been created. However, you must wait for an Admin to <strong>approve</strong> your account before you can log in.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 py-8">
      <div className="w-full max-w-md">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/login"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Login</Link>
        </Button>
        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>
              Join the team memory vault
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  placeholder="E.g. Priya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth (DD-MM) <span className="text-destructive">*</span></Label>
                <Input
                  id="dob"
                  placeholder="E.g. 15-08"
                  value={formData.dob}
                  onChange={(e) => handleDateInput(e.target.value, 'dob')}
                  disabled={loading}
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground">Format: DD-MM (day-month)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area Name <span className="text-destructive">*</span></Label>
                <Input
                  id="area"
                  placeholder="Your residential area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marriage">Marriage Date (DD-MM) <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input
                  id="marriage"
                  placeholder="E.g. 25-12"
                  value={formData.marriage_date}
                  onChange={(e) => handleDateInput(e.target.value, 'marriage_date')}
                  disabled={loading}
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground">Format: DD-MM (day-month)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Profile Photo <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={loading}
                />
                {profilePhoto && (
                  <div className="mt-2 text-sm text-green-600">Photo attached successfully.</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Login Password <span className="text-destructive">*</span></Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">4-Digit PIN <span className="text-destructive">*</span></Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="E.g. 1234"
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    disabled={loading}
                    className="font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm py-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Submitting...' : 'Sign Up'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
