import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { LogOut, Search, Sun, Moon } from 'lucide-react'

type Props = {
  onOpenSearch: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Header({ onOpenSearch, theme, onToggleTheme }: Props) {
  const { user } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const initial = (user?.email || 'A')[0].toUpperCase()

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-5" style={{ background: 'var(--th-header)' }}>
      {/* Search trigger */}
      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-light bg-surface text-[var(--th-text-muted)] text-sm hover:border-[var(--th-border-light)] transition-colors w-64"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--th-bg)] text-[var(--th-text-muted)] border border-border">
          Ctrl K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-[var(--th-text-secondary)] hover:text-brand hover:bg-surface-hover transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <span className="text-sm text-[var(--th-text-secondary)]">{user?.email}</span>
        <div className="w-7 h-7 rounded-full bg-brand/15 flex items-center justify-center text-brand text-xs font-semibold">
          {initial}
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-[var(--th-text-secondary)] hover:text-red-400 hover:bg-surface-hover transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
