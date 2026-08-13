import { isSupabaseConfigured, supabase } from './supabase'

const STORAGE_PREFIX = 'kryogames-played'
const MIGRATED_PREFIX = 'kryogames-played-migrated'

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`
}

function migratedKey(userId: string) {
  return `${MIGRATED_PREFIX}:${userId}`
}

function readLocalPlayedGames(userId: string): string[] {
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

function markMigrated(userId: string) {
  try {
    localStorage.setItem(migratedKey(userId), '1')
  } catch {
    // ignore
  }
}

function wasMigrated(userId: string) {
  try {
    return localStorage.getItem(migratedKey(userId)) === '1'
  } catch {
    return false
  }
}

/** One-time: push any legacy localStorage ids into Supabase. */
export async function migratePlayedGamesFromLocal(
  userId: string,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || wasMigrated(userId)) {
    return { error: null }
  }

  const localIds = readLocalPlayedGames(userId)
  if (localIds.length === 0) {
    markMigrated(userId)
    return { error: null }
  }

  const rows = localIds.map((game_id) => ({ user_id: userId, game_id }))
  const { error } = await supabase.from('played_games').upsert(rows, {
    onConflict: 'user_id,game_id',
    ignoreDuplicates: true,
  })

  if (error) return { error: error.message }
  markMigrated(userId)
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    // ignore
  }
  return { error: null }
}

/** Distinct game IDs this user has launched at least once. */
export async function loadPlayedGames(
  userId: string,
): Promise<{ ids: string[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { ids: readLocalPlayedGames(userId), error: null }
  }

  await migratePlayedGamesFromLocal(userId)

  const { data, error } = await supabase
    .from('played_games')
    .select('game_id')
    .eq('user_id', userId)
    .order('first_played_at', { ascending: true })

  if (error) {
    return { ids: [], error: error.message }
  }

  return {
    ids: (data ?? [])
      .map((row) => row.game_id)
      .filter((id): id is string => typeof id === 'string'),
    error: null,
  }
}

export async function countPlayedGames(
  userId: string,
): Promise<{ count: number; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { count: readLocalPlayedGames(userId).length, error: null }
  }

  await migratePlayedGamesFromLocal(userId)

  const { count, error } = await supabase
    .from('played_games')
    .select('game_id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    return { count: 0, error: error.message }
  }

  return { count: count ?? 0, error: null }
}

/** Record a play; idempotent per user + game. */
export async function recordPlayedGame(
  userId: string,
  gameId: string,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    const current = readLocalPlayedGames(userId)
    if (!current.includes(gameId)) {
      try {
        localStorage.setItem(
          storageKey(userId),
          JSON.stringify([...current, gameId]),
        )
      } catch {
        // ignore
      }
    }
    return { error: null }
  }

  const { error } = await supabase.from('played_games').upsert(
    { user_id: userId, game_id: gameId },
    { onConflict: 'user_id,game_id', ignoreDuplicates: true },
  )

  if (error) return { error: error.message }
  return { error: null }
}
