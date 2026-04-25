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
  pullSharedData,
  uploadImageToCloud
} from '@/lib/storage'
import { CloudImage } from '@/components/ui/cloud-image'
import { compressImage, getStorageUsage, canUploadMore, STORAGE_LIMITS } from '@/lib/image-utils'
import { getDirectImageUrl } from '@/lib/utils'
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
  const [urlInput, setUrlInput] = useState('')
  const [storageUsage, setStorageUsage] = useState(getStorageUsage())

  useEffect(() => {
    // Pull cloud data first, then load
    pullSharedData().then(() => {
      refreshAlbums()
      setMembers(getMembers())
      setStorageUsage(getStorageUsage())
    })
    // Also load local immediately
    refreshAlbums()
    setMembers(getMembers())
    setStorageUsage(getStorageUsage())
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
      coverPhoto: newAlbumCover ? getDirectImageUrl(newAlbumCover) : undefined,
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

    // Check storage capacity
    const storageCheck = canUploadMore()
    if (!storageCheck.allowed) {
      alert(storageCheck.reason)
      return
    }

    // Enforce batch limit
    const albumPhotoCount = memories.length + bulkFilesData.length
    const remainingSlots = STORAGE_LIMITS.MAX_PHOTOS_PER_ALBUM - albumPhotoCount
    if (remainingSlots <= 0) {
      alert(`This album already has the maximum of ${STORAGE_LIMITS.MAX_PHOTOS_PER_ALBUM} photos. Please delete some photos first.`)
      return
    }

    const maxFiles = Math.min(files.length, remainingSlots, STORAGE_LIMITS.MAX_BATCH_UPLOAD - bulkFilesData.length)
    if (maxFiles < files.length) {
      alert(`Only ${maxFiles} of ${files.length} photos will be added due to upload limits (max ${STORAGE_LIMITS.MAX_PHOTOS_PER_ALBUM} per album, max ${STORAGE_LIMITS.MAX_BATCH_UPLOAD} per batch).`)
    }
    const filesToProcess = files.slice(0, maxFiles)
    if (filesToProcess.length === 0) return  

    setIsUploading(true)
    try {
      const promises = filesToProcess.map(file => compressImage(file, 600, 600, 0.4))
      const base64Array = await Promise.all(promises)
      setBulkFilesData(prev => [...prev, ...base64Array.map(url => ({ url }))])
    } catch (err: any) {
      alert(err?.message || 'Failed to process image files')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return
    const input = urlInput.trim()
    
    // Check if it's a google drive folder
    if (input.includes('drive.google.com/drive/folders/')) {
      setIsUploading(true)
      try {
        const res = await fetch('/api/drive-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: input })
        })
        const data = await res.json()
        
        if (data.ids && data.ids.length > 0) {
          const directUrls = data.ids.map((id: string) => ({
            url: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`
          }))
          setBulkFilesData(prev => [...prev, ...directUrls])
          alert(`Successfully extracted ${data.ids.length} photos from the folder!`)
        } else {
          alert('No accessible photos found in this folder. Make sure the folder is publicly accessible (Anyone with the link).')
        }
      } catch (err) {
        alert('Failed to parse Google Drive folder.')
      } finally {
        setIsUploading(false)
        setUrlInput('')
      }
      return
    }

    // Process as single file
    const processedUrl = getDirectImageUrl(input)
    setBulkFilesData(prev => [...prev, { url: processedUrl }])
    setUrlInput('')
  }

  const submitBulkUpload = async () => {
    if (!activeAlbum || bulkFilesData.length === 0) return
    
    // Final storage check before saving
    const storageCheck = canUploadMore()
    if (!storageCheck.allowed) {
      alert(storageCheck.reason)
      return
    }
    
    setIsUploading(true)
    
    try {
      for (const item of bulkFilesData) {
        let finalUrl = item.url
        // If it's a base64 string, upload it to cloud first
        if (finalUrl.startsWith('data:image')) {
          finalUrl = await uploadImageToCloud(finalUrl)
        }
        
        addMemory({
          url: finalUrl,
          albumId: activeAlbum.id,
          uploadedBy: 'admin'
        })
      }

      setBulkFilesData([])
      setShowBulkUpload(false)
      refreshMemories(activeAlbum.id)
      setStorageUsage(getStorageUsage())
    } catch (err) {
      console.error(err)
      alert('Failed to save some photos to the cloud storage. Please try again.')
    } finally {
      setIsUploading(false)
    }
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
    setStorageUsage(getStorageUsage())
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
              <p className="text-muted-foreground">
                {memories.length} photos
              </p>
            </div>
          </div>
          {role === 'admin' && (
            <Button 
              onClick={() => setShowBulkUpload(true)} 
              className="bg-primary hover:bg-primary/90"
            >
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
                <CloudImage
                  src={memory.url}
                  alt={memory.caption || 'Memory'}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
            ))}
          </div>
        )}

        <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Photos to {activeAlbum.name}</DialogTitle>
              <DialogDescription>
                Select files to upload, or paste a Google Drive / Image URL.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Upload Files</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/jpeg, image/png, image/webp, image/gif"
                  onChange={handleBulkUploadConvert}
                  disabled={isUploading}
                />
              </div>
              
              <div className="flex items-end gap-2">
                <div className="grid gap-2 flex-grow">
                  <Label>Or Paste Image/Drive URL</Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                </div>
                <Button variant="secondary" onClick={handleAddUrl} disabled={!urlInput.trim()}>
                  Add URL
                </Button>
              </div>

              {bulkFilesData.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm text-green-600 font-medium">
                    {bulkFilesData.length} photo(s) selected and ready to save.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowBulkUpload(false); setBulkFilesData([]) }}>
                Cancel
              </Button>
              <Button onClick={submitBulkUpload} disabled={isUploading || bulkFilesData.length === 0}>
                {isUploading ? 'Saving...' : 'Save Photos'}
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
              <CloudImage
                src={selectedPhoto.url}
                alt={selectedPhoto.caption || 'Memory'}
                className="max-h-[75vh] mx-auto object-contain rounded-lg shadow-2xl"
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
