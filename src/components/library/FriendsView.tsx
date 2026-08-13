import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  listFriends,
  listIncomingRequests,
  listOutgoingPendingIds,
  removeFriend,
  respondToRequest,
  searchProfiles,
  sendFriendRequest,
  type FriendEntry,
  type FriendRequestEntry,
  type Profile,
} from '../../lib/friends'
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
        getInitials(profile.username)
      )}
    </span>
  )
}

export function FriendsView({ query }: FriendsViewProps) {
  const { user } = useAuth()
  const [results, setResults] = useState<Profile[]>([])
  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [requests, setRequests] = useState<FriendRequestEntry[]>([])
  const [pendingOutIds, setPendingOutIds] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const searchGen = useRef(0)

  const userId = user?.id

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

    ;(async () => {
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
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    const gen = ++searchGen.current
    setSearching(true)
    const timer = window.setTimeout(async () => {
      const { profiles, error: searchError } = await searchProfiles(trimmed, userId)
      if (gen !== searchGen.current) return
      setSearching(false)
      if (searchError) {
        setError(searchError)
        setResults([])
        return
      }
      setResults(profiles)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [query, userId])

  const friendIds = new Set(friends.map((f) => f.profile.id))
  const pendingInIds = new Set(requests.map((r) => r.profile.id))

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
    setStatus(`Request sent to ${profile.username}.`)
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

  const handleRemove = async (friendshipId: string, username: string) => {
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
      <h2 id="friends-heading" className="library-section-title">
        Friends
      </h2>

      {error ? <p className="friends-banner friends-banner--error">{error}</p> : null}
      {status ? <p className="friends-banner friends-banner--ok">{status}</p> : null}

      {query.trim().length >= 2 ? (
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
                    <span className="friends-name">{profile.username}</span>
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

      <div className="friends-block">
        <h3 className="friends-block-title">Incoming requests</h3>
        {requests.length === 0 ? (
          <p className="library-empty">No requests right now</p>
        ) : (
          <ul className="friends-list">
            {requests.map((req) => (
              <li key={req.friendshipId} className="friends-row">
                <PersonAvatar profile={req.profile} />
                <span className="friends-name">{req.profile.username}</span>
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
        )}
      </div>

      <div className="friends-block">
        <h3 className="friends-block-title">Your friends</h3>
        {friends.length === 0 ? (
          <p className="library-empty">No friends yet — search a username to add someone</p>
        ) : (
          <ul className="friends-list">
            {friends.map((entry) => (
              <li key={entry.friendshipId} className="friends-row">
                <PersonAvatar profile={entry.profile} />
                <span className="friends-name">{entry.profile.username}</span>
                <button
                  type="button"
                  className="btn btn-secondary friends-action"
                  disabled={busyId === entry.friendshipId}
                  onClick={() => void handleRemove(entry.friendshipId, entry.profile.username)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
