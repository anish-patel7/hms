"use client"

import { useEffect, useState } from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Cake, PartyPopper } from 'lucide-react'
import { getMembers } from '@/lib/storage'
import { isToday, parseISO, format } from 'date-fns'
import type { Member } from '@/lib/types'

function getTodaysCelebrations(members: Member[]) {
  const today = new Date()
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()
  
  const birthdays: Member[] = []
  const anniversaries: Member[] = []
  
  members.forEach(member => {
    const birthday = parseISO(member.birthday)
    if (birthday.getMonth() === todayMonth && birthday.getDate() === todayDate) {
      birthdays.push(member)
    }
    
    if (member.anniversary) {
      const anniversary = parseISO(member.anniversary)
      if (anniversary.getMonth() === todayMonth && anniversary.getDate() === todayDate) {
        anniversaries.push(member)
      }
    }
  })
  
  return { birthdays, anniversaries }
}

export function Header() {
  const [celebrations, setCelebrations] = useState<{
    birthdays: Member[]
    anniversaries: Member[]
  }>({ birthdays: [], anniversaries: [] })

  useEffect(() => {
    const members = getMembers()
    setCelebrations(getTodaysCelebrations(members))
  }, [])

  const hasCelebrations = celebrations.birthdays.length > 0 || celebrations.anniversaries.length > 0

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      
      {hasCelebrations && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-500">
          {celebrations.birthdays.length > 0 && (
            <Badge variant="secondary" className="gap-1.5 bg-accent/10 text-accent border-accent/20">
              <Cake className="h-3 w-3" />
              <span className="hidden sm:inline">Birthday:</span>
              {celebrations.birthdays.map(m => m.name.split(' ')[0]).join(', ')}
            </Badge>
          )}
          {celebrations.anniversaries.length > 0 && (
            <Badge variant="secondary" className="gap-1.5 bg-secondary/10 text-secondary border-secondary/20">
              <PartyPopper className="h-3 w-3" />
              <span className="hidden sm:inline">Anniversary:</span>
              {celebrations.anniversaries.map(m => m.name.split(' ')[0]).join(', ')}
            </Badge>
          )}
        </div>
      )}
      
      <div className="ml-auto text-sm text-muted-foreground">
        {format(new Date(), 'EEEE, MMMM d')}
      </div>
    </header>
  )
}
