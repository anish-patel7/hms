"use client"

import type { AppData, Member, Trip, Poll, Celebration, WallPost, Memory } from './types'
import { sampleData } from './sample-data'

const STORAGE_KEY = 'team-voyage-data'
const CURRENT_VERSION = 1

function getDefaultData(): AppData {
  return sampleData
}

export function getData(): AppData {
  if (typeof window === 'undefined') return getDefaultData()
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    const defaultData = getDefaultData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
    return defaultData
  }
  
  try {
    const data = JSON.parse(stored) as AppData
    if (data.version !== CURRENT_VERSION) {
      const migrated = migrateData(data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    return data
  } catch {
    const defaultData = getDefaultData()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
    return defaultData
  }
}

function migrateData(data: AppData): AppData {
  return { ...data, version: CURRENT_VERSION }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Settings
export function getSettings() {
  return getData().settings
}

export function updateSettings(settings: Partial<AppData['settings']>) {
  const data = getData()
  data.settings = { ...data.settings, ...settings }
  saveData(data)
  return data.settings
}

// Members
export function getMembers(): Member[] {
  return getData().members
}

export function getMember(id: string): Member | undefined {
  return getData().members.find(m => m.id === id)
}

export function addMember(member: Omit<Member, 'id'>): Member {
  const data = getData()
  const newMember = { ...member, id: crypto.randomUUID() }
  data.members.push(newMember)
  saveData(data)
  return newMember
}

export function updateMember(id: string, updates: Partial<Member>): Member | undefined {
  const data = getData()
  const index = data.members.findIndex(m => m.id === id)
  if (index === -1) return undefined
  data.members[index] = { ...data.members[index], ...updates }
  saveData(data)
  return data.members[index]
}

export function deleteMember(id: string): boolean {
  const data = getData()
  const index = data.members.findIndex(m => m.id === id)
  if (index === -1) return false
  data.members.splice(index, 1)
  saveData(data)
  return true
}

// Trips
export function getTrips(): Trip[] {
  return getData().trips
}

export function getTrip(id: string): Trip | undefined {
  return getData().trips.find(t => t.id === id)
}

export function getPastTrips(): Trip[] {
  return getData().trips.filter(t => t.isPast)
}

export function getUpcomingTrips(): Trip[] {
  return getData().trips.filter(t => !t.isPast)
}

export function addTrip(trip: Omit<Trip, 'id'>): Trip {
  const data = getData()
  const newTrip = { ...trip, id: crypto.randomUUID() }
  data.trips.push(newTrip)
  saveData(data)
  return newTrip
}

export function updateTrip(id: string, updates: Partial<Trip>): Trip | undefined {
  const data = getData()
  const index = data.trips.findIndex(t => t.id === id)
  if (index === -1) return undefined
  data.trips[index] = { ...data.trips[index], ...updates }
  saveData(data)
  return data.trips[index]
}

export function deleteTrip(id: string): boolean {
  const data = getData()
  const index = data.trips.findIndex(t => t.id === id)
  if (index === -1) return false
  data.trips.splice(index, 1)
  saveData(data)
  return true
}

// Polls
export function getPolls(): Poll[] {
  return getData().polls
}

export function getPoll(id: string): Poll | undefined {
  return getData().polls.find(p => p.id === id)
}

export function getActivePolls(): Poll[] {
  return getData().polls.filter(p => p.isActive)
}

export function addPoll(poll: Omit<Poll, 'id' | 'createdAt'>): Poll {
  const data = getData()
  const newPoll = { ...poll, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  data.polls.push(newPoll)
  saveData(data)
  return newPoll
}

export function votePoll(pollId: string, optionId: string, memberId: string): Poll | undefined {
  const data = getData()
  const poll = data.polls.find(p => p.id === pollId)
  if (!poll) return undefined
  
  // Remove previous vote if any
  poll.options.forEach(opt => {
    opt.votes = opt.votes.filter(v => v !== memberId)
  })
  
  // Add new vote
  const option = poll.options.find(o => o.id === optionId)
  if (option) {
    option.votes.push(memberId)
  }
  
  saveData(data)
  return poll
}

export function closePoll(id: string): Poll | undefined {
  const data = getData()
  const poll = data.polls.find(p => p.id === id)
  if (!poll) return undefined
  poll.isActive = false
  saveData(data)
  return poll
}

// Celebrations
export function getCelebrations(): Celebration[] {
  return getData().celebrations
}

export function getCelebration(id: string): Celebration | undefined {
  return getData().celebrations.find(c => c.id === id)
}

export function addCelebration(celebration: Omit<Celebration, 'id'>): Celebration {
  const data = getData()
  const newCelebration = { ...celebration, id: crypto.randomUUID() }
  data.celebrations.push(newCelebration)
  saveData(data)
  return newCelebration
}

export function updateCelebration(id: string, updates: Partial<Celebration>): Celebration | undefined {
  const data = getData()
  const index = data.celebrations.findIndex(c => c.id === id)
  if (index === -1) return undefined
  data.celebrations[index] = { ...data.celebrations[index], ...updates }
  saveData(data)
  return data.celebrations[index]
}

// Wall Posts
export function getPosts(): WallPost[] {
  return getData().posts.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function addPost(post: Omit<WallPost, 'id' | 'createdAt' | 'likes'>): WallPost {
  const data = getData()
  const newPost = { 
    ...post, 
    id: crypto.randomUUID(), 
    createdAt: new Date().toISOString(),
    likes: []
  }
  data.posts.push(newPost)
  saveData(data)
  return newPost
}

export function toggleLike(postId: string, memberId: string): WallPost | undefined {
  const data = getData()
  const post = data.posts.find(p => p.id === postId)
  if (!post) return undefined
  
  const likeIndex = post.likes.indexOf(memberId)
  if (likeIndex === -1) {
    post.likes.push(memberId)
  } else {
    post.likes.splice(likeIndex, 1)
  }
  
  saveData(data)
  return post
}

export function deletePost(id: string): boolean {
  const data = getData()
  const index = data.posts.findIndex(p => p.id === id)
  if (index === -1) return false
  data.posts.splice(index, 1)
  saveData(data)
  return true
}

// Memories
export function getMemories(): Memory[] {
  return getData().memories
}

export function getMemoriesByCategory(category: Memory['category']): Memory[] {
  return getData().memories.filter(m => m.category === category)
}

export function addMemory(memory: Omit<Memory, 'id' | 'uploadedAt'>): Memory {
  const data = getData()
  const newMemory = { 
    ...memory, 
    id: crypto.randomUUID(), 
    uploadedAt: new Date().toISOString() 
  }
  data.memories.push(newMemory)
  saveData(data)
  return newMemory
}

// Auth helpers
export function hashPassword(password: string): string {
  // Simple hash for demo - in production use bcrypt
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

export function verifyPassword(password: string): boolean {
  const settings = getSettings()
  if (settings.passwordHash === "1kaxhge") {
    updateSettings({ passwordHash: "-z4z28c" })
    settings.passwordHash = "-z4z28c"
  }
  return hashPassword(password) === settings.passwordHash
}

export function changePassword(newPassword: string): void {
  updateSettings({ passwordHash: hashPassword(newPassword) })
}

// Session management
const SESSION_KEY = 'team-voyage-session'

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(SESSION_KEY) === 'authenticated'
}

export function login(password: string): boolean {
  if (verifyPassword(password)) {
    sessionStorage.setItem(SESSION_KEY, 'authenticated')
    return true
  }
  return false
}

export function logout(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(SESSION_KEY)
}

// Export/Import for backup
export function exportData(): string {
  return JSON.stringify(getData(), null, 2)
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as AppData
    saveData(data)
    return true
  } catch {
    return false
  }
}

// Reset to sample data
export function resetData(): void {
  saveData(sampleData)
}
