import type { AppData } from './types'

export const sampleData: AppData = {
  version: 2,
  settings: {
    groupName: "Team HMS",
    adminPasswordHash: "-z4z28c", // Default admin password: "hms@2026"
    userPasswordHash: "fl07nc" // Default user password: "teamketan@2026"
  },
  members: [],
  trips: [],
  polls: [],
  celebrations: [],
  posts: [],
  memories: []
}
