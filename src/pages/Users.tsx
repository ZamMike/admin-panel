import { useState, useEffect } from 'react'
import { Users as UsersIcon, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import { cn, formatDate } from '@/lib/utils'

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

  const statusColor: Record<string, string> = {
    approved: 'text-green-400 bg-green-900/30 border-green-800/40',
    pending: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/40',
    denied: 'text-red-400 bg-red-900/30 border-red-800/40',
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <UsersIcon className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold text-zinc-100">Users</h1>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
          {users.length}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm font-bold shrink-0">
                {(user.display_name || user.email)[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-100 text-sm truncate">
                    {user.display_name || user.email}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium border',
                    statusColor[user.status] || 'text-zinc-400 bg-zinc-800'
                  )}>
                    {user.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-zinc-500">{user.email}</span>
                  <span className="text-xs text-zinc-600">{user.provider}</span>
                  <span className="text-xs text-zinc-600">{formatDate(user.created_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {user.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusChange(user.email, 'approved')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/40 hover:bg-green-900/50 transition-colors"
                  >
                    Approve
                  </button>
                )}
                {user.status !== 'denied' && (
                  <button
                    onClick={() => handleStatusChange(user.email, 'denied')}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-900/50 transition-colors"
                  >
                    Deny
                  </button>
                )}
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
