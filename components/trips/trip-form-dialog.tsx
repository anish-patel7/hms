"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Users } from 'lucide-react'
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
  const [selectedTravelers, setSelectedTravelers] = useState<string[]>([])
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
        setSelectedTravelers(initialData.rsvp?.filter(r => r.status === 'yes').map(r => r.memberId) || [])
      } else {
        setTitle('')
        setLocation('')
        setStartDate('')
        setEndDate('')
        setDescription('')
        setCoverPhoto('')
        setBestMoment('')
        setSelectedTravelers([])
      }
    }
  }, [open, initialData])

  const toggleTraveler = (memberId: string) => {
    setSelectedTravelers(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    )
  }

  const selectAllTravelers = () => {
    if (selectedTravelers.length === members.length) {
      setSelectedTravelers([])
    } else {
      setSelectedTravelers(members.map(m => m.id))
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert('Photo size must be less than 50MB')
        return
      }
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.7) // trips get higher res
        setCoverPhoto(compressed)
      } catch (err: any) {
        alert(err.message || 'Failed to process image')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const rsvpList = selectedTravelers.map(memberId => ({ memberId, status: 'yes' as const }))

      const tripData = {
        title,
        location,
        startDate,
        endDate,
        description,
        coverPhoto: coverPhoto || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop',
        bestMoment: isUpcoming ? '' : bestMoment,
        rsvp: rsvpList,
      }

      if (initialData) {
        updateTrip(initialData.id, tripData)
      } else {
        addTrip({
          ...tripData,
          photos: [],
          isPast: !isUpcoming,
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
      setSelectedTravelers([])
      
      onSuccess()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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

            {/* Travelers Selection */}
            {members.length > 0 && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Travelers
                    {selectedTravelers.length > 0 && (
                      <span className="text-xs font-normal text-primary">({selectedTravelers.length} selected)</span>
                    )}
                  </Label>
                  <Button type="button" variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={selectAllTravelers}>
                    {selectedTravelers.length === members.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1 bg-muted/20">
                  {members.map(member => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedTravelers.includes(member.id)}
                        onCheckedChange={() => toggleTraveler(member.id)}
                      />
                      <div className="flex items-center gap-2">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="h-6 w-6 rounded-full object-cover"  />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <span className="text-sm">{member.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
                accept="image/jpeg, image/png, image/webp, image/gif"
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
