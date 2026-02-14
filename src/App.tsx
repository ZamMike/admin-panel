import { useState, useEffect } from 'react'
import { BrowserRouter, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { TableView } from '@/pages/TableView'
import { UsersPage } from '@/pages/Users'
import { SqlRunner } from '@/pages/SqlRunner'
import { AuditLogs } from '@/pages/AuditLogs'
import { ToastContainer } from '@/components/ui/Toast'
import { SearchDialog } from '@/components/ui/SearchDialog'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { api } from '@/lib/api'
import type { TableInfo } from '@/lib/api'

function Shell() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in → show login (or redirect to /login)
  if (!user) {
    if (location.pathname !== '/login') return <Navigate to="/login" replace />
    return <Login />
  }

  // Logged in but on /login → redirect home
  if (location.pathname === '/login') return <Navigate to="/" replace />

  return <AuthenticatedApp />
}

function AuthenticatedApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useSessionTimeout()

  useEffect(() => {
    api.getTables().then(setTables).catch(console.error)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Manual route matching — no Outlet, no useParams
  const tableMatch = location.pathname.match(/^\/tables\/(.+)$/)

  let page: React.ReactNode
  if (tableMatch) {
    const tableName = decodeURIComponent(tableMatch[1])
    page = <TableView tableName={tableName} tables={tables} key={tableName} />
  } else if (location.pathname === '/users') {
    page = <UsersPage />
  } else if (location.pathname === '/sql') {
    page = <SqlRunner />
  } else if (location.pathname === '/logs') {
    page = <AuditLogs />
  } else {
    page = <Dashboard />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <Sidebar
        tables={tables}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-auto p-6">
          {page}
        </main>
      </div>
      <ToastContainer />
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(path) => {
          navigate(path)
          setSearchOpen(false)
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  )
}
