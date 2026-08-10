import { IntroView } from './components/IntroView'
import { LibraryView } from './components/library/LibraryView'
import { useAuth } from './contexts/AuthContext'
import './App.css'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading" role="status">
        Loading…
      </div>
    )
  }

  return user ? <LibraryView /> : <IntroView />
}

export default App
