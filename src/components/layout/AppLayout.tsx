import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { api } from '@/lib/api'
import type { TableInfo } from '@/lib/api'
import type { User } from '@supabase/supabase-js'

type Props = {
  user: User
}

export function AppLayout({ user }: Props) {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    api.getTables().then(setTables).catch(console.error)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar tables={tables} collapsed={collapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={user}
          sidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed(!collapsed)}
        />
        <main className="flex-1 overflow-auto p-6">
          <Outlet context={{ tables }} />
        </main>
      </div>
    </div>
  )
}
