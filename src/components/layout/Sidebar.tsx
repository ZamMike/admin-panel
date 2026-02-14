import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Database,
  Users,
  Terminal,
  ScrollText,
  Table2,
  ChevronLeft,
  Command,
} from 'lucide-react'
import type { TableInfo } from '@/lib/api'

type Props = {
  tables: TableInfo[]
  collapsed: boolean
  onToggle: () => void
}

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/logs', icon: ScrollText, label: 'Audit Logs' },
  { to: '/sql', icon: Terminal, label: 'SQL Runner' },
]

export function Sidebar({ tables, collapsed, onToggle }: Props) {
  return (
    <aside
      className={cn(
        'h-screen bg-sidebar border-r border-border flex flex-col shrink-0',
        'transition-all duration-200 ease-out',
        collapsed ? 'w-[60px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
            <Database className="w-3.5 h-3.5 text-brand" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm text-zinc-100 truncate">
              Admin Panel
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            'p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-surface-hover transition-colors',
            collapsed && 'mx-auto'
          )}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {!collapsed && (
          <div className="px-4 mb-1.5">
            <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.1em]">
              Main
            </span>
          </div>
        )}
        <div className="px-2 space-y-0.5">
          {mainNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all',
                  isActive
                    ? 'bg-brand/10 text-brand-light'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-surface-hover'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </div>

        {/* Tables section */}
        {tables.length > 0 && (
          <div className="mt-5">
            {!collapsed && (
              <div className="px-4 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-[0.1em]">
                  Tables
                </span>
                <span className="text-[10px] text-zinc-700 tabular-nums">
                  {tables.length}
                </span>
              </div>
            )}
            <div className="px-2 space-y-0.5">
              {tables.map((t) => (
                <NavLink
                  key={t.table_name}
                  to={`/tables/${t.table_name}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all',
                      isActive
                        ? 'bg-brand/10 text-brand-light'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-surface-hover'
                    )
                  }
                >
                  <Table2 className="w-3.5 h-3.5 shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{t.table_name}</span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom: keyboard shortcut hint */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface text-zinc-600 text-xs">
            <Command className="w-3 h-3" />
            <span>Ctrl+K to search</span>
          </div>
        </div>
      )}
    </aside>
  )
}
