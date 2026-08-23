import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { HomeView } from './components/HomeView'
import { IntroView } from './components/IntroView'
import { KryoCursor } from './components/KryoCursor'
import { LibraryView } from './components/library/LibraryView'
import { useAuth } from './contexts/AuthContext'
import './App.css'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading" role="status">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <>
        <KryoCursor />
        <div className="app-loading" role="status">
          Loading…
        </div>
      </>
    )
  }

  return (
    <>
      <KryoCursor />
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/login" element={<IntroView />} />
        <Route path="/signup" element={<IntroView />} />
        <Route path="/forgot" element={<IntroView />} />
        <Route
          path="/play"
          element={
            <RequireAuth>
              <LibraryView />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
