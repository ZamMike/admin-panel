import { useState, useEffect } from 'react'
import { ScrollText, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import { cn, formatDate } from '@/lib/utils'

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

  const actionColor: Record<string, string> = {
    INSERT: 'text-green-400 bg-green-900/30',
    UPDATE: 'text-blue-400 bg-blue-900/30',
    DELETE: 'text-red-400 bg-red-900/30',
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ScrollText className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold text-zinc-100">Audit Logs</h1>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
          {logs.length}
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs bg-zinc-900 border border-zinc-700 text-zinc-300"
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
          className="px-3 py-1.5 rounded-lg text-xs bg-zinc-900 border border-zinc-700 text-zinc-300 placeholder-zinc-600 w-48 focus:outline-none focus:border-zinc-600"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors"
              >
                <span className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                  actionColor[log.action] || 'text-zinc-400 bg-zinc-800'
                )}>
                  {log.action}
                </span>
                <span className="text-sm text-zinc-200 font-medium">
                  {log.table_name}
                </span>
                {log.row_id && (
                  <span className="text-xs text-zinc-500">#{log.row_id}</span>
                )}
                <span className="ml-auto text-xs text-zinc-500">
                  {formatDate(log.created_at)}
                </span>
                <span className="text-xs text-zinc-600">{log.ip_address}</span>
              </button>

              {expanded === log.id && (
                <div className="px-4 pb-3 border-t border-zinc-800 grid grid-cols-2 gap-3">
                  {log.old_data && (
                    <div>
                      <p className="text-[10px] text-red-400 uppercase font-medium mt-2 mb-1">Old Data</p>
                      <pre className="text-xs text-zinc-400 bg-zinc-800/50 p-2 rounded overflow-x-auto max-h-48">
                        {JSON.stringify(log.old_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.new_data && (
                    <div>
                      <p className="text-[10px] text-green-400 uppercase font-medium mt-2 mb-1">New Data</p>
                      <pre className="text-xs text-zinc-400 bg-zinc-800/50 p-2 rounded overflow-x-auto max-h-48">
                        {JSON.stringify(log.new_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No audit logs yet</p>
              <p className="text-xs mt-1">Logs will appear after CRUD operations</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
