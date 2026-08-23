import type { Profile } from './friends'

export const NOTICES_CHANGED_EVENT = 'kryogames-notices-changed'

export type NoticeKind = 'incoming' | 'accepted' | 'online'

export interface Notice {
  id: string
  kind: NoticeKind
  createdAt: number
  read: boolean
  friendshipId?: string
  profiles: Profile[]
}

const PREFIX = 'kryogames-notices:'
const MAX = 40

function storageKey(userId: string) {
  return `${PREFIX}${userId}`
}

function emit(userId: string) {
  window.dispatchEvent(new CustomEvent(NOTICES_CHANGED_EVENT, { detail: { userId } }))
}

export function loadNotices(userId: string): Notice[] {
  if (!userId) return []
  try {
    const raw = sessionStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as Notice[]
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveNotices(userId: string, notices: Notice[]) {
  try {
    sessionStorage.setItem(storageKey(userId), JSON.stringify(notices.slice(0, MAX)))
  } catch {
    /* ignore quota */
  }
  emit(userId)
}

export function addNotice(
  userId: string,
  input: {
    kind: NoticeKind
    profiles: Profile[]
    friendshipId?: string
  },
): Notice {
  const current = loadNotices(userId)
  if (input.kind === 'incoming' && input.friendshipId) {
    const existing = current.find(
      (notice) => notice.kind === 'incoming' && notice.friendshipId === input.friendshipId,
    )
    if (existing) return existing
  }

  const notice: Notice = {
    id: `${input.kind}-${input.friendshipId ?? input.profiles.map((p) => p.id).join('-')}-${Date.now()}`,
    kind: input.kind,
    createdAt: Date.now(),
    read: false,
    friendshipId: input.friendshipId,
    profiles: input.profiles,
  }

  saveNotices(userId, [notice, ...current].slice(0, MAX))
  return notice
}

export function markAllNoticesRead(userId: string) {
  const next = loadNotices(userId).map((notice) => ({ ...notice, read: true }))
  saveNotices(userId, next)
}

export function removeNotice(userId: string, id: string) {
  saveNotices(
    userId,
    loadNotices(userId).filter((notice) => notice.id !== id),
  )
}

export function removeIncomingNotice(userId: string, friendshipId: string) {
  saveNotices(
    userId,
    loadNotices(userId).filter(
      (notice) => !(notice.kind === 'incoming' && notice.friendshipId === friendshipId),
    ),
  )
}

export function unreadNoticeCount(userId: string) {
  return loadNotices(userId).filter((notice) => !notice.read).length
}

export function pruneIncomingNotices(userId: string, liveFriendshipIds: Set<string>) {
  const current = loadNotices(userId)
  const next = current.filter(
    (notice) =>
      notice.kind !== 'incoming' ||
      (notice.friendshipId != null && liveFriendshipIds.has(notice.friendshipId)),
  )
  if (next.length !== current.length) saveNotices(userId, next)
}

export function clearNotices(userId: string) {
  try {
    sessionStorage.removeItem(storageKey(userId))
  } catch {
    /* ignore */
  }
  emit(userId)
}

const GREET_PREFIX = 'kryogames-online-greet:'

export function hasSessionGreeted(userId: string) {
  try {
    return sessionStorage.getItem(`${GREET_PREFIX}${userId}`) === '1'
  } catch {
    return false
  }
}

export function markSessionGreeted(userId: string) {
  try {
    sessionStorage.setItem(`${GREET_PREFIX}${userId}`, '1')
  } catch {
    /* ignore */
  }
}

export function clearSessionGreet(userId: string) {
  try {
    sessionStorage.removeItem(`${GREET_PREFIX}${userId}`)
  } catch {
    /* ignore */
  }
}

export function onlineNames(profiles: Profile[]) {
  const names = profiles.map((profile) => profile.username)
  if (names.length === 0) return 'A friend'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names[0]}, ${names[1]} and ${names.length - 2} other${names.length - 2 === 1 ? '' : 's'}`
}

export function noticeCopy(notice: Pick<Notice, 'kind' | 'profiles'>) {
  if (notice.kind === 'incoming') {
    return notice.profiles.length > 1
      ? 'sent you friend requests'
      : 'sent you a friend request'
  }
  if (notice.kind === 'accepted') return 'accepted your friend request'
  return notice.profiles.length > 1 ? 'are online now' : 'is online now'
}
