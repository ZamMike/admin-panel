import { useState, useEffect, useRef } from 'react'
import { Search, Table2, LayoutDashboard, Users, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { TableInfo } from '@/lib/api'

type Props = {
  open: boolean
  onClose: () => void
  onNavigate: (path: string) => void
}

type SearchItem = {
  label: string
  path: string
  icon: typeof Table2
  type: 'page' | 'table'
}

const staticItems: SearchItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, type: 'page' },
  { label: 'Users', path: '/users', icon: Users, type: 'page' },
  { label: 'SQL Runner', path: '/sql', icon: Terminal, type: 'page' },
]

export function SearchDialog({ open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('')
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      inputRef.current?.focus()
      // Load tables
      api.getTables().then(setTables).catch(() => {})
    }
  }, [open])

  const allItems: SearchItem[] = [
    ...staticItems,
    ...tables.map((t) => ({
      label: t.table_name,
      path: `/tables/${t.table_name}`,
      icon: Table2,
      type: 'table' as const,
    })),
  ]

  const filtered = query
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : allItems

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        onNavigate(filtered[selectedIndex].path)
      }
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tables, pages..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-500 border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  i === selectedIndex
                    ? 'bg-brand/10 text-brand'
                    : 'text-zinc-300 hover:bg-zinc-800'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                <span className="ml-auto text-xs text-zinc-600">{item.type}</span>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="px-4 py-3 text-sm text-zinc-500 text-center">No results</p>
          )}
        </div>
      </div>
    </div>
  )
}
