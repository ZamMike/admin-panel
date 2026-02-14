import { useState, useCallback } from 'react'
import { Table2, Plus, Download } from 'lucide-react'
import { DataTable } from '@/components/table/DataTable'
import { RowDetail } from '@/components/table/RowDetail'
import { EditModal } from '@/components/table/EditModal'
import { toast } from '@/components/ui/Toast'
import { api } from '@/lib/api'
import { exportCSV, exportJSON } from '@/lib/export'
import { cn } from '@/lib/utils'
import type { TableInfo } from '@/lib/api'

type Props = {
  tableName: string
  tables: TableInfo[]
}

export function TableView({ tableName, tables }: Props) {
  const schema = tables.find((t) => t.table_name === tableName)

  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null)
  const [editRow, setEditRow] = useState<Record<string, unknown> | null | 'new'>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  async function handleDelete(id: string) {
    if (!confirm(`Delete row #${id}?`)) return
    try {
      await api.deleteRows(tableName, [id])
      toast('Row deleted', 'success')
      setSelectedRow(null)
      refresh()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error')
    }
  }

  const [exporting, setExporting] = useState(false)

  async function handleExport(format: 'csv' | 'json') {
    setExporting(true)
    try {
      const result = await api.getTableData(tableName, { limit: 100, page: 1 })
      if (format === 'csv') exportCSV(result.data, tableName)
      else exportJSON(result.data, tableName)
      toast(`Exported ${result.data.length} rows as ${format.toUpperCase()}`, 'success')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Export failed', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className={cn('transition-all h-full', selectedRow ? 'mr-96' : '')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
            <Table2 className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--th-text)' }}>{tableName}</h1>
            {schema && (
              <span className="text-xs text-[var(--th-text-muted)]">{schema.columns.length} columns</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('csv')} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--th-text-secondary)] hover:text-[var(--th-text)] hover:bg-surface-hover border border-border transition-colors disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => handleExport('json')} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--th-text-secondary)] hover:text-[var(--th-text)] hover:bg-surface-hover border border-border transition-colors disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <button onClick={() => setEditRow('new')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand hover:bg-brand-dark text-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Row
          </button>
        </div>
      </div>

      {/* Data table */}
      <DataTable
        key={`${tableName}-${refreshKey}`}
        tableName={tableName}
        schema={schema}
        onRowClick={setSelectedRow}
        onRefresh={refresh}
      />

      {/* Row detail side panel */}
      <RowDetail
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onEdit={(row) => { setEditRow(row); setSelectedRow(null) }}
        onDelete={handleDelete}
      />

      {/* Edit/Create modal */}
      {editRow !== null && (
        <EditModal
          tableName={tableName}
          schema={schema}
          row={editRow === 'new' ? null : editRow}
          onClose={() => setEditRow(null)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
