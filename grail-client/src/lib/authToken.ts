const STORAGE_KEY = 'grail-auth-token'

let inMemoryToken: string | null = null

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getAuthToken(): string | null {
  if (inMemoryToken) {
    return inMemoryToken
  }

  if (!canUseStorage()) {
    return null
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored) {
    inMemoryToken = stored
    return stored
  }

  return null
}

export function setAuthToken(token: string | null) {
  inMemoryToken = token

  if (!canUseStorage()) {
    return
  }

  if (token) {
    window.localStorage.setItem(STORAGE_KEY, token)
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function clearAuthToken() {
  setAuthToken(null)
}
