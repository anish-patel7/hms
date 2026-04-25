const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDir = fs.statSync(dirPath).isDirectory();
    if (isDir) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

function removeCrossOrigin() {
  const dirs = ['app', 'components'];
  let count = 0;
  
  dirs.forEach(dir => {
    walkDir(path.join(__dirname, '..', dir), (filePath) => {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('crossOrigin="anonymous"')) {
          content = content.replace(/crossOrigin="anonymous"/g, '');
          fs.writeFileSync(filePath, content, 'utf8');
          console.log('Removed from:', filePath);
          count++;
        }
      }
    });
  });
  console.log(`Cleaned ${count} files.`);
}

removeCrossOrigin();
