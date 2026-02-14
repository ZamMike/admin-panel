import { supabase } from '@/lib/supabase'
import { LogOut, PanelLeftClose, PanelLeft } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

type Props = {
  user: User
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export function Header({ user, sidebarCollapsed, onToggleSidebar }: Props) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
      <button
        onClick={onToggleSidebar}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
      >
        {sidebarCollapsed ? (
          <PanelLeft className="w-4 h-4" />
        ) : (
          <PanelLeftClose className="w-4 h-4" />
        )}
      </button>

      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-400">{user.email}</span>
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
            'text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors'
          )}
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  )
}
