import { useState } from 'react'
import { Trash2, Loader2, X } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

type Props = {
  tableName: string
  selectedIds: Set<string>
  onClear: () => void
  onDone: () => void
}

export function BulkActions({ tableName, selectedIds, onClear, onDone }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (selectedIds.size === 0) return null

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.deleteRows(tableName, Array.from(selectedIds))
      toast(`Deleted ${selectedIds.size} rows`, 'success')
      onClear()
      onDone()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Delete failed'
      toast(msg, 'error')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 mb-3 bg-surface border border-border rounded-xl">
      <span className="text-sm text-[var(--th-text)] tabular-nums">
        {selectedIds.size} selected
      </span>

      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-400">Delete {selectedIds.size} rows?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
              'bg-red-500 hover:bg-red-600 text-white transition-colors',
              'disabled:opacity-50'
            )}
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="p-1 rounded-md hover:bg-surface-hover text-[var(--th-text-secondary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      )}

      <button
        onClick={onClear}
        className="ml-auto text-xs text-[var(--th-text-muted)] hover:text-[var(--th-text-secondary)] transition-colors"
      >
        Clear
      </button>
    </div>
  )
}
