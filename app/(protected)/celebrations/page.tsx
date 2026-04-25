"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Empty } from '@/components/ui/empty'
import { 
  PartyPopper, 
  Plus,
  Calendar,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  PlusCircle
} from 'lucide-react'
import { getCelebrations, deleteCelebration, updateCelebration } from '@/lib/storage'
import { compressImage } from '@/lib/image-utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, parseISO } from 'date-fns'
import type { Celebration } from '@/lib/types'
import { AddCelebrationDialog } from '@/components/celebrations/add-celebration-dialog'
import { useAuth } from '@/components/auth/auth-provider'

const categoryLabels: Record<string, { label: string; color: string }> = {
  diwali: { label: 'Diwali', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  holi: { label: 'Holi', color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  christmas: { label: 'Christmas', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  newyear: { label: 'New Year', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  other: { label: 'Other', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' },
}

export default function CelebrationsPage() {
  const { role } = useAuth()
  const [celebrations, setCelebrations] = useState<Celebration[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    setCelebrations(getCelebrations().sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ))
  }, [])

  const refreshCelebrations = () => {
    setCelebrations(getCelebrations().sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ))
  }

  const categories = ['all', 'diwali', 'holi', 'christmas', 'newyear', 'other'] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Festival Corner</h1>
          <p className="text-muted-foreground">Memories from our celebrations together</p>
        </div>
        {role === 'admin' && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Celebration
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap h-auto gap-1">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat === 'all' ? 'All' : categoryLabels[cat]?.label || cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            {(() => {
              const filtered = category === 'all' 
                ? celebrations 
                : celebrations.filter(c => c.category === category)
              
              if (filtered.length === 0) {
                return (
                  <Empty
                    icon={<PartyPopper className="h-12 w-12" />}
                    title="No celebrations yet"
                    description="Add your first celebration memory!"
                  />
                )
              }

              return (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map(celebration => (
                    <Card key={celebration.id} className="overflow-hidden group relative">
                      {role === 'admin' && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute z-10 top-2 left-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-destructive/90 bg-destructive text-destructive-foreground border-destructive"
                          onClick={() => {
                            if (confirm('Delete this celebration?')) {
                              deleteCelebration(celebration.id)
                              refreshCelebrations()
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {celebration.photos.length > 0 ? (
                        <div className="relative aspect-[4/3]">
                          <img
                            src={celebration.photos[0]}
                            alt={celebration.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                            
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-3 left-3 right-3">
                            <Badge className={categoryLabels[celebration.category].color}>
                              {categoryLabels[celebration.category].label}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <Sparkles className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1">{celebration.title}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(parseISO(celebration.date), 'MMMM d, yyyy')}
                        </div>
                        {celebration.captions.length > 0 && (
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {celebration.captions[0]}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            })()}
          </TabsContent>
        ))}
      </Tabs>

      <AddCelebrationDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={refreshCelebrations}
      />

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
