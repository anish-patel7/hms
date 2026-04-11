"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Empty } from '@/components/ui/empty'
import { 
  Image as ImageIcon, 
  Plus,
  Plane,
  PartyPopper,
  Building2,
  X
} from 'lucide-react'
import { getMemories, getMembers, addMemory } from '@/lib/storage'
import { format, parseISO } from 'date-fns'
import type { Memory, Member } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const categoryConfig = {
  trips: { label: 'Trips', icon: Plane, color: 'bg-primary/10 text-primary' },
  festivals: { label: 'Festivals', icon: PartyPopper, color: 'bg-accent/10 text-accent' },
  office: { label: 'Office', icon: Building2, color: 'bg-secondary/10 text-secondary' },
}

export default function GalleryPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<Memory | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newCaption, setNewCaption] = useState('')
  const [newCategory, setNewCategory] = useState<Memory['category']>('trips')

  useEffect(() => {
    setMemories(getMemories().sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    ))
    setMembers(getMembers())
  }, [])

  const refreshMemories = () => {
    setMemories(getMemories().sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    ))
  }

  const handleAddMemory = () => {
    if (!newUrl.trim()) return

    addMemory({
      url: newUrl,
      caption: newCaption || undefined,
      category: newCategory,
      uploadedBy: 'current-user'
    })

    setNewUrl('')
    setNewCaption('')
    setNewCategory('trips')
    setShowAddDialog(false)
    refreshMemories()
  }

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown'

  const categories = ['all', 'trips', 'festivals', 'office'] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Memory Gallery</h1>
          <p className="text-muted-foreground">All our moments in one place</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Photo
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map(cat => {
            const config = categoryConfig[cat]
            return (
              <TabsTrigger key={cat} value={cat} className="gap-2">
                <config.icon className="h-4 w-4" />
                {config.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            {(() => {
              const filtered = category === 'all' 
                ? memories 
                : memories.filter(m => m.category === category)
              
              if (filtered.length === 0) {
                return (
                  <Empty
                    icon={<ImageIcon className="h-12 w-12" />}
                    title="No photos yet"
                    description="Add your first memory!"
                  />
                )
              }

              return (
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                  {filtered.map(memory => (
                    <div
                      key={memory.id}
                      className="break-inside-avoid cursor-pointer group relative"
                      onClick={() => setSelectedPhoto(memory)}
                    >
                      <div className="overflow-hidden rounded-lg">
                        <img
                          src={memory.url}
                          alt={memory.caption || 'Memory'}
                          className="w-full h-auto object-cover transition-transform group-hover:scale-105"
                          crossOrigin="anonymous"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg" />
                      <Badge 
                        className={`absolute bottom-2 left-2 ${categoryConfig[memory.category].color}`}
                      >
                        {categoryConfig[memory.category].label}
                      </Badge>
                    </div>
                  ))}
                </div>
              )
            })()}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Photo Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Photo</DialogTitle>
            <DialogDescription>
              Add a new photo to the memory gallery
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">Photo URL</Label>
              <Input
                id="url"
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Input
                id="caption"
                placeholder="Describe this moment..."
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={newCategory} onValueChange={(v) => setNewCategory(v as Memory['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trips">Trips</SelectItem>
                  <SelectItem value="festivals">Festivals</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMemory} disabled={!newUrl.trim()}>
              Add Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Memory'}
              className="max-h-[80vh] mx-auto object-contain rounded-lg"
              crossOrigin="anonymous"
            />
            <div className="mt-4 text-center text-white">
              {selectedPhoto.caption && (
                <p className="text-lg mb-2">{selectedPhoto.caption}</p>
              )}
              <p className="text-white/60 text-sm">
                Uploaded by {getMemberName(selectedPhoto.uploadedBy)} on {format(parseISO(selectedPhoto.uploadedAt), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
