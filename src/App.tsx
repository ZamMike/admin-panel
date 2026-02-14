import { useState, useEffect, useCallback } from 'react'
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
import { useTheme } from '@/hooks/useTheme'
import { api } from '@/lib/api'
import type { TableInfo } from '@/lib/api'

function Shell() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--th-bg)' }}>
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Login />

  return <AuthenticatedApp />
}

function AuthenticatedApp() {
  const [path, setPath] = useState(window.location.pathname)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme, toggle: toggleTheme } = useTheme()

  useSessionTimeout()

  const navigate = useCallback((to: string) => {
    window.history.pushState(null, '', to)
    setPath(to)
  }, [])

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    api.getTables().then(setTables).catch(console.error)
  }, [])

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

  const tableMatch = path.match(/^\/tables\/(.+)$/)

  let page: React.ReactNode
  if (tableMatch) {
    const tableName = decodeURIComponent(tableMatch[1])
    page = <TableView tableName={tableName} tables={tables} key={tableName} />
  } else if (path === '/users') {
    page = <UsersPage />
  } else if (path === '/sql') {
    page = <SqlRunner />
  } else if (path === '/logs') {
    page = <AuditLogs />
  } else {
    page = <Dashboard tables={tables} onNavigate={navigate} />
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--th-bg)' }}>
      <Sidebar
        tables={tables}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        currentPath={path}
        onNavigate={navigate}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onOpenSearch={() => setSearchOpen(true)} theme={theme} onToggleTheme={toggleTheme} />
        <main className="flex-1 overflow-auto p-6">
          {page}
        </main>
      </div>
      <ToastContainer />
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(p) => {
          navigate(p)
          setSearchOpen(false)
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
