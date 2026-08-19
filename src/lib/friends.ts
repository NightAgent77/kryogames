import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './supabase'

export type FriendshipStatus = 'pending' | 'accepted' | 'declined'

export interface Profile {
  id: string
  username: string
  avatar: string | null
}

/** Prefer real username metadata — never email. */
function usernameFromMetadata(meta: Record<string, unknown>): string | null {
  for (const key of ['username', 'full_name', 'name'] as const) {
    const value = meta[key]
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed.length < 2 || trimmed.includes('@')) continue
    return trimmed.slice(0, 24)
  }
  return null
}

/** UI-safe label: strip accidental emails down to local-part, else username. */
export function profileLabel(username: string): string {
  const trimmed = username.trim()
  if (!trimmed) return 'Player'
  if (trimmed.includes('@')) return trimmed.split('@')[0] || 'Player'
  return trimmed
}

export interface FriendshipRow {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
}

export interface FriendEntry {
  friendshipId: string
  profile: Profile
}

export interface FriendRequestEntry {
  friendshipId: string
  profile: Profile
}

function asProfile(row: {
  id: string
  username: string
  avatar?: string | null
}): Profile {
  return {
    id: row.id,
    username: profileLabel(row.username),
    avatar: row.avatar ?? null,
  }
}

export async function upsertProfileFromUser(user: User): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not configured.' }
  }

  const meta = user.user_metadata ?? {}
  const username = usernameFromMetadata(meta)
  const avatar =
    typeof meta.avatar === 'string' && meta.avatar.length > 0 ? meta.avatar : null

  // Never invent a name from email — skip username write if metadata has none.
  if (!username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (existing) {
      if (avatar !== null) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        if (error) return { error: error.message }
      }
      return { error: null }
    }

    return { error: null }
  }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      username,
      avatar,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  if (error) {
    if (error.code === '23505') {
      return { error: 'That username is already taken.' }
    }
    return { error: error.message }
  }

  return { error: null }
}

export async function searchProfiles(
  query: string,
  excludeUserId: string,
): Promise<{ profiles: Profile[]; error: string | null }> {
  const q = query.trim()
  if (q.length < 1) {
    return { profiles: [], error: null }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar')
    .ilike('username', `%${q}%`)
    .neq('id', excludeUserId)
    .order('username', { ascending: true })
    .limit(20)

  if (error) {
    return { profiles: [], error: error.message }
  }

  return { profiles: (data ?? []).map(asProfile), error: null }
}

async function loadProfilesByIds(ids: string[]): Promise<Map<string, Profile>> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return new Map()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar')
    .in('id', unique)

  if (error || !data) return new Map()

  return new Map(data.map((row) => [row.id, asProfile(row)]))
}

export async function loadProfile(id: string): Promise<Profile | null> {
  const profiles = await loadProfilesByIds([id])
  return profiles.get(id) ?? null
}

export const FRIENDS_CHANGED_EVENT = 'kryogames-friends-changed'

export function emitFriendsChanged() {
  window.dispatchEvent(new Event(FRIENDS_CHANGED_EVENT))
}

export async function listFriends(
  userId: string,
): Promise<{ friends: FriendEntry[]; error: string | null }> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (error) {
    return { friends: [], error: error.message }
  }

  const rows = (data ?? []) as FriendshipRow[]
  const otherIds = rows.map((row) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id,
  )
  const profiles = await loadProfilesByIds(otherIds)

  const friends: FriendEntry[] = []
  for (const row of rows) {
    const otherId = row.requester_id === userId ? row.addressee_id : row.requester_id
    const profile = profiles.get(otherId)
    if (!profile) continue
    friends.push({ friendshipId: row.id, profile })
  }

  friends.sort((a, b) => a.profile.username.localeCompare(b.profile.username))
  return { friends, error: null }
}

export async function countFriends(
  userId: string,
): Promise<{ count: number; error: string | null }> {
  const { count, error } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)

  if (error) {
    return { count: 0, error: error.message }
  }

  return { count: count ?? 0, error: null }
}

export async function listIncomingRequests(
  userId: string,
): Promise<{ requests: FriendRequestEntry[]; error: string | null }> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .eq('addressee_id', userId)
    .eq('status', 'pending')

  if (error) {
    return { requests: [], error: error.message }
  }

  const rows = (data ?? []) as FriendshipRow[]
  const profiles = await loadProfilesByIds(rows.map((row) => row.requester_id))

  const requests: FriendRequestEntry[] = []
  for (const row of rows) {
    const profile = profiles.get(row.requester_id)
    if (!profile) continue
    requests.push({ friendshipId: row.id, profile })
  }

  return { requests, error: null }
}

export async function listOutgoingPendingIds(
  userId: string,
): Promise<{ ids: Set<string>; error: string | null }> {
  const { data, error } = await supabase
    .from('friendships')
    .select('addressee_id')
    .eq('requester_id', userId)
    .eq('status', 'pending')

  if (error) {
    return { ids: new Set(), error: error.message }
  }

  return {
    ids: new Set((data ?? []).map((row) => row.addressee_id as string)),
    error: null,
  }
}

export async function sendFriendRequest(
  fromUserId: string,
  toUserId: string,
): Promise<{ error: string | null }> {
  if (fromUserId === toUserId) {
    return { error: 'You cannot add yourself.' }
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('friendships')
    .select('id, status, requester_id, addressee_id')
    .in('requester_id', [fromUserId, toUserId])
    .in('addressee_id', [fromUserId, toUserId])

  if (existingError) {
    return { error: existingError.message }
  }

  const existing = (existingRows ?? []).find(
    (row) =>
      (row.requester_id === fromUserId && row.addressee_id === toUserId) ||
      (row.requester_id === toUserId && row.addressee_id === fromUserId),
  )

  if (existing) {
    if (existing.status === 'accepted') {
      return { error: 'You are already friends.' }
    }
    if (existing.status === 'pending') {
      return {
        error:
          existing.requester_id === fromUserId
            ? 'Friend request already sent.'
            : 'They already sent you a request — check Incoming requests.',
      }
    }
  }

  const { error } = await supabase.from('friendships').insert({
    requester_id: fromUserId,
    addressee_id: toUserId,
    status: 'pending',
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Friend request already exists.' }
    }
    return { error: error.message }
  }

  emitFriendsChanged()
  return { error: null }
}

export async function removeFriend(friendshipId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId)

  if (error) {
    return { error: error.message }
  }

  emitFriendsChanged()
  return { error: null }
}

export async function respondToRequest(
  friendshipId: string,
  status: 'accepted' | 'declined',
): Promise<{ error: string | null }> {
  // Decline removes the row so either side can request again later.
  if (status === 'declined') {
    return removeFriend(friendshipId)
  }

  const { error } = await supabase
    .from('friendships')
    .update({ status })
    .eq('id', friendshipId)

  if (error) {
    return { error: error.message }
  }

  emitFriendsChanged()
  return { error: null }
}
