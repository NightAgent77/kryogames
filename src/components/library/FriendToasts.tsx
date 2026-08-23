import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  FRIENDS_CHANGED_EVENT,
  emitFriendsChanged,
  listFriends,
  listIncomingRequests,
  listOutgoingPendingIds,
  loadProfile,
  profileLabel,
  respondToRequest,
  type Profile,
} from '../../lib/friends'
import {
  PRESENCE_CHANGED_EVENT,
  getOnlineUserIds,
} from '../../lib/presence'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import { playNotificationSound, unlockNotificationSound } from '../../lib/notificationSound'
import { getInitials } from '../../lib/userDisplay'

type ToastKind = 'incoming' | 'accepted' | 'online'

interface FriendToast {
  id: string
  kind: ToastKind
  friendshipId: string
  profile: Profile
}

type FriendshipRecord = {
  id: string
  requester_id: string
  addressee_id: string
  status: string
}

const POLL_MS = 8000
const TOAST_DISMISS_MS = 6000

function asFriendship(value: unknown): FriendshipRecord | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  if (
    typeof row.id !== 'string' ||
    typeof row.requester_id !== 'string' ||
    typeof row.addressee_id !== 'string' ||
    typeof row.status !== 'string'
  ) {
    return null
  }
  return {
    id: row.id,
    requester_id: row.requester_id,
    addressee_id: row.addressee_id,
    status: row.status,
  }
}

function PersonAvatar({ profile }: { profile: Profile }) {
  return (
    <span className="friend-toast-avatar" aria-hidden="true">
      {profile.avatar ? (
        <img src={profile.avatar} alt="" className="friend-toast-avatar-img" />
      ) : (
        getInitials(profileLabel(profile.username))
      )}
    </span>
  )
}

function toastCopy(kind: ToastKind): string {
  if (kind === 'incoming') return 'sent you a friend request'
  if (kind === 'accepted') return 'accepted your friend request'
  return 'is online now'
}

