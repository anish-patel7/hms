"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Cake, 
  Calendar,
  Gift,
  Heart,
  PartyPopper
} from 'lucide-react'
import { getMembers } from '@/lib/storage'
import { format, parseISO, differenceInDays, isSameMonth, getMonth } from 'date-fns'
import type { Member } from '@/lib/types'

interface SpecialDayInfo {
  member: Member
  daysUntil: number
  nextDate: Date
  type: 'birthday' | 'anniversary'
}

function parseBirthday(dateStr: string): Date {
  if (!dateStr) return new Date()
  if (dateStr.includes('-') && dateStr.split('-').length === 3) {
    return parseISO(dateStr)
  }
  const [dd, mm] = dateStr.split('-')
  return new Date(2000, parseInt(mm) - 1, parseInt(dd))
}

function calculateSpecialDays(members: Member[]): SpecialDayInfo[] {
  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  const events: SpecialDayInfo[] = []

  members.forEach(member => {
    // Birthdays
    if (member.birthday) {
      const bday = parseBirthday(member.birthday)
      let nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
      if (nextBday < todayDate && nextBday.getTime() !== todayDate.getTime()) {
        nextBday.setFullYear(today.getFullYear() + 1)
      }
      const daysUntil = Math.round((nextBday.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
      events.push({ member, daysUntil, nextDate: nextBday, type: 'birthday' })
    }

    // Anniversaries
    if (member.anniversary) {
      const anniv = parseBirthday(member.anniversary)
      let nextAnniv = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate())
      if (nextAnniv < todayDate && nextAnniv.getTime() !== todayDate.getTime()) {
        nextAnniv.setFullYear(today.getFullYear() + 1)
      }
      const daysUntil = Math.round((nextAnniv.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
      events.push({ member, daysUntil, nextDate: nextAnniv, type: 'anniversary' })
    }
  })

  return events.sort((a, b) => a.daysUntil - b.daysUntil)
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function BirthdaysPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [specialDays, setSpecialDays] = useState<SpecialDayInfo[]>([])

  useEffect(() => {
    const allMembers = getMembers()
    setMembers(allMembers)
    setSpecialDays(calculateSpecialDays(allMembers))
  }, [])

  const todaysEvents = specialDays.filter(b => b.daysUntil === 0)
  const thisWeek = specialDays.filter(b => b.daysUntil > 0 && b.daysUntil <= 7)
  const thisMonth = specialDays.filter(b => b.daysUntil > 7 && b.daysUntil <= 30)
  
  const currentMonth = getMonth(new Date())
  const membersByMonth = months.map((month, index) => {
    const monthBirthdays = members.filter(m => m.birthday && parseBirthday(m.birthday).getMonth() === index).map(m => ({...m, type: 'birthday' as const}))
    const monthAnniversaries = members.filter(m => m.anniversary && parseBirthday(m.anniversary).getMonth() === index).map(m => ({...m, type: 'anniversary' as const}))
    return {
      month,
      events: [...monthBirthdays, ...monthAnniversaries].sort((a, b) => {
        const d1 = parseBirthday(a.type === 'birthday' ? a.birthday : a.anniversary!).getDate()
        const d2 = parseBirthday(b.type === 'birthday' ? b.birthday : b.anniversary!).getDate()
        return d1 - d2
      })
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Special Days</h1>
        <p className="text-muted-foreground">Never miss a birthday or anniversary celebration!</p>
      </div>

      {/* Today's Special Days Banner */}
      {todaysEvents.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {todaysEvents.map((event, idx) => (
            <Card key={`${event.member.id}-${idx}`} className="border-accent/50 bg-gradient-to-br from-accent/20 via-primary/10 to-background overflow-hidden relative shadow-lg">
              <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                {event.type === 'birthday' ? <PartyPopper className="h-32 w-32" /> : <Gift className="h-32 w-32" />}
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4 relative z-10">
                  <div className="relative">
                    {event.member.avatar ? (
                      <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-background overflow-hidden shadow-2xl">
                        <img src={event.member.avatar} alt={event.member.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-background bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-5xl font-bold text-white shadow-2xl">
                        {event.member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 text-sm bg-accent text-accent-foreground shadow-md whitespace-nowrap">
                      {event.type === 'birthday' ? 'Happy Birthday!' : 'Happy Anniversary!'}
                    </Badge>
                  </div>
                  
                  <div className="mt-4">
                    <h2 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                      {event.member.name}
                    </h2>
                    <p className="text-muted-foreground font-medium mt-1">
                      {event.type === 'birthday' ? 'Wishing you a fantastic day!' : 'Celebrating another great milestone!'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <Gift className="h-4 w-4" />
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            By Month
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-6">
          {/* This Week */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Cake className="h-5 w-5 text-primary" />
              This Week
            </h3>
            {thisWeek.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {thisWeek.map(({ member, daysUntil, nextDate, type }, idx) => (
                  <Card key={`${member.id}-${idx}`} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {member.avatar ? (
                          <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 shadow-sm">
                            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate flex items-center gap-1.5">
                            {member.name}
                            {type === 'anniversary' && <Heart className="h-3.5 w-3.5 text-pink-500" />}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {format(nextDate, 'EEEE, MMM d')}
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
                          {daysUntil} day{daysUntil > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No birthdays this week</p>
            )}
          </div>

          {/* This Month */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary" />
              Coming Up This Month
            </h3>
            {thisMonth.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {thisMonth.map(({ member, daysUntil, nextDate, type }, idx) => (
                  <Card key={`${member.id}-${idx}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {member.avatar ? (
                          <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 shadow-sm">
                            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-lg shrink-0">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate flex items-center gap-1.5">
                            {member.name}
                            {type === 'anniversary' && <Heart className="h-3.5 w-3.5 text-pink-500" />}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {format(nextDate, 'MMMM d')}
                          </p>
                        </div>
                        <Badge variant="outline" className="whitespace-nowrap">
                          {daysUntil} days
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No more birthdays this month</p>
            )}
          </div>

          {/* All Upcoming */}
          <div>
            <h3 className="text-lg font-semibold mb-4">All Upcoming</h3>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {specialDays.map(({ member, daysUntil, nextDate, type }, idx) => (
                    <div key={`${member.id}-${idx}`} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {member.avatar ? (
                          <div className="h-10 w-10 rounded-full overflow-hidden shrink-0">
                            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium shrink-0">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate flex items-center gap-1.5">
                            {member.name}
                            {type === 'anniversary' && <Heart className="h-3.5 w-3.5 text-pink-500" />}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {format(nextDate, 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={daysUntil === 0 ? "default" : daysUntil <= 7 ? "secondary" : "outline"}
                        className={daysUntil === 0 ? "bg-accent text-accent-foreground whitespace-nowrap ml-2" : "whitespace-nowrap ml-2"}
                      >
                        {daysUntil === 0 ? 'Today!' : `${daysUntil} days`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {membersByMonth.map(({ month, events }, index) => (
              <Card 
                key={month} 
                className={index === currentMonth ? 'border-primary/50 bg-primary/5' : ''}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {month}
                    {index === currentMonth && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length > 0 ? (
                    <div className="space-y-2">
                      {events.map((event, idx) => (
                        <div key={`${event.id}-${idx}`} className="flex items-center gap-2 text-sm justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-medium tabular-nums shadow-sm bg-muted rounded px-1 min-w-[24px] text-center">
                              {format(parseBirthday(event.type === 'birthday' ? event.birthday : event.anniversary!), 'd')}
                            </span>
                            <span className="truncate">{event.name}</span>
                          </div>
                          {event.type === 'anniversary' ? <Heart className="h-3 w-3 text-pink-500 shrink-0" /> : <PartyPopper className="h-3 w-3 text-accent shrink-0" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No events</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
