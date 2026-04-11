"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { 
  Image as ImageIcon, 
  FolderPlus,
  ArrowLeft,
  X,
  Trash2,
  Edit2,
  UploadCloud,
  FolderOpen
} from 'lucide-react'
import { 
  getAlbums, 
  addAlbum, 
  deleteAlbum, 
  getMemoriesByAlbum, 
  addMemory, 
  updateMemory, 
  deleteMemory,
  getMembers,
  pullSharedData
} from '@/lib/storage'
import { compressImage } from '@/lib/image-utils'
import { format, parseISO } from 'date-fns'
import type { Memory, Member, Album } from '@/lib/types'
import { useAuth } from '@/components/auth/auth-provider'
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

export default function GalleryPage() {
  const { role } = useAuth()
  
  // State
  const [albums, setAlbums] = useState<Album[]>([])
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [members, setMembers] = useState<Member[]>([])
  
  // Modals
  const [showAddAlbum, setShowAddAlbum] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Memory | null>(null)
  
  // Modals Data
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumCover, setNewAlbumCover] = useState('')
  const [bulkFilesData, setBulkFilesData] = useState<{ url: string }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [editCaptionMode, setEditCaptionMode] = useState(false)
  const [newCaptionValue, setNewCaptionValue] = useState('')

  useEffect(() => {
    // Pull cloud data first, then load
    pullSharedData().then(() => {
      refreshAlbums()
      setMembers(getMembers())
    })
    // Also load local immediately
    refreshAlbums()
    setMembers(getMembers())
  }, [])

  const refreshAlbums = () => {
    setAlbums(getAlbums().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  const openAlbum = (album: Album) => {
    setActiveAlbum(album)
    refreshMemories(album.id)
  }

  const refreshMemories = (albumId: string) => {
    setMemories(getMemoriesByAlbum(albumId).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    ))
  }

  const handleCreateAlbum = () => {
    if (!newAlbumName.trim()) return
    addAlbum({
      name: newAlbumName,
      coverPhoto: newAlbumCover || undefined,
      createdBy: 'admin'
    })
    setNewAlbumName('')
    setNewAlbumCover('')
    setShowAddAlbum(false)
    refreshAlbums()
  }

  const handleDeleteAlbum = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this entire album and ALL its photos?')) return
    deleteAlbum(id)
    refreshAlbums()
  }

  const handleBulkUploadConvert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setIsUploading(true)
    try {
      const promises = files.map(file => compressImage(file, 800, 800, 0.5))
      const base64Array = await Promise.all(promises)
      setBulkFilesData(base64Array.map(url => ({ url })))
    } catch (err) {
      alert('Failed to process image files')
    } finally {
      setIsUploading(false)
    }
  }

  const submitBulkUpload = () => {
    if (!activeAlbum || bulkFilesData.length === 0) return
    setIsUploading(true)
    
    // Process strictly synchronusly to not freeze UI immediately.
    bulkFilesData.forEach(item => {
      addMemory({
        url: item.url,
        albumId: activeAlbum.id,
        uploadedBy: 'admin'
      })
    })

    setBulkFilesData([])
    setShowBulkUpload(false)
    setIsUploading(false)
    refreshMemories(activeAlbum.id)
  }

  const saveCaptionEdit = () => {
    if (!selectedPhoto) return
    updateMemory(selectedPhoto.id, { caption: newCaptionValue })
    setEditCaptionMode(false)
    
    // Update local Lightbox state & Album state
    setSelectedPhoto({ ...selectedPhoto, caption: newCaptionValue })
    if (activeAlbum) refreshMemories(activeAlbum.id)
  }

  const removePhoto = () => {
    if (!selectedPhoto) return
    if (!confirm('Delete this photo?')) return
    deleteMemory(selectedPhoto.id)
    setSelectedPhoto(null)
    if (activeAlbum) refreshMemories(activeAlbum.id)
  }

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Admin'

  if (activeAlbum) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveAlbum(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{activeAlbum.name}</h1>
              <p className="text-muted-foreground">{memories.length} photos</p>
            </div>
          </div>
          {role === 'admin' && (
            <Button onClick={() => setShowBulkUpload(true)} className="bg-primary hover:bg-primary/90">
              <UploadCloud className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          )}
        </div>

        {memories.length === 0 ? (
          <Empty
            icon={<ImageIcon className="h-12 w-12" />}
            title="Empty Album"
            description="Add some photos to start building this memory."
          />
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {memories.map(memory => (
              <div
                key={memory.id}
                className="break-inside-avoid cursor-pointer group relative rounded-lg overflow-hidden"
                onClick={() => setSelectedPhoto(memory)}
              >
                <img
                  src={memory.url}
                  alt={memory.caption || 'Memory'}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        )}

        <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photos to {activeAlbum.name}</DialogTitle>
              <DialogDescription>
                Select multiple photos to bulk upload into this album. Max 2MB per photo recommended.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleBulkUploadConvert}
                disabled={isUploading}
              />
              {bulkFilesData.length > 0 && (
                <p className="text-sm text-green-600">{bulkFilesData.length} photo(s) ready for upload.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowBulkUpload(false); setBulkFilesData([]) }}>
                Cancel
              </Button>
              <Button onClick={submitBulkUpload} disabled={isUploading || bulkFilesData.length === 0}>
                {isUploading ? 'Uploading...' : 'Save Photos'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lightbox */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="absolute top-4 right-4 flex gap-4">
              {role === 'admin' && (
                <>
                  <button 
                    className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setEditCaptionMode(true); setNewCaptionValue(selectedPhoto.caption || '') }}
                    title="Edit Caption"
                  >
                    <Edit2 className="h-6 w-6" />
                  </button>
                  <button 
                    className="text-white/80 hover:text-red-500 p-2 rounded-full hover:bg-white/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); removePhoto() }}
                    title="Delete Photo"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </>
              )}
              <button 
                className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="max-w-5xl w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Memory'}
                className="max-h-[75vh] mx-auto object-contain rounded-lg shadow-2xl"
                crossOrigin="anonymous"
              />
              
              <div className="mt-6 text-center text-white p-4 w-full max-w-xl mx-auto rounded-lg bg-black/40">
                {editCaptionMode ? (
                  <div className="flex gap-2 mb-2">
                    <Input 
                      value={newCaptionValue} 
                      onChange={(e) => setNewCaptionValue(e.target.value)} 
                      placeholder="Add a caption..."
                      autoFocus
                      className="text-black bg-white"
                    />
                    <Button onClick={saveCaptionEdit} size="sm">Save</Button>
                  </div>
                ) : (
                  <p className="text-xl mb-2 font-medium">{selectedPhoto.caption || <span className="text-white/30 italic">No caption</span>}</p>
                )}
                
                <p className="text-white/60 text-sm">
                  Added on {format(parseISO(selectedPhoto.uploadedAt), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Albums</h1>
          <p className="text-muted-foreground">Collections of our best moments</p>
        </div>
        {role === 'admin' && (
          <Button onClick={() => setShowAddAlbum(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Create Album
          </Button>
        )}
      </div>

      {albums.length === 0 ? (
        <Empty
          icon={<FolderOpen className="h-12 w-12" />}
          title="No Albums Yet"
          description="Create your first album to start organizing memories!"
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => {
            const coverUrl = album.coverPhoto || getMemoriesByAlbum(album.id)[0]?.url
            return (
              <Card key={album.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all border-border/50" onClick={() => openAlbum(album)}>
                <div className="relative aspect-[4/3] bg-muted/30">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={album.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="font-bold text-xl mb-1 truncate">{album.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">
                      {format(parseISO(album.createdAt), 'MMM yyyy')}
                    </p>
                    {role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/50 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteAlbum(album.id, e)}
                        title="Delete Album"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Album Dialog */}
      <Dialog open={showAddAlbum} onOpenChange={setShowAddAlbum}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Album</DialogTitle>
            <DialogDescription>
              Create a dedicated album container for a trip or event.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Album Name</Label>
              <Input
                id="name"
                placeholder="e.g., Goa Trip 2024"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cover">Cover Photo URL (optional)</Label>
              <Input
                id="cover"
                placeholder="https://..."
                value={newAlbumCover}
                onChange={(e) => setNewAlbumCover(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAlbum(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlbum} disabled={!newAlbumName.trim()}>
              Create Album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
