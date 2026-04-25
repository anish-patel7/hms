"use client"

import type { AppData, Member, Trip, Poll, Celebration, WallPost, Memory, DBUser, Album } from './types'
import { sampleData } from './sample-data'
import { supabase } from './supabase'

const STORAGE_KEY = 'team-voyage-data'
const CURRENT_VERSION = 3

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
  if (data.version === 1 && CURRENT_VERSION === 2) {
    // Erase all sample arrays to start fresh as requested
    return { 
      ...data, 
      members: [], 
      trips: [], 
      polls: [], 
      celebrations: [], 
      posts: [], 
      memories: [],
      albums: [],
      version: CURRENT_VERSION 
    }
  }
  if (data.version < 3) {
    return {
      ...data,
      albums: data.albums || [],
      version: CURRENT_VERSION
    }
  }
  return { ...data, version: CURRENT_VERSION }
}

// Push data to Supabase cloud in background (non-blocking)
let _syncTimeout: ReturnType<typeof setTimeout> | null = null
function pushToCloud(data: AppData) {
  // Debounce: wait 1s after last save to avoid spamming
  if (_syncTimeout) clearTimeout(_syncTimeout)
  _syncTimeout = setTimeout(async () => {
    try {
      const { error } = await supabase
        .from('shared_data')
        .upsert({ id: 'app_state', data: data, updated_at: new Date().toISOString() })
      if (error) console.warn('Cloud sync failed:', error.message)
    } catch (e) {
      console.warn('Cloud sync error:', e)
    }
  }, 1000)
}

// Pull shared data from Supabase cloud (called on app start)
export async function pullSharedData(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('shared_data')
      .select('data, updated_at')
      .eq('id', 'app_state')
      .single()
    
    const localData = getData()
    const localContentCount = (localData.trips?.length || 0) + (localData.polls?.length || 0) + 
      (localData.posts?.length || 0) + (localData.albums?.length || 0) + 
      (localData.memories?.length || 0) + (localData.celebrations?.length || 0)
    
    // If cloud has no data or error, push local data TO the cloud (admin seeding)
    if (error || !data?.data) {
      if (localContentCount > 0) {
        // Seed the cloud with local data
        await supabase.from('shared_data').upsert({ 
          id: 'app_state', 
          data: localData, 
          updated_at: new Date().toISOString() 
        })
      }
      return false
    }
    
    const cloudData = data.data as AppData
    if (!cloudData.version) return false
    
    const cloudContentCount = (cloudData.trips?.length || 0) + (cloudData.polls?.length || 0) + 
      (cloudData.posts?.length || 0) + (cloudData.albums?.length || 0) + 
      (cloudData.memories?.length || 0) + (cloudData.celebrations?.length || 0)
    
    // If local has MORE content than cloud, push local TO cloud (admin is the source of truth)
    if (localContentCount > cloudContentCount) {
      await supabase.from('shared_data').upsert({ 
        id: 'app_state', 
        data: localData, 
        updated_at: new Date().toISOString() 
      })
      return false // No need to pull, local already has the best data
    }
    
    // Cloud has more or equal content — pull it down
    if (cloudContentCount > 0) {
      const merged: AppData = {
        ...localData,
        trips: cloudData.trips || localData.trips || [],
        polls: cloudData.polls || localData.polls || [],
        posts: cloudData.posts || localData.posts || [],
        celebrations: cloudData.celebrations || localData.celebrations || [],
        memories: cloudData.memories || localData.memories || [],
        albums: cloudData.albums || localData.albums || [],
        version: CURRENT_VERSION
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      return true
    }
    
    return false
  } catch (e) {
    console.warn('Pull from cloud failed:', e)
    return false
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    // Also push to cloud for cross-browser sync
    pushToCloud(data)
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.message?.includes('quota')) {
      alert("System Warning: Browser memory limit (5MB) reached! You've uploaded too much. Please delete some old photographs, trips, or albums to free up space before continuing.")
    } else {
      console.error(e)
    }
  }
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

export function votePoll(pollId: string, optionIds: string[], memberId: string): Poll | undefined {
  const data = getData()
  const poll = data.polls.find(p => p.id === pollId)
  if (!poll) return undefined
  
  // Remove previous vote if any
  poll.options.forEach(opt => {
    opt.votes = opt.votes.filter(v => v !== memberId)
  })
  
  // Add new votes
  optionIds.forEach(optionId => {
    const option = poll.options.find(o => o.id === optionId)
    if (option) {
      option.votes.push(memberId)
    }
  })
  
  saveData(data)
  return poll
}

