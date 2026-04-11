"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X } from 'lucide-react'
import { addCelebration } from '@/lib/storage'
import type { Celebration } from '@/lib/types'

interface AddCelebrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddCelebrationDialog({ open, onOpenChange, onSuccess }: AddCelebrationDialogProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState<Celebration['category']>('other')
  const [photos, setPhotos] = useState<string[]>([''])
  const [caption, setCaption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addPhotoField = () => {
    if (photos.length < 6) {
      setPhotos([...photos, ''])
    }
  }

  const removePhotoField = (index: number) => {
    if (photos.length > 1) {
      setPhotos(photos.filter((_, i) => i !== index))
    }
  }

  const updatePhoto = (index: number, value: string) => {
    const newPhotos = [...photos]
    newPhotos[index] = value
    setPhotos(newPhotos)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const validPhotos = photos.filter(p => p.trim() !== '')

      addCelebration({
        title,
        date,
        category,
        photos: validPhotos,
        captions: caption ? [caption] : []
      })

      // Reset form
      setTitle('')
      setDate('')
      setCategory('other')
      setPhotos([''])
      setCaption('')
      
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
          <DialogTitle>Add Celebration</DialogTitle>
          <DialogDescription>
            Record a festival or celebration memory
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Diwali 2024"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Celebration['category'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diwali">Diwali</SelectItem>
                    <SelectItem value="holi">Holi</SelectItem>
                    <SelectItem value="christmas">Christmas</SelectItem>
                    <SelectItem value="newyear">New Year</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Photo URLs</Label>
              <div className="space-y-2">
                {photos.map((photo, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="https://..."
                      value={photo}
                      onChange={(e) => updatePhoto(index, e.target.value)}
                    />
                    {photos.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePhotoField(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {photos.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPhotoField}
                  className="mt-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Describe this celebration..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Celebration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
