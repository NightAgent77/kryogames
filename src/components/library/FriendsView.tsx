import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  FRIENDS_CHANGED_EVENT,
  listFriends,
  listIncomingRequests,
  listOutgoingPendingIds,
  profileLabel,
  removeFriend,
  respondToRequest,
  searchProfiles,
  sendFriendRequest,
  type FriendEntry,
  type FriendRequestEntry,
  type Profile,
} from '../../lib/friends'
import {
  PRESENCE_CHANGED_EVENT,
  getOnlineUserIds,
} from '../../lib/presence'
import { getInitials } from '../../lib/userDisplay'

interface FriendsViewProps {
  query: string
}

type ResultAction = 'add' | 'pending' | 'friends'

function relationFor(
  profileId: string,
  friendIds: Set<string>,
  pendingOutIds: Set<string>,
  pendingInIds: Set<string>,
): ResultAction {
  if (friendIds.has(profileId)) return 'friends'
  if (pendingOutIds.has(profileId) || pendingInIds.has(profileId)) return 'pending'
  return 'add'
}

function PersonAvatar({ profile }: { profile: Profile }) {
  return (
    <span className="friends-avatar" aria-hidden="true">
      {profile.avatar ? (
        <img src={profile.avatar} alt="" className="friends-avatar-img" />
      ) : (
        getInitials(profileLabel(profile.username))
      )}
    </span>
  )
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="3.25" r="1.35" fill="currentColor" />
      <circle cx="8" cy="8" r="1.35" fill="currentColor" />
      <circle cx="8" cy="12.75" r="1.35" fill="currentColor" />
    </svg>
  )
}

