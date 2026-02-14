import { useState, useEffect } from 'react'
import { ScrollText, Loader2, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import { cn, relativeTime } from '@/lib/utils'

type AuditEntry = {
  id: string
  admin_email: string
  action: string
  table_name: string
  row_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('')
  const [filterTable, setFilterTable] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    try {
      const filters: Record<string, string> = {}
      if (filterAction) filters.action = filterAction
      if (filterTable) filters.table_name = filterTable

      const result = await api.getTableData('admin_logs', {
        limit: 100,
        sort: 'created_at',
        order: 'desc',
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      })
      setLogs(result.data as unknown as AuditEntry[])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load logs'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAction, filterTable])

  const actionStyles: Record<string, { bg: string; text: string; dot: string }> = {
    INSERT: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    UPDATE: { bg: 'bg-brand/10', text: 'text-brand-light', dot: 'bg-brand' },
    DELETE: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
          <ScrollText className="w-4 h-4 text-brand" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Audit Logs</h1>
          <span className="text-xs text-zinc-600">{logs.length} entries</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs bg-surface border border-border text-zinc-300"
        >
          <option value="">All actions</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input
          type="text"
          placeholder="Filter by table..."
          value={filterTable}
          onChange={(e) => setFilterTable(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs bg-surface border border-border text-zinc-300 placeholder-zinc-700 w-48 focus:outline-none focus:border-brand/40"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => {
            const style = actionStyles[log.action] || { bg: 'bg-surface', text: 'text-zinc-400', dot: 'bg-zinc-500' }
            const isOpen = expanded === log.id

            return (
              <div
                key={log.id}
                className="bg-surface border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover transition-colors"
                >
                  {/* Timeline dot */}
                  <div className={cn('w-2 h-2 rounded-full shrink-0', style.dot)} />

                  {/* Action badge */}
                  <span className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                    style.bg, style.text
                  )}>
                    {log.action}
                  </span>

                  {/* Table + row */}
                  <span className="text-sm text-zinc-200 font-medium">{log.table_name}</span>
                  {log.row_id && (
                    <span className="text-xs text-zinc-600 font-mono">#{log.row_id.slice(0, 8)}</span>
                  )}

                  {/* Time + IP */}
                  <span className="ml-auto text-[11px] text-zinc-600">{relativeTime(log.created_at)}</span>
                  {log.ip_address && (
                    <span className="text-[10px] text-zinc-700 font-mono">{log.ip_address}</span>
                  )}

                  <ChevronDown className={cn(
                    'w-3.5 h-3.5 text-zinc-600 transition-transform',
                    isOpen && 'rotate-180'
                  )} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border grid grid-cols-2 gap-3">
                    {log.old_data && (
                      <div>
                        <p className="text-[10px] text-red-400 uppercase font-semibold mt-3 mb-1.5">Old Data</p>
                        <pre className="text-xs text-zinc-400 bg-[#0a0a0b] border border-border p-3 rounded-lg overflow-x-auto max-h-48 font-mono">
                          {JSON.stringify(log.old_data, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.new_data && (
                      <div>
                        <p className="text-[10px] text-emerald-400 uppercase font-semibold mt-3 mb-1.5">New Data</p>
                        <pre className="text-xs text-zinc-400 bg-[#0a0a0b] border border-border p-3 rounded-lg overflow-x-auto max-h-48 font-mono">
                          {JSON.stringify(log.new_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {logs.length === 0 && (
            <div className="text-center py-16 text-zinc-600">
              <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">No audit logs yet</p>
              <p className="text-xs mt-1 text-zinc-700">Logs will appear after CRUD operations</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
