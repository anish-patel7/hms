import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { url } = await req.json()
    
    if (!url || !url.includes('drive.google.com/drive/folders/')) {
      return NextResponse.json({ error: 'Invalid Google Drive folder URL' }, { status: 400 })
    }

    const response = await fetch(url)
    const html = await response.text()

    // Google Drive folder HTML contains script tags with data containing file IDs
    // File IDs are exactly 33 characters long with alphanumeric, dashes, underscores
    const matches = html.match(/([a-zA-Z0-9_-]{33})/g)
    
    if (!matches) {
      return NextResponse.json({ ids: [] })
    }

    // Filter unique IDs and exclude known non-file IDs (like typical script hashes or Google IDs that are standard)
    // Most file IDs start with 1, but we can just return all unique 33-char alphanumeric strings and let the client convert them
    // Actually, we'll exclude things that look like standard hashes if needed, but uniqueness usually takes care of redundancies.
    const uniqueIds = Array.from(new Set(matches)).filter(id => id.startsWith('1') || id.length === 33)

    return NextResponse.json({ ids: uniqueIds })
  } catch (error) {
    console.error('Error fetching drive folder:', error)
    return NextResponse.json({ error: 'Failed to fetch folder data' }, { status: 500 })
  }
}
