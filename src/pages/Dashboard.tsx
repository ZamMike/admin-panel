import { useState, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { Database, Table2, Rows3, Loader2, ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { TableInfo } from '@/lib/api'

function StatCard({ icon: Icon, label, value, loading, accent }: {
  icon: typeof Database
  label: string
  value: string | number
  loading: boolean
  accent: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', accent)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      {loading ? (
        <div className="skeleton h-8 w-20" />
      ) : (
        <p className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</p>
      )}
    </div>
  )
}

export function Dashboard() {
  const { tables } = useOutletContext<{ tables: TableInfo[] }>()
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getStats()
      .then((stats) => {
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
  const largestTable = Object.entries(rowCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Overview of your Supabase database
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Database}
          label="Tables"
          value={tables.length}
          loading={false}
          accent="bg-brand/10 text-brand"
        />
        <StatCard
          icon={Rows3}
          label="Total Rows"
          value={loading ? '...' : totalRows.toLocaleString()}
          loading={loading}
          accent="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          icon={Table2}
          label="Largest Table"
          value={largestTable ? `${largestTable[0]} (${largestTable[1].toLocaleString()})` : '—'}
          loading={loading}
          accent="bg-amber-500/10 text-amber-400"
        />
      </div>

      {/* Table cards */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-400">All Tables</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {tables.map((t) => (
          <Link
            key={t.table_name}
            to={`/tables/${t.table_name}`}
            className={cn(
              'bg-surface border border-border rounded-xl p-4',
              'hover:border-brand/30 hover:bg-surface-hover transition-all group'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-brand/60" />
                <span className="font-medium text-zinc-200 text-sm group-hover:text-brand-light transition-colors">
                  {t.table_name}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-brand/60 transition-colors" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">{t.columns.length} columns</span>
              <span className="text-xs font-medium text-zinc-400 tabular-nums">
                {loading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  `${(rowCounts[t.table_name] ?? 0).toLocaleString()} rows`
                )}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-16 text-zinc-600">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium">No tables found</p>
          <p className="text-xs mt-1 text-zinc-700">
            Make sure get_table_info() RPC exists in Supabase
          </p>
        </div>
      )}
    </div>
  )
}
