"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plane, 
  Calendar, 
  BarChart3, 
  Cake, 
  Image, 
  MessageSquare,
  ArrowRight,
  MapPin,
  Clock,
  Users,
  Heart
} from 'lucide-react'
import { getSettings, getUpcomingTrips, getPastTrips, getActivePolls, getMembers, getPosts } from '@/lib/storage'
import { differenceInDays, parseISO, format } from 'date-fns'
import type { Trip, Poll, Member, WallPost } from '@/lib/types'

function getUpcomingBirthdays(members: Member[], days: number = 7) {
  const today = new Date()
  const upcoming: Array<{ member: Member; daysUntil: number }> = []

  members.forEach(member => {
    const birthday = parseISO(member.birthday)
    const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())
    
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1)
    }
    
    const daysUntil = differenceInDays(thisYearBirthday, today)
    if (daysUntil >= 0 && daysUntil <= days) {
      upcoming.push({ member, daysUntil })
    }
  })

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil)
}

export default function HomePage() {
  const [groupName, setGroupName] = useState('Team Voyage')
  const [upcomingTrip, setUpcomingTrip] = useState<Trip | null>(null)
  const [latestTrip, setLatestTrip] = useState<Trip | null>(null)
  const [activePolls, setActivePolls] = useState<Poll[]>([])
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Array<{ member: Member; daysUntil: number }>>([])
  const [recentPosts, setRecentPosts] = useState<WallPost[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    setGroupName(getSettings().groupName)
    const upcoming = getUpcomingTrips()
    const past = getPastTrips()
    const polls = getActivePolls()
    const allMembers = getMembers()
    const posts = getPosts()

    if (upcoming.length > 0) {
      setUpcomingTrip(upcoming.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )[0])
    }

    if (past.length > 0) {
      setLatestTrip(past.sort((a, b) => 
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      )[0])
    }

    setActivePolls(polls.slice(0, 2))
    setUpcomingBirthdays(getUpcomingBirthdays(allMembers))
    setRecentPosts(posts.slice(0, 3))
    setMembers(allMembers)
  }, [])

  useEffect(() => {
    if (!upcomingTrip) return

    const updateCountdown = () => {
      const tripDate = new Date(upcomingTrip.startDate)
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
  }, [upcomingTrip])

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown'

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground text-balance">
          Welcome to {groupName}
        </h1>
        <p className="text-muted-foreground">
          Your private space for trips, memories, and celebrations
        </p>
      </div>

      {/* Upcoming Trip Countdown */}
      {upcomingTrip && (
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex flex-col md:flex-row">
            <div className="relative h-48 md:h-auto md:w-1/3">
              <img
                src={upcomingTrip.coverPhoto}
                alt={upcomingTrip.title}
                className="absolute inset-0 h-full w-full object-cover"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r" />
              <div className="absolute bottom-4 left-4 md:hidden">
                <Badge className="bg-primary text-primary-foreground">Next Trip</Badge>
              </div>
            </div>
            <CardContent className="flex-1 p-6">
              <div className="hidden md:block mb-2">
                <Badge className="bg-primary text-primary-foreground">Next Trip</Badge>
              </div>
              <h2 className="text-2xl font-bold mb-2">{upcomingTrip.title}</h2>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                {upcomingTrip.location}
                <span className="mx-2">|</span>
                <Calendar className="h-4 w-4" />
                {format(parseISO(upcomingTrip.startDate), 'MMM d')} - {format(parseISO(upcomingTrip.endDate), 'MMM d, yyyy')}
              </div>

              {/* Countdown */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { value: countdown.days, label: 'Days' },
                  { value: countdown.hours, label: 'Hours' },
                  { value: countdown.minutes, label: 'Mins' },
                  { value: countdown.seconds, label: 'Secs' },
                ].map((item, i) => (
                  <div key={i} className="text-center p-3 rounded-lg bg-background/80 border">
                    <div className="text-2xl font-bold text-primary">{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {upcomingTrip.rsvp.filter(r => r.status === 'yes').length} confirmed
                </div>
                <Button asChild>
                  <Link href="/upcoming">
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/trips">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Plane className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{getPastTrips().length}</p>
                <p className="text-sm text-muted-foreground">Past Trips</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/polls">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                <BarChart3 className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activePolls.length}</p>
                <p className="text-sm text-muted-foreground">Active Polls</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/birthdays">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Cake className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingBirthdays.length}</p>
                <p className="text-sm text-muted-foreground">Birthdays This Week</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/members">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted group-hover:bg-muted/80 transition-colors">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest Trip Memory */}
        {latestTrip && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Latest Memory
              </CardTitle>
              <CardDescription>From {latestTrip.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/trips/${latestTrip.id}`} className="block group">
                <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                  <img
                    src={latestTrip.coverPhoto}
                    alt={latestTrip.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-medium">{latestTrip.title}</p>
                    <p className="text-white/80 text-sm">{latestTrip.location}</p>
                  </div>
                </div>
                {latestTrip.bestMoment && (
                  <p className="text-sm text-muted-foreground italic">
                    &ldquo;{latestTrip.bestMoment}&rdquo;
                  </p>
                )}
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-accent" />
              Upcoming Birthdays
            </CardTitle>
            <CardDescription>Coming up this week</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBirthdays.length > 0 ? (
              <div className="space-y-3">
                {upcomingBirthdays.slice(0, 4).map(({ member, daysUntil }) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(member.birthday), 'MMMM d')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={daysUntil === 0 ? "default" : "secondary"} className={daysUntil === 0 ? "bg-accent text-accent-foreground" : ""}>
                      {daysUntil === 0 ? 'Today!' : `${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">
                No birthdays this week
              </p>
            )}
            <Button variant="ghost" className="w-full mt-3" asChild>
              <Link href="/birthdays">
                View All Birthdays <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Wall Posts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-secondary" />
            Recent Posts
          </CardTitle>
          <CardDescription>What the team is talking about</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.map(post => (
              <div key={post.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                  {getMemberName(post.authorId).split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{getMemberName(post.authorId)}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(post.createdAt), 'MMM d')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Heart className="h-3 w-3" />
                    {post.likes.length} likes
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-3" asChild>
            <Link href="/wall">
              Go to Group Wall <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
