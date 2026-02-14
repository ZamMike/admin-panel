import { useState, useEffect } from 'react'
import { Users as UsersIcon, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import { cn, relativeTime } from '@/lib/utils'

type UserApproval = {
  id: string
  email: string
  display_name: string
  provider: string
  status: string
  created_at: string
  updated_at: string
}

export function UsersPage() {
  const [users, setUsers] = useState<UserApproval[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchUsers() {
    try {
      const result = await api.getTableData('user_approvals', { limit: 100 })
      setUsers(result.data as unknown as UserApproval[])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load users'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function handleStatusChange(email: string, newStatus: string) {
    const user = users.find((u) => u.email === email)
    if (!user) return

    try {
      await api.updateRow('user_approvals', user.id, { status: newStatus })
      toast(`User ${email} → ${newStatus}`, 'success')
      fetchUsers()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Update failed'
      toast(msg, 'error')
    }
  }

  const statusStyles: Record<string, string> = {
    approved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    denied: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
          <UsersIcon className="w-4 h-4 text-brand" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-[var(--th-text)]">Users</h1>
          <span className="text-xs text-[var(--th-text-muted)]">{users.length} total</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--th-text-muted)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand text-sm font-bold shrink-0">
                  {(user.display_name || user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--th-text)] text-sm truncate">
                      {user.display_name || user.email}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--th-text-muted)] block truncate">{user.email}</span>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border shrink-0',
                  statusStyles[user.status] || 'text-[var(--th-text-secondary)] bg-surface-hover'
                )}>
                  {user.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] text-[var(--th-text-muted)]">
                  <span>{user.provider}</span>
                  <span>{relativeTime(user.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {user.status !== 'approved' && (
                    <button
                      onClick={() => handleStatusChange(user.email, 'approved')}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {user.status !== 'denied' && (
                    <button
                      onClick={() => handleStatusChange(user.email, 'denied')}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      Deny
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="col-span-full text-center py-16 text-[var(--th-text-muted)]">
              <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
