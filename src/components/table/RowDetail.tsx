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
    <div className="fixed inset-y-0 right-0 w-96 bg-surface border-l border-border shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-[var(--th-text)] text-sm">Row Detail</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-hover text-[var(--th-text-secondary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {Object.entries(row).map(([key, value]) => (
          <div key={key}>
            <label className="text-[10px] font-semibold text-[var(--th-text-muted)] uppercase tracking-wider">
              {key}
            </label>
            <div style={{ background: 'var(--th-bg)' }} className={cn(
              'mt-1 px-3 py-2 rounded-lg border border-border',
              'text-sm text-[var(--th-text)] break-all whitespace-pre-wrap',
              value === null && 'text-[var(--th-text-muted)] italic'
            )}>
              {value === null ? 'null' : formatValue(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-border flex gap-2">
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
            className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/20 transition-colors"
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
