import { isSupabaseConfigured, supabase } from './supabase'

export const PRESENCE_CHANGED_EVENT = 'kryogames-presence-changed'

type PresenceMeta = {
  user_id: string
  online_at: string
}

type PresenceChannel = ReturnType<typeof supabase.channel>

let channel: PresenceChannel | null = null
let currentUserId: string | null = null
let onlineIds = new Set<string>()
let visibilityBound = false

function emitPresenceChanged() {
  window.dispatchEvent(
    new CustomEvent(PRESENCE_CHANGED_EVENT, {
      detail: { ids: [...onlineIds] },
    }),
  )
}

function syncFromChannel() {
  if (!channel) {
    onlineIds = new Set()
    emitPresenceChanged()
    return
  }

  const state = channel.presenceState<PresenceMeta>()
  const next = new Set<string>()
  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      if (typeof entry.user_id === 'string' && entry.user_id.length > 0) {
        next.add(entry.user_id)
      }
    }
  }
  onlineIds = next
  emitPresenceChanged()
}

async function trackSelf() {
  if (!channel || !currentUserId) return
  await channel.track({
    user_id: currentUserId,
    online_at: new Date().toISOString(),
  })
}

function onVisibilityChange() {
  if (!channel || !currentUserId) return
  if (document.visibilityState === 'visible') {
    void trackSelf()
  }
}

function bindVisibility() {
  if (visibilityBound) return
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', onVisibilityChange)
  visibilityBound = true
}

function unbindVisibility() {
  if (!visibilityBound) return
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('focus', onVisibilityChange)
  visibilityBound = false
}

export function getOnlineUserIds(): Set<string> {
  return new Set(onlineIds)
}

export function isUserOnline(userId: string): boolean {
  return onlineIds.has(userId)
}

/** Join the shared online presence channel for the signed-in user. */
export async function startPresence(userId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId) return
  if (currentUserId === userId && channel) {
    await trackSelf()
    return
  }

  await stopPresence()
  currentUserId = userId

  const next = supabase.channel('kryogames-online', {
    config: { presence: { key: userId } },
  })

  next
    .on('presence', { event: 'sync' }, () => {
      syncFromChannel()
    })
    .on('presence', { event: 'join' }, () => {
      syncFromChannel()
    })
    .on('presence', { event: 'leave' }, () => {
      syncFromChannel()
    })

  channel = next
  bindVisibility()

  await new Promise<void>((resolve) => {
    next.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await trackSelf()
        syncFromChannel()
        resolve()
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        resolve()
      }
    })
  })
}

export async function stopPresence(): Promise<void> {
  unbindVisibility()
  const active = channel
  channel = null
  currentUserId = null
  onlineIds = new Set()
  emitPresenceChanged()

  if (!active) return
  try {
    await active.untrack()
  } catch {
    // ignore teardown races
  }
  await supabase.removeChannel(active)
}
