import { X } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

type Props = {
  row: Record<string, unknown> | null
  onClose: () => void
  onEdit?: (row: Record<string, unknown>) => void
  onDelete?: (id: string) => void
}

export function RowDetail({ row, onClose, onEdit, onDelete }: Props) {
  if (!row) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="font-medium text-zinc-100 text-sm">Row Detail</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Object.entries(row).map(([key, value]) => (
          <div key={key}>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {key}
            </label>
            <div className={cn(
              'mt-0.5 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50',
              'text-sm text-zinc-200 break-all whitespace-pre-wrap',
              value === null && 'text-zinc-600 italic'
            )}>
              {value === null ? 'null' : formatValue(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-zinc-800 flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(row)}
            className="flex-1 px-3 py-2 rounded-lg bg-brand hover:bg-brand-dark text-white text-sm font-medium transition-colors"
          >
            Edit
          </button>
        )}
        {onDelete && row.id != null && (
          <button
            onClick={() => onDelete(String(row.id))}
            className="px-3 py-2 rounded-lg bg-red-900/50 hover:bg-red-900 text-red-300 text-sm font-medium border border-red-800/50 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

function formatValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatDate(value)
  }
  return String(value)
}
