import { Users as UsersIcon } from 'lucide-react'

export function UsersPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <UsersIcon className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold text-zinc-100">Users</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
        <p>User activity monitoring — Phase 5</p>
      </div>
    </div>
  )
}
