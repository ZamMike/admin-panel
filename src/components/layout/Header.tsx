import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { LogOut, Search } from 'lucide-react'

type Props = {
  onOpenSearch: () => void
}

export function Header({ onOpenSearch }: Props) {
  const { user } = useAuth()

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const initial = (user?.email || 'A')[0].toUpperCase()

  return (
    <header className="h-14 bg-[#0a0a0b] border-b border-border flex items-center justify-between px-5">
      {/* Search trigger */}
      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-light bg-surface text-zinc-500 text-sm hover:border-zinc-600 transition-colors w-64"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-[#0a0a0b] text-zinc-600 border border-border">
          Ctrl K
        </kbd>
      </button>

      {/* User */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500">{user?.email}</span>
        <div className="w-7 h-7 rounded-full bg-brand/15 flex items-center justify-center text-brand text-xs font-semibold">
          {initial}
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-surface-hover transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
