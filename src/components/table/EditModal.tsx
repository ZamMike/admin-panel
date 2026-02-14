import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import type { TableInfo } from '@/lib/api'

type Props = {
  tableName: string
  schema: TableInfo | undefined
  row: Record<string, unknown> | null  // null = new row
  onClose: () => void
  onSaved: () => void
}

export function EditModal({ tableName, schema, row, onClose, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const isNew = !row

  useEffect(() => {
    if (row) {
      const vals: Record<string, string> = {}
      for (const [k, v] of Object.entries(row)) {
        vals[k] = v === null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v)
      }
      setValues(vals)
    } else {
      setValues({})
    }
  }, [row])

  async function handleSave() {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(values)) {
        if (k === 'id' && !isNew) continue
        if (k === 'created_at' || k === 'updated_at') continue
        payload[k] = v === '' ? null : v
      }

      if (isNew) {
        await api.insertRow(tableName, payload)
        toast('Row created', 'success')
      } else {
        await api.updateRow(tableName, String(row!.id), payload)
        toast('Row updated', 'success')
      }
      onSaved()
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed'
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!schema) return null

  const editableColumns = schema.columns.filter(
    (c) => !['id', 'created_at', 'updated_at'].includes(c.column_name) || isNew
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-medium text-zinc-100">
            {isNew ? `New row in ${tableName}` : `Edit row #${row?.id}`}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {editableColumns.map((col) => (
            <div key={col.column_name}>
              <label className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1">
                <span>{col.column_name}</span>
                <span className="text-zinc-600">{col.data_type}</span>
                {col.is_nullable === 'YES' && (
                  <span className="text-zinc-700">nullable</span>
                )}
              </label>
              {col.data_type === 'text' || col.data_type === 'character varying' || col.data_type === 'jsonb' || col.data_type === 'json' ? (
                <textarea
                  value={values[col.column_name] || ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [col.column_name]: e.target.value }))}
                  rows={col.data_type.includes('json') ? 4 : 2}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700',
                    'text-sm text-zinc-200 resize-y',
                    'focus:outline-none focus:border-brand'
                  )}
                />
              ) : (
                <input
                  type={col.data_type === 'integer' || col.data_type === 'bigint' || col.data_type === 'numeric' ? 'number' : 'text'}
                  value={values[col.column_name] || ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [col.column_name]: e.target.value }))}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700',
                    'text-sm text-zinc-200',
                    'focus:outline-none focus:border-brand'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-800 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-brand hover:bg-brand-dark text-white',
              'disabled:opacity-50 transition-colors'
            )}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isNew ? 'Create' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
