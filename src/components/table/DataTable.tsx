import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { api } from '@/lib/api'
import type { TableInfo, TableResponse } from '@/lib/api'
import { cn, truncate } from '@/lib/utils'
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  tableName: string
  schema: TableInfo | undefined
  onRowClick?: (row: Record<string, unknown>) => void
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
}

const PAGE_SIZES = [25, 50, 100]

export function DataTable({ tableName, schema, onRowClick, selectedIds, onSelectionChange }: Props) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const sort = sorting[0]
      const result: TableResponse = await api.getTableData(tableName, {
        page,
        limit,
        sort: sort?.id,
        order: sort?.desc ? 'desc' : 'asc',
        search: globalFilter || undefined,
        filters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
      })
      setData(result.data)
      setTotal(result.total)
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [tableName, page, limit, sorting, globalFilter, columnFilters])

  useEffect(() => {
    setPage(1)
    setRowSelection({})
  }, [tableName])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Sync selection to parent
  useEffect(() => {
    if (!onSelectionChange) return
    const ids = new Set<string>()
    for (const idx of Object.keys(rowSelection)) {
      const row = data[parseInt(idx)]
      if (row?.id != null) ids.add(String(row.id))
    }
    onSelectionChange(ids)
  }, [rowSelection, data, onSelectionChange])

  // Sync from parent
  useEffect(() => {
    if (!selectedIds || selectedIds.size === 0) {
      setRowSelection({})
    }
  }, [selectedIds])

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    if (!schema) return []

    const cols: ColumnDef<Record<string, unknown>>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="accent-brand"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-brand"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableSorting: false,
      },
    ]

    for (const col of schema.columns) {
      cols.push({
        id: col.column_name,
        accessorKey: col.column_name,
        header: () => col.column_name,
        cell: ({ getValue }) => {
          const val = getValue()
          if (val === null || val === undefined) {
            return <span className="text-zinc-600 italic">null</span>
          }
          if (typeof val === 'boolean') {
            return val ? '✓' : '✗'
          }
          if (typeof val === 'object') {
            return <span className="text-zinc-400">{truncate(JSON.stringify(val), 60)}</span>
          }
          return <span>{truncate(String(val), 60)}</span>
        },
        size: col.data_type === 'uuid' ? 120 : col.data_type.includes('timestamp') ? 160 : 150,
      })
    }

    return cols
  }, [schema])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: Math.ceil(total / limit),
    enableRowSelection: true,
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              setPage(1)
            }}
            className={cn(
              'w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700',
              'text-sm text-zinc-100 placeholder-zinc-500',
              'focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand'
            )}
          />
        </div>

        <div className="flex items-center gap-1 text-sm text-zinc-400">
          <span>{total.toLocaleString()} rows</span>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
        </div>
      </div>

      {/* Column filters */}
      {schema && schema.columns.length <= 12 && (
        <div className="flex gap-2 flex-wrap">
          {schema.columns.slice(0, 6).map((col) => (
            <input
              key={col.column_name}
              type="text"
              placeholder={col.column_name}
              value={columnFilters[col.column_name] || ''}
              onChange={(e) => {
                setColumnFilters((prev) => ({
                  ...prev,
                  [col.column_name]: e.target.value,
                }))
                setPage(1)
              }}
              className={cn(
                'px-2 py-1 rounded text-xs bg-zinc-900 border border-zinc-800',
                'text-zinc-300 placeholder-zinc-600 w-28',
                'focus:outline-none focus:border-zinc-600'
              )}
            />
          ))}
        </div>
      )}

      {/* Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-zinc-900/80 border-b border-zinc-800">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'px-3 py-2.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider',
                        'sticky top-0 bg-zinc-900/95 backdrop-blur-sm',
                        header.column.getCanSort() && 'cursor-pointer select-none hover:text-zinc-200'
                      )}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    'border-b border-zinc-800/50 transition-colors',
                    'hover:bg-zinc-800/50 cursor-pointer',
                    row.getIsSelected() && 'bg-brand/5'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 text-zinc-300 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-8 text-center text-zinc-500">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-300 text-xs"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-400">
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
