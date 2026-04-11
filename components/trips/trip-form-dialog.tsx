"use client"

import { useState } from 'react'
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
import { addTrip } from '@/lib/storage'
import type { Member } from '@/lib/types'

interface TripFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  members: Member[]
  isUpcoming?: boolean
}

export function TripFormDialog({ open, onOpenChange, onSuccess, members, isUpcoming = false }: TripFormDialogProps) {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [coverPhoto, setCoverPhoto] = useState('')
  const [bestMoment, setBestMoment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      addTrip({
        title,
        location,
        startDate,
        endDate,
        description,
        coverPhoto: coverPhoto || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop',
        bestMoment: isUpcoming ? '' : bestMoment,
        photos: [],
        isPast: !isUpcoming,
        rsvp: [],
        checklist: isUpcoming ? [
          { item: 'Book transportation', done: false },
          { item: 'Reserve accommodation', done: false },
          { item: 'Pack essentials', done: false }
        ] : []
      })

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
          <DialogTitle>{isUpcoming ? 'Plan New Trip' : 'Add Trip Memory'}</DialogTitle>
          <DialogDescription>
            {isUpcoming ? 'Set up details for your upcoming adventure' : 'Record a past trip to your memory vault'}
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
              <Label htmlFor="coverPhoto">Cover Photo URL</Label>
              <Input
                id="coverPhoto"
                placeholder="https://..."
                value={coverPhoto}
                onChange={(e) => setCoverPhoto(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste an image URL or leave blank for a default image
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
              {isSubmitting ? 'Saving...' : isUpcoming ? 'Plan Trip' : 'Add Memory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
