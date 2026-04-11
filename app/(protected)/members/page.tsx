"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Empty } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Plus,
  Search,
  Cake,
  Calendar,
  Heart,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  ImageIcon,
  Edit2,
  Key
} from 'lucide-react'
import { getMembers, deleteMember, syncUsersFromSupabase, updateMember, hashPassword } from '@/lib/storage'
import { compressImage } from '@/lib/image-utils'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import type { Member } from '@/lib/types'
import { useAuth } from '@/components/auth/auth-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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

export default function MembersPage() {
  const { role } = useAuth()
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  // States for uploading photo by admin
  const [showPhotoDialog, setShowPhotoDialog] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [photoBase64, setPhotoBase64] = useState('')

  // States for editing member details
  const [showEditDetailsDialog, setShowEditDetailsDialog] = useState(false)
  const [editName, setEditName] = useState('')
  const [editArea, setEditArea] = useState('')
  const [editBirthday, setEditBirthday] = useState('')
  const [editAnniversary, setEditAnniversary] = useState('')

  // States for resetting credentials
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetPin, setResetPin] = useState('')

  // State for regular user viewing beautiful full profiles
  const [viewingMember, setViewingMember] = useState<Member | null>(null)

  useEffect(() => {
    // Initial load
    setMembers(getMembers())
    // Background sync to ensure we have latest statuses
    syncUsersFromSupabase().then(() => {
      setMembers(getMembers())
    })
  }, [])

  const refreshMembers = async () => {
    await syncUsersFromSupabase()
    setMembers(getMembers())
  }

  const activeMembers = members.filter(m => m.status === 'approved' || !m.status)
  const pendingMembers = members.filter(m => m.status === 'pending')
  const rejectedMembers = members.filter(m => m.status === 'rejected')

  const filteredActive = activeMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleApprove = async (id: string) => {
    await supabase.from('users').update({ status: 'approved' }).eq('id', id)
    refreshMembers()
  }

  const handleReject = async (id: string) => {
    await supabase.from('users').update({ status: 'rejected' }).eq('id', id)
    refreshMembers()
  }

  const handleDeleteMember = async (id: string) => {
    // Attempt delete in Supabase if it exists
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) {
      alert("Failed to delete member on the server. Please check your Supabase Row-Level Security (RLS) policies. Error: " + error.message)
      console.error("Delete error:", error)
    }
    // Delete locally
    deleteMember(id)
    refreshMembers()
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) return // 10MB limit since we compress
      try {
        const compressed = await compressImage(file, 400, 400, 0.8) // Avatars can be smaller
        setPhotoBase64(compressed)
      } catch (err) {
        console.error('Failed to compress image:', err)
      }
    }
  }

  const submitPhotoUpdate = async () => {
    if (!selectedUserId || !photoBase64) return
    await supabase.from('users').update({ profile_photo: photoBase64 }).eq('id', selectedUserId)
    setShowPhotoDialog(false)
    setPhotoBase64('')
    setSelectedUserId(null)
    refreshMembers()
  }

  const handleOpenEditDetails = (member: Member) => {
    setSelectedUserId(member.id)
    setEditName(member.name || '')
    setEditArea(member.area || '')
    setEditBirthday(member.birthday || '')
    setEditAnniversary(member.anniversary || '')
    setShowEditDetailsDialog(true)
  }

  const submitDetailsUpdate = async () => {
    if (!selectedUserId) return
    await supabase.from('users').update({ 
      name: editName, 
      area: editArea, 
      dob: editBirthday, 
      marriage_date: editAnniversary || null
    }).eq('id', selectedUserId)
    
    updateMember(selectedUserId, {
      name: editName,
      area: editArea,
      birthday: editBirthday,
      anniversary: editAnniversary
    })
    
    setShowEditDetailsDialog(false)
    refreshMembers()
  }

  const submitReset = async () => {
    if (!selectedUserId || !resetPassword || resetPin.length !== 4) return
    const hashed = hashPassword(resetPassword)
    await supabase.from('users').update({ password: hashed, pin: resetPin }).eq('id', selectedUserId)
    setShowResetDialog(false)
    setResetPassword('')
    setResetPin('')
    setSelectedUserId(null)
    // Optional toast notification here
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">{activeMembers.length} active members in your group</p>
        </div>
      </div>

      <Tabs defaultValue="active">
        {role === 'admin' && (
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Users className="h-4 w-4" />
              Active Team ({activeMembers.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending Requests ({pendingMembers.length})
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="active" className="mt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>

          {filteredActive.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredActive.map(member => (
                <Card 
                  key={member.id} 
                  className="group overflow-hidden rounded-2xl border-none shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-muted/20 cursor-pointer"
                  onClick={() => setViewingMember(member)}
                >
                  <div className="h-24 bg-gradient-to-r from-primary/30 via-accent/20 to-secondary/30 relative">
                    {role === 'admin' && (
                      <div className="absolute top-3 right-3 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleOpenEditDetails(member); }}
                          className="h-8 w-8 rounded-full shadow-sm hover:text-primary backdrop-blur-md bg-white/70"
                          title="Edit Details"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); setSelectedUserId(member.id); setShowPhotoDialog(true); }}
                          className="h-8 w-8 rounded-full shadow-sm hover:text-primary backdrop-blur-md bg-white/70"
                          title="Update Photo"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); setSelectedUserId(member.id); setShowResetDialog(true); }}
                          className="h-8 w-8 rounded-full shadow-sm hover:text-amber-500 backdrop-blur-md bg-white/70"
                          title="Reset Credentials"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full shadow-sm hover:text-destructive backdrop-blur-md bg-white/70"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove member?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove {member.name} from the group permanently.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteMember(member.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="pt-0 px-6 pb-6 relative">
                    <div className="absolute -top-12 left-6">
                      {member.avatar ? (
                        <div className="h-24 w-24 rounded-full border-4 border-background overflow-hidden shadow-lg bg-background">
                          <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" crossOrigin="anonymous"/>
                        </div>
                      ) : (
                        <div className="h-24 w-24 rounded-full border-4 border-background bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>

                    <div className="pt-16">
                      <h3 className="font-bold text-xl truncate tracking-tight">{member.name}</h3>
                      <p className="text-sm text-muted-foreground/80 mb-4">{member.area || 'Unknown Area'}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm px-3 py-2 bg-background/60 rounded-lg border border-border/50">
                          <Cake className="h-4 w-4 text-accent" />
                          <span className="font-medium text-foreground/90">{member.birthday}</span>
                        </div>
                        {member.anniversary && (
                          <div className="flex items-center gap-3 text-sm px-3 py-2 bg-background/60 rounded-lg border border-border/50">
                            <Heart className="h-4 w-4 text-pink-500" />
                            <span className="font-medium text-foreground/90">{member.anniversary}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-sm px-3 py-2 bg-background/60 rounded-lg border border-border/50 text-muted-foreground">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>Joined {format(parseISO(member.joinDate), 'MMM yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              icon={<Users className="h-12 w-12" />}
              title={searchQuery ? "No members found" : "No active members"}
              description={searchQuery ? "Try a different search term" : "Wait for users to sign up and approve them!"}
            />
          )}
        </TabsContent>

        {role === 'admin' && (
          <TabsContent value="pending" className="mt-6">
            {pendingMembers.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingMembers.map(member => (
                   <Card key={member.id} className="overflow-hidden rounded-2xl border-none shadow-md bg-gradient-to-br from-card to-muted/20">
                    <div className="h-16 bg-gradient-to-r from-muted to-muted/50 border-b border-border/50"></div>
                    <CardContent className="pt-0 px-6 pb-6 relative">
                      <div className="absolute -top-10 left-6">
                       {member.avatar ? (
                         <div className="h-20 w-20 rounded-full border-4 border-background overflow-hidden shadow-lg bg-background">
                           <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" crossOrigin="anonymous"/>
                         </div>
                       ) : (
                         <div className="h-20 w-20 rounded-full border-4 border-background bg-gradient-to-br from-muted-foreground/30 to-muted/30 flex items-center justify-center text-2xl font-bold text-foreground shadow-lg">
                           {member.name.split(' ').map(n => n[0]).join('')}
                         </div>
                       )}
                      </div>
                      
                      <div className="pt-12">
                         <h3 className="font-bold text-xl truncate tracking-tight">{member.name}</h3>
                         <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-3">
                           <span className="flex items-center gap-2"><Cake className="h-4 w-4"/> {member.birthday}</span>
                           {member.anniversary && <span className="flex items-center gap-2"><Heart className="h-4 w-4"/> {member.anniversary}</span>}
                           {member.area && <span className="flex items-center gap-2"><Calendar className="h-4 w-4"/> {member.area}</span>}
                         </div>
                      </div>

                      <div className="mt-6 flex gap-3 w-full">
                         <Button onClick={() => handleApprove(member.id)} className="flex-1 bg-green-600 hover:bg-green-700 shadow-md">
                           <CheckCircle className="h-4 w-4 mr-2" /> Approve
                         </Button>
                         <Button onClick={() => handleReject(member.id)} variant="destructive" className="flex-1 shadow-md">
                           <XCircle className="h-4 w-4 mr-2" /> Reject
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty
                icon={<Clock className="h-12 w-12" />}
                title="No pending requests"
                description="When users sign up, they will appear here for your approval."
              />
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>
              Upload a new profile photo for this member. Max size is 2MB.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
            />
            {photoBase64 && (
              <div className="mt-4 flex justify-center">
                <img src={photoBase64} alt="Preview" className="h-32 w-32 object-cover rounded-full shadow-md" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPhotoDialog(false); setPhotoBase64(''); }}>Cancel</Button>
            <Button onClick={submitPhotoUpdate} disabled={!photoBase64}>Save Photo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDetailsDialog} onOpenChange={setShowEditDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Details</DialogTitle>
            <DialogDescription>
              Update core information for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Area / Location</Label>
              <Input value={editArea} onChange={(e) => setEditArea(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Birthday</Label>
              <Input value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)} placeholder="e.g., 25-12-1990 or Dec 25" />
            </div>
            <div className="grid gap-2">
              <Label>Anniversary (Optional)</Label>
              <Input value={editAnniversary} onChange={(e) => setEditAnniversary(e.target.value)} placeholder="e.g., 14-02-2015" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDetailsDialog(false)}>Cancel</Button>
            <Button onClick={submitDetailsUpdate} disabled={!editName || !editBirthday || !editArea}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Member Credentials</DialogTitle>
            <DialogDescription>
              Assign a temporary password and PIN for this member. They can log in using these immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>New Temporary Password</Label>
              <Input 
                type="text" 
                value={resetPassword} 
                onChange={(e) => setResetPassword(e.target.value)} 
                placeholder="E.g. temp123"
              />
            </div>
            <div className="grid gap-2">
              <Label>New 4-Digit PIN</Label>
              <Input 
                type="text" 
                value={resetPin} 
                onChange={(e) => setResetPin(e.target.value)} 
                placeholder="E.g. 0000"
                maxLength={4}
                className="font-mono tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowResetDialog(false); setResetPassword(''); setResetPin(''); }}>Cancel</Button>
            <Button onClick={submitReset} disabled={!resetPassword || resetPin.length !== 4} className="bg-amber-600 hover:bg-amber-700 text-white">Apply Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Public Profile View Dialog */}
      <Dialog open={!!viewingMember} onOpenChange={(open) => !open && setViewingMember(null)}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden p-0 border-none bg-gradient-to-br from-card to-muted/20">
          <DialogTitle className="sr-only">Member Profile</DialogTitle>
          <DialogDescription className="sr-only">Detailed view of the member's profile and milestones</DialogDescription>
          {viewingMember && (
            <>
              <div className="h-32 bg-gradient-to-r from-primary/30 via-accent/20 to-secondary/30 relative" />
              <div className="px-6 pb-6 relative pt-0">
                <div className="absolute -top-16 left-6">
                  {viewingMember.avatar ? (
                    <div className="h-32 w-32 rounded-full border-4 border-background overflow-hidden shadow-2xl bg-background">
                      <img src={viewingMember.avatar} alt={viewingMember.name} className="h-full w-full object-cover" crossOrigin="anonymous"/>
                    </div>
                  ) : (
                    <div className="h-32 w-32 rounded-full border-4 border-background bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                      {viewingMember.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                
                <div className="pt-20">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">{viewingMember.name}</h2>
                  <p className="text-muted-foreground mb-6 text-xl">{viewingMember.area || 'Unknown Area'}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-background/60 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
                      <div className="p-3 bg-primary/10 rounded-xl"><Cake className="h-6 w-6 text-primary" /></div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Birthday</p>
                        <p className="font-bold text-lg">{viewingMember.birthday}</p>
                      </div>
                    </div>
                    {viewingMember.anniversary && (
                      <div className="flex items-center gap-4 p-4 bg-background/60 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
                        <div className="p-3 bg-pink-500/10 rounded-xl"><Heart className="h-6 w-6 text-pink-500" /></div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Anniversary</p>
                          <p className="font-bold text-lg">{viewingMember.anniversary}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 p-4 bg-background/60 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
                      <div className="p-3 bg-secondary/10 rounded-xl"><Calendar className="h-6 w-6 text-secondary" /></div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Joined Team</p>
                        <p className="font-bold text-lg">{format(parseISO(viewingMember.joinDate), 'MMMM yyyy')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-6 h-12 text-lg" onClick={() => setViewingMember(null)}>
                    Close Profile
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
