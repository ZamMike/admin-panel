import { useState } from 'react'
import { Terminal, Play, Loader2, Save, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

type SavedQuery = { name: string; sql: string }

function getSavedQueries(): SavedQuery[] {
  try {
    return JSON.parse(localStorage.getItem('admin_saved_queries') || '[]')
  } catch { return [] }
}

function setSavedQueries(queries: SavedQuery[]) {
  localStorage.setItem('admin_saved_queries', JSON.stringify(queries))
}

export function SqlRunner() {
  const [sql, setSql] = useState('SELECT * FROM user_approvals LIMIT 10;')
  const [result, setResult] = useState<{ columns: string[]; rows: unknown[][] } | null>(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const [saved, setSaved] = useState<SavedQuery[]>(getSavedQueries)

  async function handleRun() {
    if (!sql.trim()) return
    setRunning(true)
    setError('')
    setResult(null)

    try {
      const data = await api.runSql(sql)
      setResult(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Query failed'
      setError(msg)
    } finally {
      setRunning(false)
    }
  }

  function handleSave() {
    const name = prompt('Query name:')
    if (!name) return
    const next = [...saved, { name, sql }]
    setSaved(next)
    setSavedQueries(next)
    toast('Query saved', 'success')
  }

  function handleDeleteSaved(idx: number) {
    const next = saved.filter((_, i) => i !== idx)
    setSaved(next)
    setSavedQueries(next)
  }

  function handleLoadSaved(q: SavedQuery) {
    setSql(q.sql)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-brand" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">SQL Runner</h1>
          <span className="text-xs text-zinc-600">Read-only queries</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main area */}
        <div className="lg:col-span-3 space-y-3">
          {/* Editor */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Query</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-surface-hover transition-colors"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={handleRun}
                  disabled={running || !sql.trim()}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-medium',
                    'bg-brand hover:bg-brand-dark text-white',
                    'disabled:opacity-50 transition-colors'
                  )}
                >
                  {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Run
                </button>
              </div>
            </div>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault()
                  handleRun()
                }
              }}
              rows={8}
              className={cn(
                'w-full px-4 py-3 bg-transparent',
                'text-sm text-zinc-100 font-mono resize-y',
                'focus:outline-none',
                'placeholder-zinc-700'
              )}
              placeholder="SELECT * FROM ..."
              spellCheck={false}
            />
          </div>

          {/* Ctrl+Enter hint */}
          <p className="text-[11px] text-zinc-700">Press Ctrl+Enter to execute</p>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-mono">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-surface border-b border-border text-[11px] text-zinc-500 font-medium">
                {result.rows.length} rows returned
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm table-striped">
                  <thead>
                    <tr className="bg-surface">
                      {result.columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left text-[11px] font-semibold text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-t border-border/50 hover:bg-surface-hover">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-1.5 whitespace-nowrap">
                            {cell === null ? (
                              <span className="text-zinc-700 italic text-xs">null</span>
                            ) : (
                              <span className="text-zinc-300 font-mono text-xs">{String(cell)}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Saved queries */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider px-1">
            Saved ({saved.length})
          </h3>
          {saved.map((q, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-lg p-3 cursor-pointer hover:border-border-light group transition-colors"
              onClick={() => handleLoadSaved(q)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-300 font-medium">{q.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSaved(i) }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-hover rounded-md text-zinc-600 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-600 font-mono truncate">{q.sql}</p>
            </div>
          ))}
          {saved.length === 0 && (
            <p className="text-[11px] text-zinc-700 px-1">No saved queries yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
