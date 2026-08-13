const STORAGE_PREFIX = 'kryogames-favorites'

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

export function loadFavorites(userId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

export function saveFavorites(userId: string, ids: string[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(ids))
  } catch {
    // Quota / private mode — ignore; UI state still works for the session.
  }
}

export function toggleFavoriteId(ids: string[], gameId: string): string[] {
  return ids.includes(gameId)
    ? ids.filter((id) => id !== gameId)
    : [...ids, gameId]
}
