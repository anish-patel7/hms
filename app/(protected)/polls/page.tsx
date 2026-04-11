"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Empty } from '@/components/ui/empty'
import { 
  BarChart3, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trophy,
  Users
} from 'lucide-react'
import { getPolls, votePoll, closePoll, getMembers } from '@/lib/storage'
import { format, parseISO } from 'date-fns'
import type { Poll, Member } from '@/lib/types'
import { CreatePollDialog } from '@/components/polls/create-poll-dialog'
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const VOTER_ID = 'current-voter' // In a real app, this would be the logged-in user's ID

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set())

  useEffect(() => {
    setPolls(getPolls())
    setMembers(getMembers())
    
    // Track which polls the user has voted on in this session
    const stored = sessionStorage.getItem('voted-polls')
    if (stored) {
      setVotedPolls(new Set(JSON.parse(stored)))
    }
  }, [])

  const activePolls = polls.filter(p => p.isActive)
  const closedPolls = polls.filter(p => !p.isActive)

  const handleVote = (pollId: string, optionId: string) => {
    votePoll(pollId, optionId, VOTER_ID)
    setPolls(getPolls())
    
    const newVotedPolls = new Set(votedPolls)
    newVotedPolls.add(pollId)
    setVotedPolls(newVotedPolls)
    sessionStorage.setItem('voted-polls', JSON.stringify([...newVotedPolls]))
  }

  const handleClosePoll = (pollId: string) => {
    closePoll(pollId)
    setPolls(getPolls())
  }

  const refreshPolls = () => {
    setPolls(getPolls())
  }

  const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown'

  const getWinningOption = (poll: Poll) => {
    const sorted = [...poll.options].sort((a, b) => b.votes.length - a.votes.length)
    return sorted[0]
  }

  const chartConfig = {
    votes: {
      label: "Votes",
      color: "var(--color-primary)",
    },
  }

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Polls</h1>
          <p className="text-muted-foreground">Vote on team decisions together</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Poll
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Clock className="h-4 w-4" />
            Active ({activePolls.length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Closed ({closedPolls.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activePolls.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {activePolls.map(poll => {
                const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0)
                const hasVoted = votedPolls.has(poll.id)
                const chartData = poll.options.map((opt, i) => ({
                  name: opt.text.length > 15 ? opt.text.substring(0, 15) + '...' : opt.text,
                  votes: opt.votes.length,
                  fill: colors[i % colors.length]
                }))

                return (
                  <Card key={poll.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg">{poll.question}</CardTitle>
                          <CardDescription>
                            Created {format(parseISO(poll.createdAt), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {hasVoted ? (
                        // Show results after voting
                        <div className="space-y-4">
                          <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} layout="vertical">
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={100} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="votes" radius={4}>
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleClosePoll(poll.id)}
                            >
                              Close Poll
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Show voting options
                        <div className="space-y-2">
                          {poll.options.map(option => (
                            <Button
                              key={option.id}
                              variant="outline"
                              className="w-full justify-start h-auto py-3 px-4"
                              onClick={() => handleVote(poll.id, option.id)}
                            >
                              {option.text}
                            </Button>
                          ))}
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            Click an option to vote
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Empty
              icon={<BarChart3 className="h-12 w-12" />}
              title="No active polls"
              description="Create a new poll to get the team's opinion!"
            />
          )}
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          {closedPolls.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {closedPolls.map(poll => {
                const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0)
                const winner = getWinningOption(poll)
                const chartData = poll.options.map((opt, i) => ({
                  name: opt.text.length > 15 ? opt.text.substring(0, 15) + '...' : opt.text,
                  votes: opt.votes.length,
                  fill: colors[i % colors.length]
                }))

                return (
                  <Card key={poll.id} className="opacity-90">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg">{poll.question}</CardTitle>
                          <CardDescription>
                            Closed {format(parseISO(poll.createdAt), 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">Closed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Winner Banner */}
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <Trophy className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Winner</p>
                          <p className="text-primary font-semibold">{winner.text}</p>
                        </div>
                        <Badge className="ml-auto">{winner.votes.length} votes</Badge>
                      </div>

                      {/* Results Chart */}
                      <ChartContainer config={chartConfig} className="h-[150px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical">
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={100} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="votes" radius={4}>
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>

                      <p className="text-sm text-muted-foreground text-center">
                        {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Empty
              icon={<CheckCircle2 className="h-12 w-12" />}
              title="No closed polls"
              description="Closed polls will appear here"
            />
          )}
        </TabsContent>
      </Tabs>

      <CreatePollDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refreshPolls}
      />
    </div>
  )
}
