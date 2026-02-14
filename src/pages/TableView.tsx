import { useState, useCallback } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { Table2, Plus, Download } from 'lucide-react'
import { DataTable } from '@/components/table/DataTable'
import { RowDetail } from '@/components/table/RowDetail'
import { EditModal } from '@/components/table/EditModal'
import { BulkActions } from '@/components/table/BulkActions'
import { toast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import { exportCSV, exportJSON } from '@/lib/export'
import { cn } from '@/lib/utils'
import type { TableInfo } from '@/lib/api'

export function TableView() {
  const { name } = useParams<{ name: string }>()
  const { tables } = useOutletContext<{ tables: TableInfo[] }>()
  const schema = tables.find((t) => t.table_name === name)

  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null)
  const [editRow, setEditRow] = useState<Record<string, unknown> | null | 'new'>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  async function handleDelete(id: string) {
    if (!name) return
    if (!confirm(`Delete row #${id}?`)) return
    try {
      await api.deleteRows(name, [id])
      toast('Row deleted', 'success')
      setSelectedRow(null)
      refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Delete failed'
      toast(msg, 'error')
    }
  }

  const [exporting, setExporting] = useState(false)

  async function handleExport(format: 'csv' | 'json') {
    if (!name) return
    setExporting(true)
    try {
      const result = await api.getTableData(name, { limit: 100, page: 1 })
      if (format === 'csv') {
        exportCSV(result.data, name)
      } else {
        exportJSON(result.data, name)
      }
      toast(`Exported ${result.data.length} rows as ${format.toUpperCase()}`, 'success')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Export failed'
      toast(msg, 'error')
    } finally {
      setExporting(false)
    }
  }

  if (!name) return null

  return (
    <div className={cn('transition-all', selectedRow ? 'mr-96' : '')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <Table2 className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">{name}</h1>
            {schema && (
              <span className="text-xs text-zinc-600">{schema.columns.length} columns</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-surface-hover border border-border transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-surface-hover border border-border transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>
          <button
            onClick={() => setEditRow('new')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'bg-brand hover:bg-brand-dark text-white transition-colors'
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            New Row
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      <BulkActions
        tableName={name}
        selectedIds={selectedIds}
        onClear={() => setSelectedIds(new Set())}
        onDone={refresh}
      />

      {/* Data table */}
      <DataTable
        key={`${name}-${refreshKey}`}
        tableName={name}
        schema={schema}
        onRowClick={setSelectedRow}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      {/* Row detail side panel */}
      <RowDetail
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onEdit={(row) => {
          setEditRow(row)
          setSelectedRow(null)
        }}
        onDelete={handleDelete}
      />

      {/* Edit/Create modal */}
      {editRow !== null && (
        <EditModal
          tableName={name}
          schema={schema}
          row={editRow === 'new' ? null : editRow}
          onClose={() => setEditRow(null)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
