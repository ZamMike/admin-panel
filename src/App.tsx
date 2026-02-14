import { createBrowserRouter, RouterProvider, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { TableView } from '@/pages/TableView'
import { UsersPage } from '@/pages/Users'
import { SqlRunner } from '@/pages/SqlRunner'
import { AuditLogs } from '@/pages/AuditLogs'

// Wrapper: forces TableView full remount when :name param changes
function TableViewKeyed() {
  const { name } = useParams()
  return <TableView key={name} />
}

// Auth guard — renders layout or redirects to login
function ProtectedLayout() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <AppLayout />
}

// Login page — redirects to dashboard if already logged in
function LoginGate() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return <Login />
}

// Catch-all — redirect based on auth state
function CatchAll() {
  const { user } = useAuth()
  return <Navigate to={user ? '/' : '/login'} replace />
}

// Static router — created once, stable across re-renders
const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginGate,
  },
  {
    path: '/',
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'tables/:name', Component: TableViewKeyed },
      { path: 'users', Component: UsersPage },
      { path: 'sql', Component: SqlRunner },
      { path: 'logs', Component: AuditLogs },
    ],
  },
  {
    path: '*',
    Component: CatchAll,
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
