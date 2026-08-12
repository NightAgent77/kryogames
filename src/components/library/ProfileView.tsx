import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  fileToAvatarDataUrl,
  getAvatarUrl,
  getDisplayName,
  getInitials,
} from '../../lib/userDisplay'

interface ProfileViewProps {
  onBack: () => void
}

export function ProfileView({ onBack }: ProfileViewProps) {
  const { user, updateProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const usernameId = useId()
  const emailId = useId()

  const email = user?.email ?? ''
  const currentUsername =
    (user?.user_metadata?.username as string | undefined) ?? ''
  const currentAvatar = getAvatarUrl(user)
  const displayName = getDisplayName(email || 'Player', currentUsername)

  const [username, setUsername] = useState(currentUsername || displayName)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatar)
  const [avatarDirty, setAvatarDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    setUsername(currentUsername || displayName)
    if (!avatarDirty) {
      setAvatarPreview(currentAvatar)
    }
  }, [currentUsername, currentAvatar, displayName, avatarDirty])

  const handlePickPhoto = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setSuccess(null)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      setAvatarPreview(dataUrl)
      setAvatarDirty(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read image.')
    }
  }

  const handleRemovePhoto = () => {
    setAvatarPreview(null)
    setAvatarDirty(true)
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    const updates: { username?: string; avatar?: string | null } = {}
    const nextUsername = username.trim()
    if (nextUsername !== currentUsername) {
      updates.username = nextUsername
    }
    if (avatarDirty) {
      updates.avatar = avatarPreview
    }

    if (Object.keys(updates).length === 0) {
      setSuccess('No changes to save.')
      setSaving(false)
      return
    }

    const { error: updateError } = await updateProfile(updates)
    setSaving(false)

    if (updateError) {
      setError(updateError)
      return
    }

    setAvatarDirty(false)
    setSuccess('Profile updated.')
  }

  return (
    <section
      className="profile-view library-content--enter"
      aria-labelledby="profile-view-title"
    >
      <button type="button" className="game-detail-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M10 3L5 8l5 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      <div className="profile-card">
        <header className="profile-card-header">
          <p className="profile-card-kicker">Your account</p>
          <h2 id="profile-view-title" className="profile-card-title">
            Profile
          </h2>
          <p className="profile-card-lead">
            Update how you appear across KryoGames.
          </p>
        </header>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-avatar-block">
            <div className="profile-avatar-preview" aria-hidden="true">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" />
              ) : (
                <span>{getInitials(username.trim() || displayName)}</span>
              )}
            </div>

            <div className="profile-avatar-actions">
              <p className="profile-avatar-label">Profile picture</p>
              <p className="profile-avatar-hint">JPG or PNG, under 2 MB.</p>
              <div className="profile-avatar-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handlePickPhoto}
                >
                  Change photo
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleRemovePhoto}
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="visually-hidden"
                onChange={(event) => {
                  void handleFileChange(event.target.files?.[0])
                }}
              />
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
                setSuccess(null)
              }}
            />
          </div>

          <div className="auth-field">
            <label htmlFor={emailId}>Email</label>
            <input id={emailId} type="email" value={email} disabled readOnly />
          </div>

          {error && (
            <p className="auth-alert auth-alert--error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="auth-alert auth-alert--success" role="status">
              {success}
            </p>
          )}

          <div className="profile-form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
