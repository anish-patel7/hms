const fs = require('fs');

function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

const pwd = "hms@2026";
const hash = hashPassword(pwd);
fs.writeFileSync('hash-output.txt', 'Hash: ' + hash);
