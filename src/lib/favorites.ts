import { isSupabaseConfigured, supabase } from './supabase'

const STORAGE_PREFIX = 'kryogames-favorites'

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

function parseIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const unique = new Set<string>()
  for (const id of raw) {
    if (typeof id === 'string' && id.length > 0) unique.add(id)
  }
  return [...unique]
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((id) => set.has(id))
}

export function loadFavorites(userId: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    return parseIds(JSON.parse(raw) as unknown)
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

function idsFromMetadata(meta: Record<string, unknown> | undefined): string[] {
  return parseIds(meta?.favorite_ids)
}

/** Merge this device’s list with the account copy so phone and desktop stay in sync. */
export async function hydrateFavorites(
  userId: string,
  metadata?: Record<string, unknown>,
): Promise<string[]> {
  const local = loadFavorites(userId)
  let remote = idsFromMetadata(metadata)

  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getUser()
    if (data.user?.id === userId) {
      remote = idsFromMetadata(data.user.user_metadata)
    }
  }

  const merged = parseIds([...remote, ...local])
  saveFavorites(userId, merged)

  if (isSupabaseConfigured && !sameIds(merged, remote)) {
    await supabase.auth.updateUser({ data: { favorite_ids: merged } })
  }

  return merged
}

export async function persistFavorites(userId: string, ids: string[]) {
  const next = parseIds(ids)
  saveFavorites(userId, next)
  if (!isSupabaseConfigured) return
  await supabase.auth.updateUser({ data: { favorite_ids: next } })
}
