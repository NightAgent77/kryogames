import { useEffect, useRef } from 'react'
import { AuthForm, type AuthMode } from './AuthForm'

export type { AuthMode }

interface AuthModalProps {
  mode: AuthMode
  onClose: () => void
  onSwitchMode: (mode: AuthMode) => void
  onSuccess?: () => void
}

export function AuthModal({ mode, onClose, onSwitchMode, onSuccess }: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    dialog.showModal()

    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  return (
    <dialog ref={dialogRef} className="auth-modal" aria-label="Account">
      <div className="auth-modal-shell">
        <div className="auth-modal-panel">
          <button
            type="button"
            className="auth-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>

          <AuthForm
            mode={mode}
            onSwitchMode={onSwitchMode}
            onSuccess={() => {
              onClose()
              onSuccess?.()
            }}
          />
        </div>
      </div>
    </dialog>
  )
}
