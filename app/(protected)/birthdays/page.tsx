"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Cake, 
  Calendar,
  Gift,
  PartyPopper
} from 'lucide-react'
import { getMembers } from '@/lib/storage'
import { format, parseISO, differenceInDays, isSameMonth, getMonth } from 'date-fns'
import type { Member } from '@/lib/types'

interface BirthdayInfo {
  member: Member
  daysUntil: number
  nextBirthday: Date
}

function calculateBirthdays(members: Member[]): BirthdayInfo[] {
  const today = new Date()
  
  return members.map(member => {
    const birthday = parseISO(member.birthday)
    let nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())
    
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1)
    }
    
    // Handle case where today IS the birthday
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const birthdayDate = new Date(nextBirthday.getFullYear(), nextBirthday.getMonth(), nextBirthday.getDate())
    
    const daysUntil = Math.round((birthdayDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return { member, daysUntil, nextBirthday }
  }).sort((a, b) => a.daysUntil - b.daysUntil)
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function BirthdaysPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [birthdayInfos, setBirthdayInfos] = useState<BirthdayInfo[]>([])

  useEffect(() => {
    const allMembers = getMembers()
    setMembers(allMembers)
    setBirthdayInfos(calculateBirthdays(allMembers))
  }, [])

  const todaysBirthdays = birthdayInfos.filter(b => b.daysUntil === 0)
  const thisWeek = birthdayInfos.filter(b => b.daysUntil > 0 && b.daysUntil <= 7)
  const thisMonth = birthdayInfos.filter(b => b.daysUntil > 7 && b.daysUntil <= 30)
  
  const currentMonth = getMonth(new Date())
  const membersByMonth = months.map((month, index) => ({
    month,
    members: members.filter(m => parseISO(m.birthday).getMonth() === index)
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Birthday Tracker</h1>
        <p className="text-muted-foreground">Never miss a celebration</p>
      </div>

      {/* Today's Birthdays Banner */}
      {todaysBirthdays.length > 0 && (
        <Card className="border-accent/30 bg-gradient-to-r from-accent/10 to-primary/10 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
                <PartyPopper className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Happy Birthday!</h2>
                <p className="text-lg">
                  {todaysBirthdays.map(b => b.member.name).join(', ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                {thisWeek.map(({ member, daysUntil, nextBirthday }) => (
                  <Card key={member.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(nextBirthday, 'EEEE, MMMM d')}
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
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
                {thisMonth.map(({ member, daysUntil, nextBirthday }) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-lg">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(nextBirthday, 'MMMM d')}
                          </p>
                        </div>
                        <Badge variant="outline">
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
                  {birthdayInfos.map(({ member, daysUntil, nextBirthday }) => (
                    <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(nextBirthday, 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={daysUntil === 0 ? "default" : daysUntil <= 7 ? "secondary" : "outline"}
                        className={daysUntil === 0 ? "bg-accent text-accent-foreground" : ""}
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
            {membersByMonth.map(({ month, members: monthMembers }, index) => (
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
                  {monthMembers.length > 0 ? (
                    <div className="space-y-2">
                      {monthMembers.map(member => (
                        <div key={member.id} className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{format(parseISO(member.birthday), 'd')}</span>
                          <span className="text-muted-foreground">-</span>
                          <span>{member.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No birthdays</p>
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
