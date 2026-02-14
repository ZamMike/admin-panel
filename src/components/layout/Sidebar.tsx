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
  currentPath: string
  onNavigate: (path: string) => void
}

const mainNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/logs', icon: ScrollText, label: 'Audit Logs' },
  { to: '/sql', icon: Terminal, label: 'SQL Runner' },
]

export function Sidebar({ tables, collapsed, onToggle, currentPath, onNavigate }: Props) {
  function isActive(path: string, exact = false) {
    return exact ? currentPath === path : currentPath.startsWith(path)
  }

  return (
    <aside
      className={cn(
        'h-screen border-r border-border flex flex-col shrink-0',
        'transition-all duration-200 ease-out',
        collapsed ? 'w-[60px]' : 'w-[260px]'
      )}
      style={{ background: 'var(--th-sidebar)' }}
    >
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
            <Database className="w-3.5 h-3.5 text-brand" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sm truncate" style={{ color: 'var(--th-text)' }}>
              Admin Panel
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            'p-1 rounded-md text-[var(--th-text-muted)] hover:text-[var(--th-text)] hover:bg-surface-hover transition-colors',
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
            <span className="text-[10px] font-semibold text-[var(--th-text-muted)] uppercase tracking-[0.1em]">
              Main
            </span>
          </div>
        )}
        <div className="px-2 space-y-0.5">
          {mainNav.map(({ to, icon: Icon, label }) => {
            const active = to === '/' ? currentPath === '/' : currentPath.startsWith(to)
            return (
              <button
                key={to}
                onClick={() => onNavigate(to)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-left',
                  active
                    ? 'bg-brand/10 text-brand-light'
                    : 'text-[var(--th-text-secondary)] hover:text-[var(--th-text)] hover:bg-surface-hover'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && label}
              </button>
            )
          })}
        </div>

        {/* Tables section */}
        {tables.length > 0 && (
          <div className="mt-5">
            {!collapsed && (
              <div className="px-4 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[var(--th-text-muted)] uppercase tracking-[0.1em]">
                  Tables
                </span>
                <span className="text-[10px] text-[var(--th-text-muted)] tabular-nums">
                  {tables.length}
                </span>
              </div>
            )}
            <div className="px-2 space-y-0.5">
              {tables.map((t) => {
                const path = `/tables/${t.table_name}`
                const active = isActive(path)
                return (
                  <button
                    key={t.table_name}
                    onClick={() => onNavigate(path)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-all text-left',
                      active
                        ? 'bg-brand/10 text-brand-light'
                        : 'text-[var(--th-text-secondary)] hover:text-[var(--th-text)] hover:bg-surface-hover'
                    )}
                  >
                    <Table2 className="w-3.5 h-3.5 shrink-0" />
                    {!collapsed && (
                      <span className="truncate">{t.table_name}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom: keyboard shortcut hint */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface text-[var(--th-text-muted)] text-xs">
            <Command className="w-3 h-3" />
            <span>Ctrl+K to search</span>
          </div>
        </div>
      )}
    </aside>
  )
}
