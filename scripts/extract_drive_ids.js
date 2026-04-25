const fs = require('fs');
const html = fs.readFileSync('drive_folder.html', 'utf8');

// Google Drive typical file array structure: ["1_Y...", "IMG_...", ...]
// Let's find arrays where the first element is a 33-char string, and the second element is a filename
const matchedImages = html.match(/\[\"([a-zA-Z0-9_-]{33})\"\,\"([^\"]+\.(?:jpg|JPG|jpeg|JPEG|png|PNG|mp4|MP4))\"/g);
if (matchedImages) {
  console.log('Found structured files:', matchedImages.length);
  console.log(matchedImages.slice(0, 5));
  
  // Extract just the IDs
  const ids = matchedImages.map(m => m.match(/\"([a-zA-Z0-9_-]{33})\"/)[1]);
  fs.writeFileSync('valid_ids.json', JSON.stringify(Array.from(new Set(ids))));
  console.log('Unique valid file IDs:', new Set(ids).size);
} else {
  console.log('No structured files found with that regex.');
}
