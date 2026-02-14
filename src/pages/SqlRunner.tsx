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
      <div className="flex items-center gap-2 mb-6">
        <Terminal className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold text-zinc-100">SQL Runner</h1>
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
          Read-only
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main area */}
        <div className="lg:col-span-3 space-y-3">
          {/* Editor */}
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                handleRun()
              }
            }}
            rows={6}
            className={cn(
              'w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700',
              'text-sm text-zinc-100 font-mono resize-y',
              'focus:outline-none focus:border-brand'
            )}
            placeholder="SELECT * FROM ..."
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              disabled={running || !sql.trim()}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium',
                'bg-brand hover:bg-brand-dark text-white',
                'disabled:opacity-50 transition-colors'
              )}
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run (Ctrl+Enter)
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 border border-zinc-700 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-900/30 border border-red-800/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 text-xs text-zinc-400">
                {result.rows.length} rows returned
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900/50">
                      {result.columns.map((col) => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-medium text-zinc-400 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i} className="border-t border-zinc-800/50 hover:bg-zinc-800/30">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-1.5 text-zinc-300 whitespace-nowrap">
                            {cell === null ? (
                              <span className="text-zinc-600 italic">null</span>
                            ) : (
                              String(cell)
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
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Saved Queries ({saved.length})
          </h3>
          {saved.map((q, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 cursor-pointer hover:border-zinc-700 group"
              onClick={() => handleLoadSaved(q)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-200">{q.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSaved(i) }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded text-zinc-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-zinc-500 font-mono truncate">{q.sql}</p>
            </div>
          ))}
          {saved.length === 0 && (
            <p className="text-xs text-zinc-600">No saved queries yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
