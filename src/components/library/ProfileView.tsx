import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { FRIENDS_CHANGED_EVENT, countFriends } from '../../lib/friends'
import { countPlayedGames } from '../../lib/playedGames'
import {
  fileToAvatarDataUrl,
  fileToBannerDataUrl,
  getAvatarUrl,
  getBannerUrl,
  getBio,
  getDisplayName,
  getInitials,
} from '../../lib/userDisplay'
import { ActivityHeatmap } from './ActivityHeatmap'

export function ProfileView() {
  const { user, updateProfile } = useAuth()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const usernameId = useId()
  const bioId = useId()

  const email = user?.email ?? ''
  const currentUsername =
    (user?.user_metadata?.username as string | undefined) ?? ''
  const currentAvatar = getAvatarUrl(user)
  const currentBanner = getBannerUrl(user)
  const currentBio = getBio(user)
  const displayName = getDisplayName(email || 'Player', currentUsername)

  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(currentUsername || displayName)
  const [bio, setBio] = useState(currentBio)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatar)
  const [bannerPreview, setBannerPreview] = useState<string | null>(currentBanner)
  const [avatarDirty, setAvatarDirty] = useState(false)
  const [bannerDirty, setBannerDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [friendCount, setFriendCount] = useState(0)
  const [gamesPlayedCount, setGamesPlayedCount] = useState(0)

  useEffect(() => {
    if (editing) return
    setUsername(currentUsername || displayName)
    setBio(currentBio)
    setAvatarPreview(currentAvatar)
    setBannerPreview(currentBanner)
    setAvatarDirty(false)
    setBannerDirty(false)
  }, [
    editing,
    currentUsername,
    currentAvatar,
    currentBanner,
    currentBio,
    displayName,
  ])

  useEffect(() => {
    if (!user?.id) {
      setFriendCount(0)
      setGamesPlayedCount(0)
      return
    }

    let cancelled = false
    const loadCounts = () => {
      void countFriends(user.id).then(({ count }) => {
        if (!cancelled) setFriendCount(count)
      })
      void countPlayedGames(user.id).then(({ count }) => {
        if (!cancelled) setGamesPlayedCount(count)
      })
    }

    loadCounts()
    window.addEventListener(FRIENDS_CHANGED_EVENT, loadCounts)

    return () => {
      cancelled = true
      window.removeEventListener(FRIENDS_CHANGED_EVENT, loadCounts)
    }
  }, [user?.id, editing])

  const resetDraft = () => {
    setUsername(currentUsername || displayName)
    setBio(currentBio)
    setAvatarPreview(currentAvatar)
    setBannerPreview(currentBanner)
    setAvatarDirty(false)
    setBannerDirty(false)
    setError(null)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
    if (bannerInputRef.current) bannerInputRef.current.value = ''
  }

  const enterEdit = () => {
    resetDraft()
    setEditing(true)
  }

  const cancelEdit = () => {
    resetDraft()
    setEditing(false)
  }

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      setAvatarPreview(dataUrl)
      setAvatarDirty(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read image.')
    }
  }

  const handleBannerFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const dataUrl = await fileToBannerDataUrl(file)
      setBannerPreview(dataUrl)
      setBannerDirty(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read image.')
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const updates: {
      username?: string
      avatar?: string | null
      banner?: string | null
      bio?: string
    } = {}

    const nextUsername = username.trim()
    if (nextUsername !== currentUsername) {
      updates.username = nextUsername
    }
    if (bio.trim() !== currentBio.trim()) {
      updates.bio = bio
    }
    if (avatarDirty) updates.avatar = avatarPreview
    if (bannerDirty) updates.banner = bannerPreview

    if (Object.keys(updates).length === 0) {
      setSaving(false)
      setEditing(false)
      return
    }

    const { error: updateError } = await updateProfile(updates)
    setSaving(false)

    if (updateError) {
      setError(updateError)
      return
    }

    setAvatarDirty(false)
    setBannerDirty(false)
    setEditing(false)
  }

  const shownName = editing
    ? username.trim() || displayName
    : currentUsername || displayName
  const shownBio = editing
    ? bio.trim() || 'No about me yet — add one below.'
    : currentBio.trim() || 'No about me yet — open Edit profile to add one.'
  const shownAvatar = editing ? avatarPreview : currentAvatar
  const shownBanner = editing ? bannerPreview : currentBanner

  return (
    <section
      className={`profile-view library-content--enter${editing ? ' profile-view--editing' : ''}`}
      aria-labelledby="profile-view-title"
    >
      <div className="profile-hero">
        <div
          className={`profile-banner${shownBanner ? '' : ' profile-banner--empty'}`}
        >
          <div className="profile-banner-media">
            {shownBanner ? (
              <img src={shownBanner} alt="" className="profile-banner-img" />
            ) : null}
            <div className="profile-banner-shade" aria-hidden="true" />
          </div>

          {!editing ? (
            <div className="profile-edit-anchor">
              <button
                type="button"
                className="profile-edit-btn"
                onClick={enterEdit}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M11.5 2.5l2 2L5.5 12.5H3.5v-2L11.5 2.5z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit profile
              </button>
            </div>
          ) : null}

          <div className="profile-hero-body">
            <div className="profile-hero-identity">
              <div className="profile-hero-avatar" aria-hidden="true">
                {shownAvatar ? (
                  <img src={shownAvatar} alt="" />
                ) : (
                  <span>{getInitials(shownName)}</span>
                )}
              </div>

              <div className="profile-hero-copy">
                <h2 id="profile-view-title" className="profile-hero-name">
                  {shownName}
                </h2>
                <p className="profile-hero-about-label">About me</p>
                <p className="profile-hero-about">{shownBio}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!editing ? (
        <>
          <div className="profile-stats" aria-label="Profile stats">
            <div className="profile-stat">
              <span className="profile-stat-label">Friends</span>
              <span className="profile-stat-value">{friendCount}</span>
            </div>
            <div className="profile-stat">
              <span className="profile-stat-label">Games played</span>
              <span className="profile-stat-value">{gamesPlayedCount}</span>
            </div>
          </div>

          {user?.id ? <ActivityHeatmap userId={user.id} /> : null}
        </>
      ) : null}

      {editing ? (
        <form
          className="profile-edit-form"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <div className="profile-edit-form-header">
            <h3 className="profile-edit-form-title">Edit profile</h3>
            <p className="profile-edit-form-lead">
              Changes preview above. Apply when you&apos;re done.
            </p>
          </div>

          <div className="profile-edit-grid">
            <div className="profile-edit-section">
              <span className="profile-edit-label">Profile picture</span>
              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  Change photo
                </button>
                {avatarPreview ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setAvatarPreview(null)
                      setAvatarDirty(true)
                      setError(null)
                      if (avatarInputRef.current) avatarInputRef.current.value = ''
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            <div className="profile-edit-section">
              <span className="profile-edit-label">Banner</span>
              <div className="profile-edit-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  Change banner
                </button>
                {bannerPreview ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setBannerPreview(null)
                      setBannerDirty(true)
                      setError(null)
                      if (bannerInputRef.current) bannerInputRef.current.value = ''
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor={usernameId}>Username</label>
              <input
                id={usernameId}
                type="text"
                autoComplete="username"
                maxLength={24}
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setError(null)
                }}
              />
            </div>

            <div className="auth-field">
              <label htmlFor={bioId}>About me</label>
              <textarea
                id={bioId}
                className="profile-bio-input"
                maxLength={280}
                rows={3}
                value={bio}
                placeholder="Tell other players a bit about you"
                onChange={(event) => {
                  setBio(event.target.value)
                  setError(null)
                }}
              />
            </div>
          </div>

          {error ? (
            <p className="auth-alert auth-alert--error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="profile-edit-form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Applying…' : 'Apply changes'}
            </button>
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={(event) => {
              void handleAvatarFile(event.target.files?.[0])
            }}
          />
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="visually-hidden"
            onChange={(event) => {
              void handleBannerFile(event.target.files?.[0])
            }}
          />
        </form>
      ) : null}
    </section>
  )
}