function FriendRow({
  entry,
  online,
  busy,
  menuOpen,
  onToggleMenu,
  onInvite,
  onRemove,
}: {
  entry: FriendEntry
  online: boolean
  busy: boolean
  menuOpen: boolean
  onToggleMenu: () => void
  onInvite: () => void
  onRemove: () => void
}) {
  const name = profileLabel(entry.profile.username)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onToggleMenu()
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggleMenu()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen, onToggleMenu])

  return (
    <li
      className={`friends-row${online ? ' friends-row--online' : ' friends-row--offline'}${menuOpen ? ' friends-row--menu-open' : ''}`}
    >
      <PersonAvatar profile={entry.profile} />
      <div className="friends-row-meta">
        <span className="friends-name">{name}</span>
        <span className={`friends-status-label${online ? ' friends-status-label--online' : ''}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="friends-menu" ref={menuRef}>
        <button
          type="button"
          className={`friends-menu-trigger${menuOpen ? ' friends-menu-trigger--open' : ''}`}
          aria-label={`More options for ${name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={busy}
          onClick={onToggleMenu}
        >
          <MoreIcon />
        </button>
        {menuOpen ? (
          <div className="friends-menu-popover" role="menu">
            <button
              type="button"
              role="menuitem"
              className="friends-menu-item"
              disabled={busy}
              onClick={onInvite}
            >
              Invite to
            </button>
            <button
              type="button"
              role="menuitem"
              className="friends-menu-item friends-menu-item--danger"
              disabled={busy}
              onClick={onRemove}
            >
              Remove
            </button>
          </div>
        ) : null}
      </div>
    </li>
  )
}

export function FriendsView({ query }: FriendsViewProps) {
  const { user } = useAuth()
  const [results, setResults] = useState<Profile[]>([])
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [requests, setRequests] = useState<FriendRequestEntry[]>([])
  const [pendingOutIds, setPendingOutIds] = useState<Set<string>>(new Set())
  const [onlineIds, setOnlineIds] = useState<Set<string>>(() => getOnlineUserIds())
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const userId = user?.id

  useEffect(() => {
    const onPresence = () => setOnlineIds(getOnlineUserIds())
    onPresence()
    window.addEventListener(PRESENCE_CHANGED_EVENT, onPresence)
    return () => window.removeEventListener(PRESENCE_CHANGED_EVENT, onPresence)
  }, [])

  const refreshLists = async () => {
    if (!userId) return
    setError(null)

    const [friendsRes, requestsRes, pendingRes] = await Promise.all([
      listFriends(userId),
      listIncomingRequests(userId),
      listOutgoingPendingIds(userId),
    ])

    if (friendsRes.error || requestsRes.error || pendingRes.error) {
      setError(
        friendsRes.error ||
          requestsRes.error ||
          pendingRes.error ||
          'Could not load friends.',
      )
      return
    }

    setFriends(friendsRes.friends)
    setRequests(requestsRes.requests)
    setPendingOutIds(pendingRes.ids)
  }

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const load = async () => {
      const [friendsRes, requestsRes, pendingRes] = await Promise.all([
        listFriends(userId),
        listIncomingRequests(userId),
        listOutgoingPendingIds(userId),
      ])
      if (cancelled) return
      if (friendsRes.error || requestsRes.error || pendingRes.error) {
        setError(
          friendsRes.error ||
            requestsRes.error ||
            pendingRes.error ||
            'Could not load friends.',
        )
        return
      }
      setFriends(friendsRes.friends)
      setRequests(requestsRes.requests)
      setPendingOutIds(pendingRes.ids)
    }

    void load()
    const onChange = () => {
      void load()
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') onChange()
    }
    window.addEventListener(FRIENDS_CHANGED_EVENT, onChange)
    window.addEventListener('focus', onChange)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelled = true
      window.removeEventListener(FRIENDS_CHANGED_EVENT, onChange)
      window.removeEventListener('focus', onChange)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const trimmed = query.trim()
    if (trimmed.length < 1) {
      setResults([])
      setSearching(false)
      return
    }

    let alive = true
    setSearching(true)
    const timer = window.setTimeout(async () => {
      const { profiles, error: searchError } = await searchProfiles(trimmed, userId)
      if (!alive) return
      setSearching(false)
      if (searchError) {
        setError(searchError)
        setResults([])
        return
      }
      setResults(profiles)
    }, 250)

    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [query, userId])

  const friendIds = new Set(friends.map((f) => f.profile.id))
  const pendingInIds = new Set(requests.map((r) => r.profile.id))

  const onlineFriends = friends
    .filter((f) => onlineIds.has(f.profile.id))
    .sort((a, b) => a.profile.username.localeCompare(b.profile.username))
  const offlineFriends = friends
    .filter((f) => !onlineIds.has(f.profile.id))
    .sort((a, b) => a.profile.username.localeCompare(b.profile.username))

  const handleAdd = async (profile: Profile) => {
    if (!userId) return
    setBusyId(profile.id)
    setError(null)
    setStatus(null)
    const { error: sendError } = await sendFriendRequest(userId, profile.id)
    setBusyId(null)
    if (sendError) {
      setError(sendError)
      return
    }
    setPendingOutIds((prev) => new Set(prev).add(profile.id))
    setStatus(`Request sent to ${profileLabel(profile.username)}.`)
  }

  const handleRespond = async (
    friendshipId: string,
    next: 'accepted' | 'declined',
  ) => {
    setBusyId(friendshipId)
    setError(null)
    setStatus(null)
    const { error: respondError } = await respondToRequest(friendshipId, next)
    setBusyId(null)
    if (respondError) {
      setError(respondError)
      return
    }
    setStatus(next === 'accepted' ? 'Friend request accepted.' : 'Request declined.')
    await refreshLists()
  }

  const handleInvite = (username: string) => {
    setMenuId(null)
    setError(null)
    setStatus(`Invite to ${username} — game invites coming soon.`)
  }

  const handleRemove = async (friendshipId: string, username: string) => {
    setMenuId(null)
    setBusyId(friendshipId)
    setError(null)
    setStatus(null)
    const { error: removeError } = await removeFriend(friendshipId)
    setBusyId(null)
    if (removeError) {
      setError(removeError)
      return
    }
    setStatus(`${username} removed from friends.`)
    await refreshLists()
  }

  return (
    <section className="library-content library-content--enter friends-view" aria-labelledby="friends-heading">
      <header className="friends-header">
        <h2 id="friends-heading" className="library-section-title">
          Friends
        </h2>
        <p className="friends-lead">
          See who’s around, manage requests, and keep your list tidy.
        </p>
      </header>

      {error ? <p className="friends-banner friends-banner--error">{error}</p> : null}
      {status ? <p className="friends-banner friends-banner--ok">{status}</p> : null}

      {query.trim().length >= 1 ? (
        <div className="friends-block">
          <h3 className="friends-block-title">Search results</h3>
          {searching ? (
            <p className="library-empty">Searching…</p>
          ) : results.length === 0 ? (
            <p className="library-empty">No usernames found</p>
          ) : (
            <ul className="friends-list">
              {results.map((profile) => {
                const action = relationFor(
                  profile.id,
                  friendIds,
                  pendingOutIds,
                  pendingInIds,
                )
                return (
                  <li key={profile.id} className="friends-row">
                    <PersonAvatar profile={profile} />
                    <div className="friends-row-meta">
                      <span className="friends-name">{profileLabel(profile.username)}</span>
                    </div>
                    {action === 'add' ? (
                      <button
                        type="button"
                        className="btn btn-primary friends-action"
                        disabled={busyId === profile.id}
                        onClick={() => void handleAdd(profile)}
                      >
                        Add
                      </button>
                    ) : (
                      <span className="friends-badge">
                        {action === 'pending' ? 'Pending' : 'Friends'}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}

      {requests.length > 0 ? (
        <div className="friends-block">
          <div className="friends-section-head">
            <h3 className="friends-block-title">Incoming requests</h3>
            <span className="friends-count-pill">{requests.length}</span>
          </div>
          <ul className="friends-list">
            {requests.map((req) => (
              <li key={req.friendshipId} className="friends-row friends-row--request">
                <PersonAvatar profile={req.profile} />
                <div className="friends-row-meta">
                  <span className="friends-name">{profileLabel(req.profile.username)}</span>
                  <span className="friends-status-label">Wants to be friends</span>
                </div>
                <div className="friends-row-actions">
                  <button
                    type="button"
                    className="btn btn-primary friends-action"
                    disabled={busyId === req.friendshipId}
                    onClick={() => void handleRespond(req.friendshipId, 'accepted')}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary friends-action"
                    disabled={busyId === req.friendshipId}
                    onClick={() => void handleRespond(req.friendshipId, 'declined')}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {onlineFriends.length > 0 ? (
        <div className="friends-block friends-block--online library-content--enter">
          <div className="friends-section-head">
            <h3 className="friends-block-title">
              <span className="friends-online-dot friends-online-dot--inline" aria-hidden="true" />
              Online
            </h3>
            <span className="friends-count-pill friends-count-pill--online">{onlineFriends.length}</span>
          </div>
          <ul className="friends-list">
            {onlineFriends.map((entry) => (
              <FriendRow
                key={entry.friendshipId}
                entry={entry}
                online
                busy={busyId === entry.friendshipId}
                menuOpen={menuId === entry.friendshipId}
                onToggleMenu={() =>
                  setMenuId((prev) =>
                    prev === entry.friendshipId ? null : entry.friendshipId,
                  )
                }
                onInvite={() => handleInvite(profileLabel(entry.profile.username))}
                onRemove={() =>
                  void handleRemove(
                    entry.friendshipId,
                    profileLabel(entry.profile.username),
                  )
                }
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div className="friends-block">
        <div className="friends-section-head">
          <h3 className="friends-block-title">Offline</h3>
          <span className="friends-count-pill">{offlineFriends.length}</span>
        </div>
        {friends.length === 0 ? (
          <p className="library-empty friends-empty-card">
            No friends yet — search a username to add someone
          </p>
        ) : offlineFriends.length === 0 ? (
          <p className="library-empty friends-empty-card">Everyone on your list is online</p>
        ) : (
          <ul className="friends-list">
            {offlineFriends.map((entry) => (
              <FriendRow
                key={entry.friendshipId}
                entry={entry}
                online={false}
                busy={busyId === entry.friendshipId}
                menuOpen={menuId === entry.friendshipId}
                onToggleMenu={() =>
                  setMenuId((prev) =>
                    prev === entry.friendshipId ? null : entry.friendshipId,
                  )
                }
                onInvite={() => handleInvite(profileLabel(entry.profile.username))}
                onRemove={() =>
                  void handleRemove(
                    entry.friendshipId,
                    profileLabel(entry.profile.username),
                  )
                }
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
