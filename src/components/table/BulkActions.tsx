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
    <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl">
      <span className="text-sm text-zinc-300">
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
              'bg-red-600 hover:bg-red-700 text-white transition-colors',
              'disabled:opacity-50'
            )}
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-900/30 border border-red-800/40 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      )}

      <button
        onClick={onClear}
        className="ml-auto text-xs text-zinc-500 hover:text-zinc-300"
      >
        Clear
      </button>
    </div>
  )
}
