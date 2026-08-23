import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { FRIENDS_CHANGED_EVENT, profileLabel, respondToRequest, type Profile } from '../../lib/friends'
import {
  NOTICES_CHANGED_EVENT,
  clearNotices,
  loadNotices,
  markAllNoticesRead,
  noticeCopy,
  onlineNames,
  removeNotice,
  type Notice,
} from '../../lib/notices'
import { getInitials } from '../../lib/userDisplay'

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

function timeAgo(createdAt: number) {
  const seconds = Math.max(0, Math.round((Date.now() - createdAt) / 1000))
  if (seconds < 45) return 'Just now'
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`
  return `${Math.round(seconds / 86400)}d ago`
}

export function NotificationBell() {
  const { user } = useAuth()
  const userId = user?.id
  const [open, setOpen] = useState(false)
  const [notices, setNotices] = useState<Notice[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) {
      setNotices([])
      setOpen(false)
      return
    }

    const refresh = () => setNotices(loadNotices(userId))
    refresh()

    const onChange = () => refresh()
    window.addEventListener(NOTICES_CHANGED_EVENT, onChange)
    window.addEventListener(FRIENDS_CHANGED_EVENT, onChange)
    return () => {
      window.removeEventListener(NOTICES_CHANGED_EVENT, onChange)
      window.removeEventListener(FRIENDS_CHANGED_EVENT, onChange)
    }
  }, [userId])

  useEffect(() => {
    if (!open) return

    const handlePointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointer)
    return () => document.removeEventListener('mousedown', handlePointer)
  }, [open])

  const unread = notices.filter((notice) => !notice.read).length

  const toggle = () => {
    setOpen((wasOpen) => {
      const next = !wasOpen
      if (next && userId) markAllNoticesRead(userId)
      return next
    })
  }

  const handleRespond = async (notice: Notice, status: 'accepted' | 'declined') => {
    if (!notice.friendshipId || !userId) return
    setBusyId(notice.id)
    const { error } = await respondToRequest(notice.friendshipId, status)
    setBusyId(null)
    if (error) return
    removeNotice(userId, notice.id)
  }

  return (
    <div className="library-notice" ref={wrapRef}>
      <button
        type="button"
        className="library-notice-btn"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path
            d="M9 2.25a4.5 4.5 0 0 0-4.5 4.5v1.62c0 .42-.14.83-.4 1.16L3.1 10.9a1.2 1.2 0 0 0 .93 1.97h9.94a1.2 1.2 0 0 0 .93-1.97l-1-1.37a1.8 1.8 0 0 1-.4-1.16V6.75A4.5 4.5 0 0 0 9 2.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M7.1 14.35a2.1 2.1 0 0 0 3.8 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {unread > 0 ? (
          <span className="library-notice-badge">{unread > 9 ? '9+' : unread}</span>
        ) : null}
      </button>

      {open ? (
        <div className="library-notice-panel" role="dialog" aria-label="Notifications">
          <div className="library-notice-head">
            <p className="library-notice-title">Notifications</p>
            {notices.length > 0 ? (
              <button
                type="button"
                className="library-notice-clear"
                onClick={() => {
                  if (userId) clearNotices(userId)
                }}
              >
                Clear all
              </button>
            ) : null}
          </div>

          {notices.length === 0 ? (
            <p className="library-notice-empty">No notifications yet</p>
          ) : (
            <ul className="library-notice-list">
              {notices.map((notice) => (
                <li key={notice.id} className="library-notice-item">
                  <div className="friend-toast-avatar-stack">
                    {notice.profiles.slice(0, 3).map((profile) => (
                      <div key={profile.id} className="friend-toast-avatar-wrap">
                        <PersonAvatar profile={profile} />
                      </div>
                    ))}
                  </div>
                  <div className="library-notice-body">
                    <p className="library-notice-item-title">{onlineNames(notice.profiles)}</p>
                    <p className="library-notice-item-copy">{noticeCopy(notice)}</p>
                    <p className="library-notice-item-time">{timeAgo(notice.createdAt)}</p>
                    {notice.kind === 'incoming' && notice.friendshipId ? (
                      <div className="friend-toast-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={busyId === notice.id}
                          onClick={() => void handleRespond(notice, 'accepted')}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={busyId === notice.id}
                          onClick={() => void handleRespond(notice, 'declined')}
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
                    onClick={() => userId && removeNotice(userId, notice.id)}
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
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
