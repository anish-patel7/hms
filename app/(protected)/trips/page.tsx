"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Empty } from '@/components/ui/empty'
import { MapPin, Calendar, Users, Search, Plane, Plus } from 'lucide-react'
import { getPastTrips, getMembers, pullSharedData } from '@/lib/storage'
import { format, parseISO } from 'date-fns'
import type { Trip, Member } from '@/lib/types'
import { useAuth } from '@/components/auth/auth-provider'
import { TripFormDialog } from '@/components/trips/trip-form-dialog'

export default function TripsPage() {
  const { role } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    // Pull cloud data first, then load
    pullSharedData().then(() => {
      setTrips(getPastTrips().sort((a, b) => 
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      ))
      setMembers(getMembers())
    })
    // Also load local immediately
    setTrips(getPastTrips().sort((a, b) => 
      new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    ))
    setMembers(getMembers())
  }, [])

  const filteredTrips = trips.filter(trip =>
    trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const refreshTrips = () => {
    setTrips(getPastTrips().sort((a, b) => 
      new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Past Trips</h1>
          <p className="text-muted-foreground">Relive your favorite memories</p>
        </div>
        {role === 'admin' && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Trip
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search trips by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredTrips.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip) => (
            <Link href={`/trips/${trip.id}`} key={trip.id}>
              <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow h-full">
                <div className="relative aspect-[4/3]">
                  <img
                    src={trip.coverPhoto}
                    alt={trip.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                    
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-bold text-lg mb-1">{trip.title}</h3>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <MapPin className="h-3.5 w-3.5" />
                      {trip.location}
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(trip.startDate), 'MMM yyyy')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {trip.rsvp.filter(r => r.status === 'yes').length} travelers
                    </div>
                  </div>
                  {trip.bestMoment && (
                    <p className="mt-3 text-sm text-muted-foreground italic line-clamp-2">
                      &ldquo;{trip.bestMoment}&rdquo;
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          icon={<Plane className="h-12 w-12" />}
          title="No trips found"
          description={searchQuery ? "Try a different search term" : "Add your first trip memory!"}
        />
      )}

      <TripFormDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={refreshTrips}
        members={members}
      />
    </div>
  )
}
