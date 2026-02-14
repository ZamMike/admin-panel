import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { Login } from '@/pages/Login'

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Auth guard — renders layout or redirects to login
function ProtectedLayout() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <AppLayout />
}

// Login page — redirects to dashboard if already logged in
function LoginGate() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to="/" replace />
  return <Login />
}

// Catch-all — redirect based on auth state
function CatchAll() {
  const { user } = useAuth()
  return <Navigate to={user ? '/' : '/login'} replace />
}

// Static router — created once, never re-created on re-renders
const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginGate,
  },
  {
    Component: ProtectedLayout,
    children: [
      {
        index: true,
        lazy: () => import('@/pages/Dashboard').then(m => ({ Component: m.Dashboard })),
      },
      {
        path: 'tables/:name',
        lazy: () => import('@/pages/TableView').then(m => ({ Component: m.TableView })),
      },
      {
        path: 'users',
        lazy: () => import('@/pages/Users').then(m => ({ Component: m.UsersPage })),
      },
      {
        path: 'sql',
        lazy: () => import('@/pages/SqlRunner').then(m => ({ Component: m.SqlRunner })),
      },
      {
        path: 'logs',
        lazy: () => import('@/pages/AuditLogs').then(m => ({ Component: m.AuditLogs })),
      },
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
