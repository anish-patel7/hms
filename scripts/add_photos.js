const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Simple dotenv parse
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function fetchDriveIds(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = data.match(/([a-zA-Z0-9_-]{33})/g);
        if (matches) {
          const uniqueIds = Array.from(new Set(matches)).filter(id => id.startsWith('1') || id.length === 33);
          resolve(uniqueIds);
        } else {
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

const generateId = () => Math.random().toString(36).substring(2, 10);

async function addPhotos() {
  console.log('Fetching app_state from Supabase...');
  const { data: dbData, error } = await supabase.from('shared_data').select('data').eq('id', 'app_state').single();
  if (error || !dbData) {
    console.error('Failed to get app_state', error);
    return;
  }

  const appData = dbData.data;
  
  const album = appData.albums.find(a => a.name === 'Palm Greens Club & Resort - 2023');
  if (!album) {
    console.error('Album not found!');
    return;
  }

  console.log(`Found album ${album.name} (ID: ${album.id}). Fetching drive folder...`);
  
  const driveUrl = 'https://drive.google.com/drive/folders/1E6zkLGWfI-r4yiV6-F3UmyByrr1Pe8GF';
  const ids = await fetchDriveIds(driveUrl);
  
  if (!ids.length) {
    console.log('No photos found in drive folder.');
    return;
  }
  
  console.log(`Extracted ${ids.length} photo IDs. Injecting into memories...`);
  
  const newMemories = ids.map(id => ({
    id: generateId(),
    url: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
    albumId: album.id,
    uploadedBy: 'admin',
    createdAt: new Date().toISOString()
  }));

  // Append if doesn't exist
  const existingUrls = new Set(appData.memories.map(m => m.url));
  const filteredMemories = newMemories.filter(m => !existingUrls.has(m.url));

  appData.memories = [...appData.memories, ...filteredMemories];

  console.log(`Adding ${filteredMemories.length} new photos. Uploading updated app_state back to Supabase...`);
  const { error: updateError } = await supabase.from('shared_data').update({ data: appData, updated_at: new Date().toISOString() }).eq('id', 'app_state');
  
  if (updateError) {
    console.error('Failed to update app_state:', updateError);
  } else {
    console.log('Successfully added photos!');
  }
}

addPhotos();
