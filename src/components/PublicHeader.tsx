import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './PublicHeader.css'

export function PublicHeader() {
  const { user } = useAuth()

  return (
    <header className="public-header">
      <Link to="/" className="public-brand">
        Home
      </Link>
      {user ? (
        <div className="public-header-actions">
          <Link to="/play" className="btn btn-primary btn-sm">
            Enter library
          </Link>
        </div>
      ) : null}
    </header>
  )
}
