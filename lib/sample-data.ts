import type { AppData } from './types'

export const sampleData: AppData = {
  version: 1,
  settings: {
    groupName: "Team HMS",
    passwordHash: "-z4z28c" // Default password: "hms@2026"
  },
  members: [
    {
      id: "m1",
      name: "Priya Sharma",
      birthday: "1992-03-15",
      bio: "Coffee addict and trip planner extraordinaire",
      favoriteMemory: "That sunrise hike in Manali",
      joinDate: "2020-01-15"
    },
    {
      id: "m2", 
      name: "Arjun Patel",
      birthday: "1990-08-22",
      bio: "The unofficial group photographer",
      favoriteMemory: "Beach bonfire in Goa",
      joinDate: "2020-01-15"
    },
    {
      id: "m3",
      name: "Sneha Reddy",
      birthday: "1993-12-05",
      bio: "Always ready for an adventure",
      favoriteMemory: "Getting lost in Pondicherry streets",
      joinDate: "2020-02-20"
    },
    {
      id: "m4",
      name: "Rahul Verma",
      birthday: "1991-06-28",
      anniversary: "2023-04-15",
      bio: "The foodie who knows all the best spots",
      favoriteMemory: "Late night chai sessions",
      joinDate: "2020-01-15"
    },
    {
      id: "m5",
      name: "Ananya Gupta",
      birthday: "1994-11-10",
      bio: "Brings the playlist, brings the vibes",
      favoriteMemory: "Road trip karaoke sessions",
      joinDate: "2020-03-01"
    },
    {
      id: "m6",
      name: "Vikram Singh",
      birthday: "1989-02-14",
      bio: "Master of dad jokes and logistics",
      favoriteMemory: "Surviving that crazy trek",
      joinDate: "2020-01-15"
    },
    {
      id: "m7",
      name: "Meera Krishnan",
      birthday: "1992-07-30",
      bio: "The calm in every storm",
      favoriteMemory: "Sunrise yoga at the beach",
      joinDate: "2020-04-10"
    },
    {
      id: "m8",
      name: "Karan Mehta",
      birthday: "1993-09-18",
      bio: "Sports enthusiast and team motivator",
      favoriteMemory: "Beach volleyball championship",
      joinDate: "2020-05-20"
    }
  ],
  trips: [
    {
      id: "t1",
      title: "Goa Beach Getaway",
      location: "Goa, India",
      startDate: "2024-12-20",
      endDate: "2024-12-24",
      description: "Our annual beach escape! Four days of sun, sand, and unforgettable memories. From beach hopping to late-night bonfires, this trip had it all.",
      coverPhoto: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop",
      bestMoment: "The surprise birthday celebration for Priya at sunset",
      photos: [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&h=600&fit=crop"
      ],
      isPast: true,
      rsvp: [
        { memberId: "m1", status: "yes" },
        { memberId: "m2", status: "yes" },
        { memberId: "m3", status: "yes" },
        { memberId: "m4", status: "yes" },
        { memberId: "m5", status: "yes" }
      ],
      checklist: []
    },
    {
      id: "t2",
      title: "Manali Mountain Adventure",
      location: "Manali, Himachal Pradesh",
      startDate: "2024-06-10",
      endDate: "2024-06-15",
      description: "Escaped the summer heat to the mountains. Trekking, camping under stars, and that incredible sunrise at Rohtang Pass.",
      coverPhoto: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&h=600&fit=crop",
      bestMoment: "Watching the sunrise at Rohtang Pass after a 4am start",
      photos: [
        "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop"
      ],
      isPast: true,
      rsvp: [
        { memberId: "m1", status: "yes" },
        { memberId: "m2", status: "yes" },
        { memberId: "m6", status: "yes" },
        { memberId: "m7", status: "yes" }
      ],
      checklist: []
    },
    {
      id: "t3",
      title: "Pondicherry Heritage Walk",
      location: "Pondicherry, India",
      startDate: "2024-02-14",
      endDate: "2024-02-17",
      description: "A Valentine's weekend exploring French colonial architecture, seaside promenades, and the best croissants outside Paris.",
      coverPhoto: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&h=600&fit=crop",
      bestMoment: "Getting lost in the colorful streets of the French Quarter",
      photos: [
        "https://images.unsplash.com/photo-1600850056064-a8b380df8395?w=800&h=600&fit=crop"
      ],
      isPast: true,
      rsvp: [
        { memberId: "m3", status: "yes" },
        { memberId: "m4", status: "yes" },
        { memberId: "m5", status: "yes" }
      ],
      checklist: []
    },
    {
      id: "t4",
      title: "Kerala Backwaters Cruise",
      location: "Alleppey, Kerala",
      startDate: "2025-05-15",
      endDate: "2025-05-19",
      description: "Upcoming houseboat adventure through the serene backwaters. Get ready for fresh seafood, scenic views, and total relaxation!",
      coverPhoto: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&h=600&fit=crop",
      bestMoment: "",
      photos: [],
      isPast: false,
      rsvp: [
        { memberId: "m1", status: "yes" },
        { memberId: "m2", status: "yes" },
        { memberId: "m3", status: "maybe" },
        { memberId: "m4", status: "yes" },
        { memberId: "m5", status: "yes" },
        { memberId: "m6", status: "maybe" },
        { memberId: "m7", status: "no" }
      ],
      checklist: [
        { item: "Book houseboat", done: true },
        { item: "Flight tickets", done: false },
        { item: "Pack sunscreen", done: false },
        { item: "Create shared playlist", done: true }
      ]
    }
  ],
  polls: [
    {
      id: "p1",
      question: "Where should our next team outing be?",
      options: [
        { id: "o1", text: "Jaipur - Royal Palaces", votes: ["m1", "m3", "m5"] },
        { id: "o2", text: "Coorg - Coffee Estate", votes: ["m2", "m4", "m6", "m7"] },
        { id: "o3", text: "Udaipur - Lake City", votes: ["m8"] }
      ],
      createdBy: "m1",
      createdAt: "2025-03-01T10:00:00Z",
      isActive: true
    },
    {
      id: "p2",
      question: "Best time for the Kerala trip?",
      options: [
        { id: "o4", text: "May 15-19 (Long weekend)", votes: ["m1", "m2", "m3", "m4", "m5"] },
        { id: "o5", text: "June 5-9", votes: ["m6", "m7"] },
        { id: "o6", text: "July 10-14", votes: [] }
      ],
      createdBy: "m2",
      createdAt: "2025-02-15T14:30:00Z",
      isActive: false
    },
    {
      id: "p3",
      question: "Theme for the next office party?",
      options: [
        { id: "o7", text: "Retro 80s", votes: ["m1", "m5", "m8"] },
        { id: "o8", text: "Bollywood Night", votes: ["m2", "m3", "m4"] },
        { id: "o9", text: "Casino Royale", votes: ["m6", "m7"] }
      ],
      createdBy: "m5",
      createdAt: "2025-03-20T09:00:00Z",
      isActive: true
    }
  ],
  celebrations: [
    {
      id: "c1",
      title: "Diwali 2024",
      date: "2024-11-01",
      photos: [
        "https://images.unsplash.com/photo-1574265933498-e69e46a4e7b7?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&h=600&fit=crop"
      ],
      captions: ["Office diya decoration", "Team rangoli competition"],
      category: "diwali"
    },
    {
      id: "c2",
      title: "Christmas Party 2024",
      date: "2024-12-25",
      photos: [
        "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=800&h=600&fit=crop"
      ],
      captions: ["Secret Santa exchange"],
      category: "christmas"
    },
    {
      id: "c3",
      title: "Holi Bash 2024",
      date: "2024-03-25",
      photos: [
        "https://images.unsplash.com/photo-1520262494112-9fe481d36ec3?w=800&h=600&fit=crop"
      ],
      captions: ["Colors everywhere!"],
      category: "holi"
    }
  ],
  posts: [
    {
      id: "w1",
      authorId: "m1",
      content: "Can't wait for the Kerala trip! Who else is excited? The backwaters are going to be amazing!",
      createdAt: "2025-03-28T10:30:00Z",
      likes: ["m2", "m3", "m4", "m5"]
    },
    {
      id: "w2",
      authorId: "m2",
      content: "Just uploaded all the Goa photos to the gallery. So many good memories from that trip!",
      createdAt: "2025-03-25T15:45:00Z",
      likes: ["m1", "m3", "m5", "m6"]
    },
    {
      id: "w3",
      authorId: "m5",
      content: "Reminder: Please vote on the office party theme poll! Need to finalize by this Friday.",
      createdAt: "2025-03-22T09:15:00Z",
      likes: ["m1", "m2"]
    },
    {
      id: "w4",
      authorId: "m4",
      content: "Found this amazing seafood place near the office. Team lunch this week?",
      createdAt: "2025-03-20T12:00:00Z",
      likes: ["m1", "m2", "m3", "m5", "m6", "m7", "m8"]
    }
  ],
  memories: [
    {
      id: "mem1",
      url: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&h=600&fit=crop",
      caption: "Sunset at Goa beach",
      category: "trips",
      uploadedBy: "m2",
      uploadedAt: "2024-12-24T18:00:00Z",
      tripId: "t1"
    },
    {
      id: "mem2",
      url: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&h=600&fit=crop",
      caption: "Mountain views in Manali",
      category: "trips",
      uploadedBy: "m1",
      uploadedAt: "2024-06-15T10:00:00Z",
      tripId: "t2"
    },
    {
      id: "mem3",
      url: "https://images.unsplash.com/photo-1574265933498-e69e46a4e7b7?w=800&h=600&fit=crop",
      caption: "Diwali celebration at office",
      category: "festivals",
      uploadedBy: "m3",
      uploadedAt: "2024-11-01T20:00:00Z",
      celebrationId: "c1"
    },
    {
      id: "mem4",
      url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=600&fit=crop",
      caption: "Team meeting gone fun",
      category: "office",
      uploadedBy: "m5",
      uploadedAt: "2024-09-15T14:30:00Z"
    }
  ]
}
