"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Empty } from '@/components/ui/empty'
import { 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock,
  Plus,
  Plane
} from 'lucide-react'
import { getUpcomingTrips, getMembers, updateTrip } from '@/lib/storage'
import { format, parseISO, differenceInDays } from 'date-fns'
import type { Trip, Member } from '@/lib/types'
import { TripFormDialog } from '@/components/trips/trip-form-dialog'

export default function UpcomingPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [showAddDialog, setShowAddDialog] = useState(false)

  useEffect(() => {
    const upcomingTrips = getUpcomingTrips().sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    setTrips(upcomingTrips)
    setMembers(getMembers())
  }, [])

  const nextTrip = trips[0]

  useEffect(() => {
    if (!nextTrip) return

    const updateCountdown = () => {
      const tripDate = new Date(nextTrip.startDate)
      const now = new Date()
      const diff = tripDate.getTime() - now.getTime()

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [nextTrip])

  const handleChecklistToggle = (tripId: string, itemIndex: number) => {
    const trip = trips.find(t => t.id === tripId)
    if (!trip || !trip.checklist) return

    const updatedChecklist = [...trip.checklist]
    updatedChecklist[itemIndex] = {
      ...updatedChecklist[itemIndex],
      done: !updatedChecklist[itemIndex].done
    }

    updateTrip(tripId, { checklist: updatedChecklist })
    setTrips(trips.map(t => 
      t.id === tripId ? { ...t, checklist: updatedChecklist } : t
    ))
  }

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown'

  const refreshTrips = () => {
    const upcomingTrips = getUpcomingTrips().sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    setTrips(upcomingTrips)
  }

  if (trips.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Upcoming Trips</h1>
            <p className="text-muted-foreground">Plan your next adventure</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Plan Trip
          </Button>
        </div>
        <Empty
          icon={<Plane className="h-12 w-12" />}
          title="No upcoming trips"
          description="Start planning your next adventure!"
        />
        <TripFormDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
          onSuccess={refreshTrips}
          members={members}
          isUpcoming
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Upcoming Trips</h1>
          <p className="text-muted-foreground">Get ready for your next adventure</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Plan Trip
        </Button>
      </div>

      {/* Next Trip Hero */}
      {nextTrip && (
        <Card className="overflow-hidden">
          <div className="relative h-64 md:h-80">
            <img
              src={nextTrip.coverPhoto}
              alt={nextTrip.title}
              className="absolute inset-0 h-full w-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <Badge className="mb-3 bg-primary text-primary-foreground">Next Trip</Badge>
              <h2 className="text-3xl font-bold mb-2">{nextTrip.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {nextTrip.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(nextTrip.startDate), 'MMM d')} - {format(parseISO(nextTrip.endDate), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            {/* Countdown */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { value: countdown.days, label: 'Days' },
                { value: countdown.hours, label: 'Hours' },
                { value: countdown.minutes, label: 'Minutes' },
                { value: countdown.seconds, label: 'Seconds' },
              ].map((item, i) => (
                <div key={i} className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{item.value}</div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground mb-6">{nextTrip.description}</p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* RSVP Status */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Who&apos;s Coming
                </h3>
                <div className="space-y-2">
                  {nextTrip.rsvp.map(({ memberId, status }) => (
                    <div key={memberId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                          {getMemberName(memberId).split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm">{getMemberName(memberId)}</span>
                      </div>
                      <Badge 
                        variant={status === 'yes' ? 'default' : status === 'maybe' ? 'secondary' : 'outline'}
                        className={status === 'yes' ? 'bg-green-500 text-white' : status === 'no' ? 'text-destructive' : ''}
                      >
                        {status === 'yes' ? 'Going' : status === 'maybe' ? 'Maybe' : 'Not Going'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              {nextTrip.checklist && nextTrip.checklist.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Trip Checklist
                  </h3>
                  <div className="space-y-2">
                    {nextTrip.checklist.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                        onClick={() => handleChecklistToggle(nextTrip.id, index)}
                      >
                        <Checkbox checked={item.done} />
                        <span className={item.done ? 'line-through text-muted-foreground' : ''}>
                          {item.item}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {nextTrip.checklist.filter(i => i.done).length} of {nextTrip.checklist.length} completed
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Upcoming Trips */}
      {trips.length > 1 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">More Planned Trips</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.slice(1).map(trip => (
              <Card key={trip.id} className="overflow-hidden">
                <div className="relative h-32">
                  <img
                    src={trip.coverPhoto}
                    alt={trip.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 text-white">
                    <h3 className="font-semibold">{trip.title}</h3>
                    <p className="text-xs text-white/80">{trip.location}</p>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(trip.startDate), 'MMM d, yyyy')}
                    </div>
                    <Badge variant="outline">
                      {differenceInDays(parseISO(trip.startDate), new Date())} days
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <TripFormDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onSuccess={refreshTrips}
        members={members}
        isUpcoming
      />
    </div>
  )
}
