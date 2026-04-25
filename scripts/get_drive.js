const https = require('https');
https.get('https://drive.google.com/drive/folders/1E6zkLGWfI-r4yiV6-F3UmyByrr1Pe8GF', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // Basic regex to find the typical 33-character Google Drive file IDs
    const matches = data.match(/([a-zA-Z0-9_-]{33})/g);
    if(matches) {
       console.log(Array.from(new Set(matches)).join('\n'));
    } else {
       console.log('No matches');
    }
  });
});
