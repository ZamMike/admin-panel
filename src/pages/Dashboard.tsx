import { useState, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { Database, Table2, Rows3, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import type { TableInfo } from '@/lib/api'

export function Dashboard() {
  const { tables } = useOutletContext<{ tables: TableInfo[] }>()
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStats()
      .then((stats) => {
        // Parse row counts — keys may be "public.table_name" or just "table_name"
        const counts: Record<string, number> = {}
        for (const [key, val] of Object.entries(stats.tables || {})) {
          const name = key.replace('public.', '')
          counts[name] = val
        }
        setRowCounts(counts)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalRows = Object.values(rowCounts).reduce((a, b) => a + b, 0)

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-100 mb-6">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Database className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Tables</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100">{tables.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Rows3 className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Total Rows</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              totalRows.toLocaleString()
            )}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-zinc-400 mb-1">
            <Table2 className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Largest Table</span>
          </div>
          <p className="text-lg font-bold text-zinc-100">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              Object.entries(rowCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
            )}
          </p>
        </div>
      </div>

      {/* Table cards */}
      <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
        All Tables
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((t) => (
          <Link
            key={t.table_name}
            to={`/tables/${t.table_name}`}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-brand/40 hover:bg-zinc-800/50 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <Table2 className="w-4 h-4 text-brand" />
              <span className="font-medium text-zinc-100 text-sm group-hover:text-brand transition-colors">
                {t.table_name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                {t.columns.length} columns
              </p>
              <p className="text-xs font-medium text-zinc-400">
                {loading ? '...' : (rowCounts[t.table_name] ?? 0).toLocaleString()} rows
              </p>
            </div>
          </Link>
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