export function resetPoll(id: string): Poll | undefined {
  const data = getData()
  const poll = data.polls.find(p => p.id === id)
  if (!poll) return undefined
  poll.options.forEach(opt => {
    opt.votes = []
  })
  // Optionally reset voted state manually in consumer
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

export function deleteCelebration(id: string): boolean {
  const data = getData()
  const index = data.celebrations.findIndex(c => c.id === id)
  if (index === -1) return false
  data.celebrations.splice(index, 1)
  saveData(data)
  return true
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

// Albums
export function getAlbums(): Album[] {
  const data = getData()
  let albums = data.albums || []
  if (albums.length === 0) {
    const defaultAlbum: Album = {
      id: crypto.randomUUID(),
      name: 'Festivals',
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    }
    albums.push(defaultAlbum)
    data.albums = albums
    saveData(data)
  }
  return albums
}

export function getAlbum(id: string): Album | undefined {
  return (getData().albums || []).find(a => a.id === id)
}

export function addAlbum(album: Omit<Album, 'id' | 'createdAt'>): Album {
  const data = getData()
  const newAlbum = { 
    ...album, 
    id: crypto.randomUUID(), 
    createdAt: new Date().toISOString() 
  }
  if (!data.albums) data.albums = []
  data.albums.push(newAlbum)
  saveData(data)
  return newAlbum
}

export function deleteAlbum(id: string): boolean {
  const data = getData()
  if (!data.albums) return false
  const index = data.albums.findIndex(a => a.id === id)
  if (index === -1) return false
  data.albums.splice(index, 1)
  
  // optionally delete all memories inside this album
  data.memories = data.memories.filter(m => m.albumId !== id)
  
  saveData(data)
  return true
}

// Memories
export function getMemories(): Memory[] {
  return getData().memories || []
}

export function getMemoriesByAlbum(albumId: string): Memory[] {
  return (getData().memories || []).filter(m => m.albumId === albumId)
}

export function addMemory(memory: Omit<Memory, 'id' | 'uploadedAt'>): Memory {
  const data = getData()
  const newMemory = { 
    ...memory, 
    id: crypto.randomUUID(), 
    uploadedAt: new Date().toISOString() 
  }
  if (!data.memories) data.memories = []
  data.memories.push(newMemory)
  saveData(data)
  return newMemory
}

export function updateMemory(id: string, updates: Partial<Memory>): Memory | undefined {
  const data = getData()
  if (!data.memories) return undefined
  const index = data.memories.findIndex(m => m.id === id)
  if (index === -1) return undefined
  data.memories[index] = { ...data.memories[index], ...updates }
  saveData(data)
  return data.memories[index]
}

export function deleteMemory(id: string): boolean {
  const data = getData()
  if (!data.memories) return false
  const index = data.memories.findIndex(m => m.id === id)
  if (index === -1) return false
  data.memories.splice(index, 1)
  saveData(data)
  return true
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

export type LoginResult = 
  | { success: true; role: 'admin' | 'user'; userId: string | null }
  | { success: false; message: string; pinRequired?: boolean; candidates?: { id: string; role: 'admin' | 'user'; name: string, pin?: string | null }[] }

export async function verifyPassword(password: string): Promise<LoginResult> {
  const settings = getSettings() as any
  
  // Migration for legacy passwordHash
  if (settings.passwordHash) {
    if (settings.passwordHash === "1kaxhge") {
      settings.passwordHash = "-z4z28c"
    }
    settings.adminPasswordHash = settings.passwordHash
    settings.userPasswordHash = "fl07nc" // Default user password "teamketan@2026"
    settings.adminPinHash = "1060"
    delete settings.passwordHash
    updateSettings(settings)
  }

  // Force update any existing "0000" Admin PINs back to "1060" 
  if (settings.adminPinHash === "0000") {
    settings.adminPinHash = "1060"
    updateSettings({ adminPinHash: "1060" } as any)
  }

  const appSettings = getSettings() as any
  const hash = hashPassword(password)
  const matches: { id: string; role: 'admin' | 'user'; name: string, pin?: string | null, status?: string }[] = []
  
  if (hash === appSettings.adminPasswordHash) {
    matches.push({ id: 'admin', role: 'admin', name: 'Administrator', pin: appSettings.adminPinHash || '1060' })
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('password', hash)
    
    if (error) {
      return { success: false, message: error.message }
    }

    if (data && data.length > 0) {
      data.forEach(user => {
        matches.push({ id: user.id, role: 'user', name: user.name, pin: user.pin, status: user.status })
      })
    }
  } catch (err) {
    return { success: false, message: 'Could not connect to database.' }
  }
  
  if (matches.length === 0) {
    return { success: false, message: 'Oops! That password is not quite right. Try again!' }
  }

  const validMatches = matches.filter(m => m.role === 'admin' || m.status === 'approved')

  if (validMatches.length === 0) {
    const pending = matches.find(m => m.status === 'pending')
    if (pending) return { success: false, message: 'Waiting for admin approval.' }
    return { success: false, message: 'Your account has been rejected.' }
  }

  if (validMatches.length === 1) {
    return { success: true, role: validMatches[0].role, userId: validMatches[0].id }
  }

  return { success: false, message: 'Multiple matches found.', pinRequired: true, candidates: validMatches.map(v => ({ id: v.id, role: v.role, name: v.name, pin: v.pin })) }
}

export function changePassword(newPassword: string, role: 'admin' | 'user' = 'admin', newPin?: string): void {
  if (role === 'admin') {
    const update: any = { adminPasswordHash: hashPassword(newPassword) }
    if (newPin) update.adminPinHash = newPin
    updateSettings(update)
  } else {
    updateSettings({ userPasswordHash: hashPassword(newPassword) } as any)
  }
}

// Session management
const SESSION_KEY = 'team-voyage-session'
const ROLE_KEY = 'team-voyage-role'
const USER_ID_KEY = 'team-voyage-user-id'

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(SESSION_KEY) === 'authenticated'
}

export function getRole(): 'admin' | 'user' | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(ROLE_KEY) as 'admin' | 'user' | null
}

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(USER_ID_KEY)
}

