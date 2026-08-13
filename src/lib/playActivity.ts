import { isSupabaseConfigured, supabase } from './supabase'

const ACTIVITY_PREFIX = 'kryogames-play-activity'
const MIGRATED_PREFIX = 'kryogames-play-activity-migrated'
const SESSION_KEY = 'kryogames-play-session'
const MAX_SESSION_MS = 6 * 60 * 60 * 1000

export type DayMinutesMap = Record<string, number>

function activityKey(userId: string) {
  return `${ACTIVITY_PREFIX}:${userId}`
}

function migratedKey(userId: string) {
  return `${MIGRATED_PREFIX}:${userId}`
}

export function toDayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function readLocalDayMinutes(userId: string): DayMinutesMap {
  try {
    const raw = localStorage.getItem(activityKey(userId))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const out: DayMinutesMap = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        out[key] = value
      }
    }
    return out
  } catch {
    return {}
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

/** One-time: push legacy localStorage day minutes into Supabase. */
export async function migratePlayActivityFromLocal(
  userId: string,
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured || wasMigrated(userId)) {
    return { error: null }
  }

  const local = readLocalDayMinutes(userId)
  const entries = Object.entries(local)
  if (entries.length === 0) {
    markMigrated(userId)
    return { error: null }
  }

  const rows = entries.map(([day, minutes]) => ({
    user_id: userId,
    day,
    minutes,
    updated_at: new Date().toISOString(),
  }))

  // Prefer keeping the higher of local vs remote if a row already exists.
  const { data: existing, error: existingError } = await supabase
    .from('play_activity')
    .select('day, minutes')
    .eq('user_id', userId)
    .in(
      'day',
      entries.map(([day]) => day),
    )

  if (existingError) return { error: existingError.message }

  const remoteByDay = new Map(
    (existing ?? []).map((row) => [row.day as string, Number(row.minutes) || 0]),
  )

  const merged = rows.map((row) => ({
    ...row,
    minutes: Math.max(row.minutes, remoteByDay.get(row.day) ?? 0),
  }))

  const { error } = await supabase.from('play_activity').upsert(merged, {
    onConflict: 'user_id,day',
  })

  if (error) return { error: error.message }
  markMigrated(userId)
  try {
    localStorage.removeItem(activityKey(userId))
  } catch {
    // ignore
  }
  return { error: null }
}

export async function loadDayMinutes(
  userId: string,
): Promise<{ map: DayMinutesMap; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { map: readLocalDayMinutes(userId), error: null }
  }

  await migratePlayActivityFromLocal(userId)

  const { data, error } = await supabase
    .from('play_activity')
    .select('day, minutes')
    .eq('user_id', userId)

  if (error) {
    return { map: {}, error: error.message }
  }

  const map: DayMinutesMap = {}
  for (const row of data ?? []) {
    const day = typeof row.day === 'string' ? row.day : null
    const minutes = typeof row.minutes === 'number' ? row.minutes : Number(row.minutes)
    if (!day || !Number.isFinite(minutes) || minutes <= 0) continue
    map[day] = minutes
  }

  return { map, error: null }
}

export async function addPlayMinutes(
  userId: string,
  minutes: number,
  dayKey = toDayKey(),
): Promise<{ map: DayMinutesMap; error: string | null }> {
  if (minutes <= 0) {
    return loadDayMinutes(userId)
  }

  if (!isSupabaseConfigured) {
    const map = readLocalDayMinutes(userId)
    map[dayKey] = (map[dayKey] ?? 0) + minutes
    try {
      localStorage.setItem(activityKey(userId), JSON.stringify(map))
    } catch {
      // ignore
    }
    return { map, error: null }
  }

  const { error } = await supabase.rpc('add_play_minutes', {
    p_day: dayKey,
    p_minutes: minutes,
  })

  if (error) {
    return { map: {}, error: error.message }
  }

  return loadDayMinutes(userId)
}

export function hoursForDay(map: DayMinutesMap, dayKey: string): number {
  return (map[dayKey] ?? 0) / 60
}

/** 0 = none, 1 = >2h, 2 = >4h, 3 = >8h */
export function activityLevel(hours: number): 0 | 1 | 2 | 3 {
  if (hours >= 8) return 3
  if (hours >= 4) return 2
  if (hours >= 2) return 1
  if (hours > 0) return 1
  return 0
}

interface PlaySession {
  userId: string
  startedAt: number
}

function readSession(): PlaySession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const record = parsed as Record<string, unknown>
    if (typeof record.userId !== 'string' || typeof record.startedAt !== 'number') {
      return null
    }
    return { userId: record.userId, startedAt: record.startedAt }
  } catch {
    return null
  }
}

function writeSession(session: PlaySession | null) {
  try {
    if (!session) {
      sessionStorage.removeItem(SESSION_KEY)
      return
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // ignore
  }
}

/** Call when the user launches a game. */
export function startPlaySession(userId: string) {
  writeSession({ userId, startedAt: Date.now() })
}

/**
 * Flush an open play session into daily minutes (e.g. when returning to the tab).
 * Caps runaway timers. Session timer stays in sessionStorage.
 */
export async function flushPlaySession(
  userId?: string,
): Promise<{ map: DayMinutesMap | null; error: string | null }> {
  const session = readSession()
  if (!session) return { map: null, error: null }
  if (userId && session.userId !== userId) return { map: null, error: null }

  const elapsed = Math.min(Math.max(0, Date.now() - session.startedAt), MAX_SESSION_MS)
  writeSession(null)

  // Ignore tiny blips under 30s
  if (elapsed < 30_000) {
    const loaded = await loadDayMinutes(session.userId)
    return { map: loaded.map, error: loaded.error }
  }

  const minutes = elapsed / 60_000
  const result = await addPlayMinutes(session.userId, minutes)
  return { map: result.map, error: result.error }
}
