"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { addTrip, updateTrip } from '@/lib/storage'
import { compressImage } from '@/lib/image-utils'
import type { Member, Trip } from '@/lib/types'

interface TripFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  members: Member[]
  isUpcoming?: boolean
  initialData?: Trip | null
}

export function TripFormDialog({ open, onOpenChange, onSuccess, members, isUpcoming = false, initialData }: TripFormDialogProps) {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [coverPhoto, setCoverPhoto] = useState('')
  const [bestMoment, setBestMoment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Use useEffect to sync initialData when dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title)
        setLocation(initialData.location)
        setStartDate(initialData.startDate)
        setEndDate(initialData.endDate)
        setDescription(initialData.description)
        setCoverPhoto(initialData.coverPhoto)
        setBestMoment(initialData.bestMoment || '')
      } else {
        setTitle('')
        setLocation('')
        setStartDate('')
        setEndDate('')
        setDescription('')
        setCoverPhoto('')
        setBestMoment('')
      }
    }
  }, [open, initialData])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Photo size must be less than 10MB')
        return
      }
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.7) // trips get higher res
        setCoverPhoto(compressed)
      } catch (err) {
        alert('Failed to process image')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const tripData = {
        title,
        location,
        startDate,
        endDate,
        description,
        coverPhoto: coverPhoto || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop',
        bestMoment: isUpcoming ? '' : bestMoment,
      }

      if (initialData) {
        updateTrip(initialData.id, tripData)
      } else {
        addTrip({
          ...tripData,
          photos: [],
          isPast: !isUpcoming,
          rsvp: [],
          checklist: isUpcoming ? [
            { item: 'Book transportation', done: false },
            { item: 'Reserve accommodation', done: false },
            { item: 'Pack essentials', done: false }
          ] : []
        })
      }

      // Reset form
      setTitle('')
      setLocation('')
      setStartDate('')
      setEndDate('')
      setDescription('')
      setCoverPhoto('')
      setBestMoment('')
      
      onSuccess()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Trip' : isUpcoming ? 'Plan New Trip' : 'Add Trip Memory'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update details for this trip' : isUpcoming ? 'Set up details for your upcoming adventure' : 'Record a past trip to your memory vault'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Trip Name</Label>
              <Input
                id="title"
                placeholder="e.g., Goa Beach Getaway"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Goa, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell the story of this trip..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coverPhoto">Cover Photo</Label>
              <Input
                id="coverPhoto"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              <div className="text-center text-xs text-muted-foreground my-1 font-medium">OR PULL FROM LINK</div>
              <Input
                placeholder="Paste an image URL directly here..."
                value={coverPhoto && !coverPhoto.startsWith('data:image') ? coverPhoto : ''}
                onChange={(e) => setCoverPhoto(e.target.value)}
              />
              {coverPhoto && coverPhoto.startsWith('data:image') && (
                <div className="mt-1 text-sm text-green-600">Local photo attached successfully.</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Upload an image, paste a link, or leave blank for default
              </p>
            </div>
            {!isUpcoming && (
              <div className="grid gap-2">
                <Label htmlFor="bestMoment">Best Moment</Label>
                <Input
                  id="bestMoment"
                  placeholder="What was the highlight?"
                  value={bestMoment}
                  onChange={(e) => setBestMoment(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : isUpcoming ? 'Plan Trip' : 'Add Memory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
