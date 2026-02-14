import { useOutletContext } from 'react-router-dom'
import { Database } from 'lucide-react'
import type { TableInfo } from '@/lib/api'

export function Dashboard() {
  const { tables } = useOutletContext<{ tables: TableInfo[] }>()

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((t) => (
          <div
            key={t.table_name}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-brand" />
              <span className="font-medium text-zinc-100 text-sm">
                {t.table_name}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              {t.columns.length} columns
            </p>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Loading tables...</p>
          <p className="text-xs mt-1">Make sure the API is configured and get_table_info() RPC exists in Supabase</p>
        </div>
      )}
    </div>
  )
}
