const fs = require('fs');
const https = require('https');

const html = fs.readFileSync('drive_folder.html', 'utf8');

// Find all 33-character strings starting with '1'
const matches = html.match(/1[a-zA-Z0-9_-]{32}/g);
const uniqueIds = Array.from(new Set(matches));

console.log(`Found ${uniqueIds.length} candidate IDs starting with 1.`);

// Test which ones are actually images
async function testIds() {
  const validIds = [];
  
  for (const id of uniqueIds) {
    await new Promise(resolve => {
      https.get(`https://drive.google.com/thumbnail?id=${id}&sz=w100`, (res) => {
        // usually 200 for valid thumbnail, 404/403 for invalid/auth required
        if (res.statusCode === 200) {
          validIds.push(id);
        }
        res.resume(); // consume response data to free up memory
        resolve();
      }).on('error', () => resolve());
    });
  }
  
  console.log(`Found ${validIds.length} valid image IDs!`);
  fs.writeFileSync('valid_ids.json', JSON.stringify(validIds));
}

testIds();
