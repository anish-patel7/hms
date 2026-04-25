"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Star,
  Image as ImageIcon,
  Edit,
  Trash2,
  Camera
} from 'lucide-react'
import { getTrip, getMembers, deleteTrip, updateTrip } from '@/lib/storage'
import { compressImage } from '@/lib/image-utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, parseISO } from 'date-fns'
import type { Trip, Member } from '@/lib/types'
import { useAuth } from '@/components/auth/auth-provider'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function TripDetailPage() {
  const { role } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    const tripData = getTrip(params.id as string)
    if (tripData) {
      setTrip(tripData)
    }
    setMembers(getMembers())
  }, [params.id])

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown'

  const handleDelete = () => {
    if (trip) {
      deleteTrip(trip.id)
      router.push('/trips')
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && trip) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size must be less than 5MB')
        return
      }
      try {
        const compressed = await compressImage(file, 800, 800, 0.5)
        const updated = updateTrip(trip.id, { coverPhoto: compressed })
        if (updated) setTrip(updated)
      } catch (err: any) {
        alert(err?.message || 'Failed to process image')
      }
    }
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Trip not found</p>
      </div>
    )
  }

  const confirmedMembers = trip.rsvp.filter(r => r.status === 'yes')
  const allPhotos = [trip.coverPhoto, ...trip.photos]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/trips">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{trip.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {trip.location}
          </div>
        </div>
        {role === 'admin' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the trip and all its memories. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Hero Image */}
      <div className="relative aspect-[21/9] rounded-xl overflow-hidden">
        <img
          src={trip.coverPhoto}
          alt={trip.title}
          className="absolute inset-0 h-full w-full object-cover"
          
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d, yyyy')}
            </Badge>
            <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              {confirmedMembers.length} travelers
            </Badge>
          </div>
        </div>
        {role === 'admin' && (
          <div className="absolute top-4 right-4 z-10">
            <Input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" id="cover-photo-upload" />
            <Label htmlFor="cover-photo-upload" className="cursor-pointer bg-black/40 hover:bg-black/60 text-white rounded-full p-2.5 block backdrop-blur-md transition-colors shadow-lg" title="Change Cover Photo">
              <Camera className="h-5 w-5" />
            </Label>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>About This Trip</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{trip.description}</p>
            </CardContent>
          </Card>

          {/* Best Moment */}
          {trip.bestMoment && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Star className="h-5 w-5" />
                  Best Moment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg italic">&ldquo;{trip.bestMoment}&rdquo;</p>
              </CardContent>
            </Card>
          )}

          {/* Photo Gallery */}
          {allPhotos.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photo Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allPhotos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhoto(photo)}
                      className="relative aspect-square rounded-lg overflow-hidden group"
                    >
                      <img
                        src={photo}
                        alt={`Trip photo ${index + 1}`}
                        className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-110"
                        
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Travelers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Who Was There
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {confirmedMembers.map(({ memberId }) => {
                  const member = members.find(m => m.id === memberId)
                  if (!member) return null
                  return (
                    <div key={memberId} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{member.name}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/gallery">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    View in Gallery
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white text-lg"
            onClick={() => setSelectedPhoto(null)}
          >
            Close
          </button>
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            
          />
        </div>
      )}
    </div>
  )
}
