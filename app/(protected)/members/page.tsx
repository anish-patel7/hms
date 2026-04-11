"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Empty } from '@/components/ui/empty'
import { 
  Users, 
  Plus,
  Search,
  Cake,
  Calendar,
  Heart,
  Edit,
  Trash2
} from 'lucide-react'
import { getMembers, addMember, deleteMember } from '@/lib/storage'
import { format, parseISO } from 'date-fns'
import type { Member } from '@/lib/types'
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
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newMember, setNewMember] = useState({
    name: '',
    birthday: '',
    bio: '',
    favoriteMemory: ''
  })

  useEffect(() => {
    setMembers(getMembers())
  }, [])

  const refreshMembers = () => {
    setMembers(getMembers())
  }

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddMember = () => {
    if (!newMember.name || !newMember.birthday) return

    addMember({
      name: newMember.name,
      birthday: newMember.birthday,
      bio: newMember.bio || undefined,
      favoriteMemory: newMember.favoriteMemory || undefined,
      joinDate: new Date().toISOString()
    })

    setNewMember({ name: '', birthday: '', bio: '', favoriteMemory: '' })
    setShowAddDialog(false)
    refreshMembers()
  }

  const handleDeleteMember = (id: string) => {
    deleteMember(id)
    refreshMembers()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">{members.length} members in your group</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredMembers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map(member => (
            <Card key={member.id} className="group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xl font-bold text-primary">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg truncate">{member.name}</h3>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {member.name} from the group. This action cannot be undone.
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
                    
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Cake className="h-3.5 w-3.5" />
                      {format(parseISO(member.birthday), 'MMMM d')}
                    </div>
                  </div>
                </div>

                {member.bio && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {member.bio}
                  </p>
                )}

                {member.favoriteMemory && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-1">
                      <Heart className="h-3 w-3" />
                      Favorite Memory
                    </div>
                    <p className="text-sm italic text-muted-foreground">
                      &ldquo;{member.favoriteMemory}&rdquo;
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Member since {format(parseISO(member.joinDate), 'MMMM yyyy')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty
          icon={<Users className="h-12 w-12" />}
          title={searchQuery ? "No members found" : "No members yet"}
          description={searchQuery ? "Try a different search term" : "Add your first team member!"}
        />
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your group
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Full name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={newMember.birthday}
                onChange={(e) => setNewMember({ ...newMember, birthday: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                placeholder="A short bio..."
                value={newMember.bio}
                onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="memory">Favorite Memory (optional)</Label>
              <Input
                id="memory"
                placeholder="Their favorite group memory"
                value={newMember.favoriteMemory}
                onChange={(e) => setNewMember({ ...newMember, favoriteMemory: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={!newMember.name || !newMember.birthday}
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
