import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { api } from '@/lib/api'
import { ToastContainer } from '@/components/ui/Toast'
import { SearchDialog } from '@/components/ui/SearchDialog'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import type { TableInfo } from '@/lib/api'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tables, setTables] = useState<TableInfo[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Auto-logout after 24h inactivity
  useSessionTimeout()

  useEffect(() => {
    api.getTables().then(setTables).catch(console.error)
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
          <Outlet key={location.pathname} context={{ tables }} />
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