export async function login(password: string, pin?: string): Promise<LoginResult> {
  const result = await verifyPassword(password)
  
  if (result.success) {
    sessionStorage.setItem(SESSION_KEY, 'authenticated')
    sessionStorage.setItem(ROLE_KEY, result.role)
    if (result.userId) sessionStorage.setItem(USER_ID_KEY, result.userId)
    return result
  }

  if (result.pinRequired && pin && result.candidates) {
    const matchedCandidate = result.candidates.find(c => c.pin === pin)
    if (matchedCandidate) {
      sessionStorage.setItem(SESSION_KEY, 'authenticated')
      sessionStorage.setItem(ROLE_KEY, matchedCandidate.role)
      sessionStorage.setItem(USER_ID_KEY, matchedCandidate.id)
      return { success: true, role: matchedCandidate.role, userId: matchedCandidate.id }
    } else {
      return { ...result, message: 'Incorrect PIN.' }
    }
  }

  return result
}

export function logout(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(ROLE_KEY)
  sessionStorage.removeItem(USER_ID_KEY)
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

// Sync from Supabase
export async function syncUsersFromSupabase() {
  const { data, error } = await supabase.from('users').select('*')
  if (!error && data) {
    const mapped = (data as DBUser[]).map(user => ({
      id: user.id,
      name: user.name,
      avatar: user.profile_photo || undefined,
      birthday: user.dob,
      anniversary: user.marriage_date || undefined,
      area: user.area,
      joinDate: user.created_at,
      status: user.status
    }))
    const appData = getData()
    appData.members = mapped as Member[]
    saveData(appData)
    return mapped
  }
  return null
}

// Image Cloud Storage Bypass Helpers
export async function uploadImageToCloud(base64: string): Promise<string> {
  const imageId = `supabase-img-${crypto.randomUUID()}`
  const { error } = await supabase
    .from('shared_data')
    .upsert({ 
      id: imageId, 
      data: { base64 }, 
      updated_at: new Date().toISOString() 
    })
    
  if (error) {
    console.error('Failed to upload image to cloud:', error)
    throw new Error('Failed to upload image to cloud storage.')
  }
  
  return imageId
}

export async function fetchImageFromCloud(imageId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('shared_data')
      .select('data')
      .eq('id', imageId)
      .single()
      
    if (error || !data || !data.data) {
      return null
    }
    
    return (data.data as any).base64 || null
  } catch (err) {
    console.error('Failed to fetch image from cloud:', err)
    return null
  }
}