export function FriendToasts() {
  const { user } = useAuth()
  const userId = user?.id
  const [toasts, setToasts] = useState<FriendToast[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const seenRef = useRef(new Set<string>())
  const pendingOutRef = useRef(new Set<string>())
  const friendIdsRef = useRef(new Set<string>())
  const friendByIdRef = useRef(new Map<string, { friendshipId: string; profile: Profile }>())
  const prevOnlineFriendsRef = useRef(new Set<string>())
  const presenceReadyRef = useRef(false)
  const readyRef = useRef(false)
  const timersRef = useRef(new Map<string, number>())

  useEffect(() => {
    const unlock = () => unlockNotificationSound()
    unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (kind: ToastKind, friendshipId: string, profile: Profile) => {
      const seenKey =
        kind === 'online' ? `online:${profile.id}` : `${kind}:${friendshipId}`
      if (seenRef.current.has(seenKey)) return
      seenRef.current.add(seenKey)

      const toast: FriendToast = {
        id: kind === 'online' ? `online-${profile.id}-${Date.now()}` : `${kind}-${friendshipId}`,
        kind,
        friendshipId,
        profile,
      }

      setToasts((prev) => [toast, ...prev].slice(0, 4))
      playNotificationSound()

      const timeout = window.setTimeout(() => dismiss(toast.id), TOAST_DISMISS_MS)
      timersRef.current.set(toast.id, timeout)
    },
    [dismiss],
  )

  const syncPresenceToasts = useCallback(() => {
    if (!userId || !readyRef.current) return

    const online = getOnlineUserIds()
    const friendIds = friendIdsRef.current
    const onlineFriends = new Set(
      [...online].filter((id) => friendIds.has(id) && id !== userId),
    )

    if (!presenceReadyRef.current) {
      prevOnlineFriendsRef.current = onlineFriends
      for (const id of onlineFriends) {
        seenRef.current.add(`online:${id}`)
      }
      presenceReadyRef.current = true
      return
    }

    const prev = prevOnlineFriendsRef.current
    for (const id of onlineFriends) {
      if (prev.has(id)) continue
      const entry = friendByIdRef.current.get(id)
      if (entry) {
        pushToast('online', entry.friendshipId, entry.profile)
      } else {
        void (async () => {
          const profile = await loadProfile(id)
          if (!profile) return
          pushToast('online', id, profile)
        })()
      }
    }

    for (const id of prev) {
      if (!onlineFriends.has(id)) {
        seenRef.current.delete(`online:${id}`)
      }
    }

    prevOnlineFriendsRef.current = onlineFriends
  }, [pushToast, userId])

  const syncLists = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!userId || !isSupabaseConfigured) return

      const [incomingRes, outgoingRes, friendsRes] = await Promise.all([
        listIncomingRequests(userId),
        listOutgoingPendingIds(userId),
        listFriends(userId),
      ])

      if (incomingRes.error || outgoingRes.error || friendsRes.error) return

      const incoming = incomingRes.requests
      const outgoing = outgoingRes.ids
      const friends = friendsRes.friends
      const silent = opts?.silent || !readyRef.current

      friendIdsRef.current = new Set(friends.map((f) => f.profile.id))
      friendByIdRef.current = new Map(
        friends.map((f) => [f.profile.id, { friendshipId: f.friendshipId, profile: f.profile }]),
      )

      if (!readyRef.current) {
        for (const request of incoming) {
          seenRef.current.add(`incoming:${request.friendshipId}`)
        }
        for (const friend of friends) {
          seenRef.current.add(`accepted:${friend.friendshipId}`)
        }
        pendingOutRef.current = outgoing
        readyRef.current = true
        syncPresenceToasts()
        return
      }

      if (!silent) {
        for (const request of incoming) {
          pushToast('incoming', request.friendshipId, request.profile)
        }

        const prevPending = pendingOutRef.current
        for (const friend of friends) {
          if (prevPending.has(friend.profile.id)) {
            pushToast('accepted', friend.friendshipId, friend.profile)
          }
        }
      } else {
        for (const request of incoming) {
          seenRef.current.add(`incoming:${request.friendshipId}`)
        }
      }

      pendingOutRef.current = outgoing
      syncPresenceToasts()
    },
    [pushToast, syncPresenceToasts, userId],
  )

  useEffect(() => {
    setToasts([])
    seenRef.current = new Set()
    pendingOutRef.current = new Set()
    friendIdsRef.current = new Set()
    friendByIdRef.current = new Map()
    prevOnlineFriendsRef.current = new Set()
    presenceReadyRef.current = false
    readyRef.current = false

    if (!userId || !isSupabaseConfigured) return

    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null
    let poll = 0

    const onFriendsChanged = () => {
      void syncLists({ silent: false })
    }

    const onPresenceChanged = () => {
      syncPresenceToasts()
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void syncLists({ silent: false })
      }
    }

    void (async () => {
      await syncLists({ silent: true })
      if (cancelled) return

      channel = supabase
        .channel(`friend-notices:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'friendships',
            filter: `addressee_id=eq.${userId}`,
          },
          (payload) => {
            const row = asFriendship(payload.new)
            if (!row || row.status !== 'pending') return
            void (async () => {
              const profile = await loadProfile(row.requester_id)
              if (!profile || cancelled) return
              pushToast('incoming', row.id, profile)
              emitFriendsChanged()
            })()
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'friendships',
            filter: `requester_id=eq.${userId}`,
          },
          (payload) => {
            const row = asFriendship(payload.new)
            if (!row) return
            pendingOutRef.current = new Set(pendingOutRef.current).add(row.addressee_id)
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'friendships',
            filter: `requester_id=eq.${userId}`,
          },
          (payload) => {
            const row = asFriendship(payload.new)
            if (!row || row.status !== 'accepted') return
            void (async () => {
              const profile = await loadProfile(row.addressee_id)
              if (!profile || cancelled) return
              pendingOutRef.current.delete(row.addressee_id)
              pushToast('accepted', row.id, profile)
              emitFriendsChanged()
            })()
          },
        )

      channel.subscribe()
      if (cancelled) {
        void supabase.removeChannel(channel)
        return
      }

      poll = window.setInterval(() => {
        void syncLists({ silent: false })
      }, POLL_MS)
      window.addEventListener(FRIENDS_CHANGED_EVENT, onFriendsChanged)
      window.addEventListener(PRESENCE_CHANGED_EVENT, onPresenceChanged)
      document.addEventListener('visibilitychange', onVisible)
    })()

    const timers = timersRef.current

    return () => {
      cancelled = true
      window.removeEventListener(FRIENDS_CHANGED_EVENT, onFriendsChanged)
      window.removeEventListener(PRESENCE_CHANGED_EVENT, onPresenceChanged)
      document.removeEventListener('visibilitychange', onVisible)
      if (poll) window.clearInterval(poll)
      if (channel) void supabase.removeChannel(channel)
      for (const timer of timers.values()) {
        window.clearTimeout(timer)
      }
      timers.clear()
    }
  }, [pushToast, syncLists, syncPresenceToasts, userId])

  const handleRespond = async (
    toast: FriendToast,
    status: 'accepted' | 'declined',
  ) => {
    setBusyId(toast.friendshipId)
    const { error } = await respondToRequest(toast.friendshipId, status)
    setBusyId(null)
    if (error) return
    dismiss(toast.id)
  }

  if (toasts.length === 0) return null

  return (
    <div className="friend-toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => {
        const name = profileLabel(toast.profile.username)
        const incoming = toast.kind === 'incoming'
        const online = toast.kind === 'online'
        return (
          <article
            key={toast.id}
            className={`friend-toast friend-toast--${toast.kind}`}
            role="status"
          >
            <div className="friend-toast-avatar-wrap">
              <PersonAvatar profile={toast.profile} />
              {online ? <span className="friend-toast-online-dot" aria-hidden="true" /> : null}
            </div>
            <div className="friend-toast-body">
              <p className="friend-toast-title">{name}</p>
              <p className="friend-toast-copy">{toastCopy(toast.kind)}</p>
              {incoming ? (
                <div className="friend-toast-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busyId === toast.friendshipId}
                    onClick={() => void handleRespond(toast, 'accepted')}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={busyId === toast.friendshipId}
                    onClick={() => void handleRespond(toast, 'declined')}
                  >
                    Decline
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="friend-toast-dismiss"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M3 3l8 8M11 3l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </article>
        )
      })}
    </div>
  )
}
