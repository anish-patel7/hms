export interface DBUser {
  id: string
  name: string
  dob: string
  area: string
  marriage_date?: string | null
  profile_photo?: string | null
  password?: string
  pin?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Member {
  id: string
  name: string
  avatar?: string
  birthday: string
  anniversary?: string
  area?: string
  bio?: string
  favoriteMemory?: string
  joinDate: string
  status?: 'pending' | 'approved' | 'rejected'
}

export interface Trip {
  id: string
  title: string
  location: string
  startDate: string
  endDate: string
  description: string
  coverPhoto: string
  bestMoment?: string
  photos: string[]
  isPast: boolean
  rsvp: { memberId: string; status: 'yes' | 'maybe' | 'no' }[]
  checklist?: { item: string; done: boolean }[]
}

export interface Poll {
  id: string
  question: string
  options: { id: string; text: string; votes: string[] }[]
  createdBy: string
  createdAt: string
  endsAt?: string
  isActive: boolean
  allowMultipleVotes?: boolean
}

export interface Celebration {
  id: string
  title: string
  date: string
  photos: string[]
  captions: string[]
  category: 'diwali' | 'holi' | 'christmas' | 'newyear' | 'other'
}

export interface WallPost {
  id: string
  authorId: string
  content: string
  createdAt: string
  likes: string[]
}

export interface Album {
  id: string
  name: string
  coverPhoto?: string
  createdAt: string
  createdBy: string
}

export interface Memory {
  id: string
  url: string
  caption?: string
  albumId?: string
  uploadedBy: string
  uploadedAt: string
  tripId?: string
  celebrationId?: string
}

export interface AppSettings {
  groupName: string
  adminPasswordHash: string
  userPasswordHash: string
}

export interface AppData {
  settings: AppSettings
  members: Member[]
  trips: Trip[]
  polls: Poll[]
  celebrations: Celebration[]
  posts: WallPost[]
  memories: Memory[]
  albums: Album[]
  version: number
}
