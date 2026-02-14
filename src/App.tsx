import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'
import { Login } from '@/pages/Login'
import { ToastContainer } from '@/components/ui/Toast'
import { SearchDialog } from '@/components/ui/SearchDialog'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import type { User } from '@supabase/supabase-js'

// Lazy load pages for code-splitting
const Dashboard = lazy(() => import('@/pages/Dashboard').then(m => ({ default: m.Dashboard })))
const TableView = lazy(() => import('@/pages/TableView').then(m => ({ default: m.TableView })))
const UsersPage = lazy(() => import('@/pages/Users').then(m => ({ default: m.UsersPage })))
const SqlRunner = lazy(() => import('@/pages/SqlRunner').then(m => ({ default: m.SqlRunner })))
const AuditLogs = lazy(() => import('@/pages/AuditLogs').then(m => ({ default: m.AuditLogs })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppRoutes({ user }: { user: User | null }) {
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)

  // Auto-logout after 24h inactivity
  useSessionTimeout()

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl+K — global search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      setSearchOpen(true)
    }
    // Esc — close search
    if (e.key === 'Escape') {
      setSearchOpen(false)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <>
      <ToastContainer />
      {user && (
        <SearchDialog
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigate={(path) => {
            navigate(path)
            setSearchOpen(false)
          }}
        />
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          {user ? (
            <Route element={<AppLayout user={user} />}>
              <Route index element={<Dashboard />} />
              <Route path="tables/:name" element={<TableView />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="sql" element={<SqlRunner />} />
              <Route path="logs" element={<AuditLogs />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} />
    </BrowserRouter>
  )
}
