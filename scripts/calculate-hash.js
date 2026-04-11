// Calculate password hash for "hms@2026"
function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

const password = "hms@2026"
const hash = hashPassword(password)
console.log(`Password: ${password}`)
console.log(`Hash: ${hash}`)
