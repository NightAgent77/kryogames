import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { upsertProfileFromUser } from '../lib/friends'
import { isSupabaseConfigured, supabase, supabaseConfigError } from '../lib/supabase'
import { getSiteUrl } from '../lib/siteUrl'

interface AuthResult {
  error: string | null
}

interface SignUpResult extends AuthResult {
  needsConfirmation: boolean
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    username: string,
  ) => Promise<SignUpResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
  updateProfile: (updates: {
    username?: string
    avatar?: string | null
  }) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function formatAuthError(message: string) {
  if (message.includes('Invalid login credentials')) {
    return 'Incorrect email or password.'
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists.'
  }
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      if (!isSupabaseConfigured) {
        return { error: supabaseConfigError, needsConfirmation: false }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })

      if (error) {
        return { error: formatAuthError(error.message), needsConfirmation: false }
      }

      if (data.user && data.session) {
        await upsertProfileFromUser(data.user)
      }

      return {
        error: null,
        needsConfirmation: !data.session,
      }
    },
    [],
  )

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: supabaseConfigError }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { error: formatAuthError(error.message) }
    }

    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: supabaseConfigError }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getSiteUrl()}/`,
    })

    if (error) {
      return { error: formatAuthError(error.message) }
    }

    return { error: null }
  }, [])

  const updateProfile = useCallback(
    async (updates: { username?: string; avatar?: string | null }) => {
      if (!isSupabaseConfigured) {
        return { error: supabaseConfigError }
      }

      const data: Record<string, unknown> = {}

      if (updates.username !== undefined) {
        const username = updates.username.trim()
        if (username.length < 2) {
          return { error: 'Username must be at least 2 characters.' }
        }
        if (username.length > 24) {
          return { error: 'Username must be 24 characters or fewer.' }
        }
        data.username = username
      }

      if (updates.avatar !== undefined) {
        data.avatar = updates.avatar
      }

      if (Object.keys(data).length === 0) {
        return { error: null }
      }

      const { data: result, error } = await supabase.auth.updateUser({ data })

      if (error) {
        return { error: formatAuthError(error.message) }
      }

      if (result.user) {
        setUser(result.user)
        const sync = await upsertProfileFromUser(result.user)
        if (sync.error) {
          return { error: sync.error }
        }
      }

      return { error: null }
    },
    [],
  )

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updateProfile,
    }),
    [user, session, loading, signUp, signIn, signOut, resetPassword, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
