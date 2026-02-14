import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Database,
  Users,
  Terminal,
  ScrollText,
  ChevronRight,
  Table2,
} from 'lucide-react'
import type { TableInfo } from '@/lib/api'

type Props = {
  tables: TableInfo[]
  collapsed?: boolean
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/logs', icon: ScrollText, label: 'Audit Logs' },
  { to: '/sql', icon: Terminal, label: 'SQL Runner' },
]

export function Sidebar({ tables, collapsed }: Props) {
  return (
    <aside
      className={cn(
        'h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col',
        'transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-zinc-800">
        <Database className="w-5 h-5 text-brand shrink-0" />
        {!collapsed && (
          <span className="ml-2 font-semibold text-zinc-100 truncate">
            Admin Panel
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </div>

        {/* Tables */}
        {tables.length > 0 && (
          <div className="mt-4">
            {!collapsed && (
              <div className="px-4 py-1 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Tables ({tables.length})
              </div>
            )}
            <div className="px-2 mt-1 space-y-0.5">
              {tables.map((t) => (
                <NavLink
                  key={t.table_name}
                  to={`/tables/${t.table_name}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-brand/10 text-brand'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    )
                  }
                >
                  <Table2 className="w-3.5 h-3.5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate">{t.table_name}</span>
                      <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  )
}
