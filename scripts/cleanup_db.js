const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function cleanFakeMemories() {
  const { data } = await supabase.from('shared_data').select('data').eq('id', 'app_state').single();
  const appData = data.data;
  const album = appData.albums.find(a => a.name === 'Palm Greens Club & Resort - 2023');
  
  const beforeCount = appData.memories.length;
  // Remove all memories in that album that came from drive thumbnail
  appData.memories = appData.memories.filter(m => !(m.albumId === album.id && m.url.includes('drive.google.com/thumbnail')));
  
  const afterCount = appData.memories.length;
  console.log(`Cleaned ${beforeCount - afterCount} fake memories.`);
  
  await supabase.from('shared_data').update({ data: appData, updated_at: new Date().toISOString() }).eq('id', 'app_state');
  console.log('Database pristine.');
}

cleanFakeMemories();
