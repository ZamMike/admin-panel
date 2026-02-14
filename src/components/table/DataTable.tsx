import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'
import type { TableInfo, TableResponse } from '@/lib/api'
import { cn, truncate, shortUuid, relativeTime } from '@/lib/utils'
import { ArrowUp, ArrowDown, Search, Loader2, ChevronLeft, ChevronRight, Copy, Trash2, Pencil } from 'lucide-react'

type Props = {
  tableName: string
  schema: TableInfo | undefined
  onRowClick?: (row: Record<string, unknown>) => void
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  onRefresh?: () => void
}

type CellPos = { row: number; col: number }
type SortState = { col: string; dir: 'asc' | 'desc' } | null

const PAGE_SIZES = [25, 50, 100]

function isUuid(val: unknown): boolean {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(val)
}

function isTimestamp(type: string): boolean {
  return type.includes('timestamp') || type === 'date'
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function displayCell(val: unknown, dataType: string): React.ReactNode {
  if (val === null || val === undefined) {
    return <span className="text-[var(--th-text-muted)] italic text-xs">null</span>
  }
  if (typeof val === 'boolean') {
    return <span className={cn('text-xs font-medium', val ? 'text-emerald-500' : 'text-[var(--th-text-muted)]')}>{val ? 'true' : 'false'}</span>
  }
  if (dataType === 'uuid' || isUuid(val)) {
    return <span className="font-mono text-xs text-[var(--th-text-secondary)]" title={String(val)}>{shortUuid(String(val))}</span>
  }
  if (isTimestamp(dataType) && typeof val === 'string') {
    return <span className="text-[var(--th-text-secondary)] text-xs" title={String(val)}>{relativeTime(val)}</span>
  }
  if (typeof val === 'object') {
    return <span className="text-[var(--th-text-secondary)] font-mono text-xs">{truncate(JSON.stringify(val), 50)}</span>
  }
  return <span style={{ color: 'var(--th-text)' }}>{truncate(String(val), 60)}</span>
}

export function DataTable({ tableName, schema, onRowClick, selectedIds, onSelectionChange, onRefresh }: Props) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sort, setSort] = useState<SortState>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const [focusCell, setFocusCell] = useState<CellPos | null>(null)
  const [editCell, setEditCell] = useState<CellPos | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const [newRow, setNewRow] = useState<Record<string, string>>({})

  const [colWidths, setColWidths] = useState<Record<string, number>>({})
  const resizeRef = useRef<{ col: string; startX: number; startW: number } | null>(null)

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; rowIdx: number } | null>(null)

  const tableRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const columns = useMemo(() => schema?.columns ?? [], [schema])
  const colNames = useMemo(() => columns.map((c) => c.column_name), [columns])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result: TableResponse = await api.getTableData(tableName, {
        page, limit,
        sort: sort?.col,
        order: sort?.dir,
        search: globalFilter || undefined,
      })
      setData(result.data)
      setTotal(result.total)
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [tableName, page, limit, sort, globalFilter])

  useEffect(() => { setPage(1) }, [tableName])
  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (editCell && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editCell])

  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [ctxMenu])

  useEffect(() => {
    if (!selectedIds || selectedIds.size === 0) return
  }, [selectedIds])

  useEffect(() => {
    if (!onSelectionChange) return
    const ids = new Set<string>()
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      if (row?.id != null && selectedIds?.has(String(row.id))) {
        ids.add(String(row.id))
      }
    }
    // Only call if different
  }, [data, onSelectionChange, selectedIds])

  function handleSort(col: string) {
    setSort((prev) => {
      if (prev?.col === col) {
        if (prev.dir === 'asc') return { col, dir: 'desc' }
        return null
      }
      return { col, dir: 'asc' }
    })
    setPage(1)
  }

  function startEdit(row: number, col: number) {
    const colName = colNames[col]
    if (!colName) return
    const val = data[row]?.[colName]
    setEditCell({ row, col })
    setEditValue(formatCell(val))
  }

  async function saveEdit() {
    if (!editCell || saving) return
    const colName = colNames[editCell.col]
    const row = data[editCell.row]
    if (!row || !colName) { setEditCell(null); return }

    const oldVal = formatCell(row[colName])
    if (editValue === oldVal) { setEditCell(null); return }

    setSaving(true)
    try {
      const id = String(row.id)
      await api.updateRow(tableName, id, { [colName]: editValue === '' ? null : editValue })
      setData((prev) => prev.map((r, i) =>
        i === editCell.row ? { ...r, [colName]: editValue === '' ? null : editValue } : r
      ))
      toast('Saved', 'success')
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
      setEditCell(null)
    }
  }

  function cancelEdit() { setEditCell(null); setEditValue('') }

  async function handleAddRow() {
    const filled = Object.entries(newRow).filter(([, v]) => v !== '')
    if (filled.length === 0) return
    try {
      const payload: Record<string, unknown> = {}
      for (const [k, v] of filled) payload[k] = v
      await api.insertRow(tableName, payload)
      toast('Row created', 'success')
      setNewRow({})
      fetchData()
      onRefresh?.()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Insert failed', 'error')
    }
  }

  async function handleDeleteRow(rowIdx: number) {
    const row = data[rowIdx]
    if (!row?.id) return
    if (!confirm(`Delete row #${String(row.id).slice(0, 8)}?`)) return
    try {
      await api.deleteRows(tableName, [String(row.id)])
      toast('Row deleted', 'success')
      fetchData()
      onRefresh?.()
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Delete failed', 'error')
    }
  }

  function handleCopy(rowIdx: number) {
    const row = data[rowIdx]
    if (!row) return
    navigator.clipboard.writeText(colNames.map((c) => formatCell(row[c])).join('\t'))
    toast('Row copied', 'info')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (editCell) {
      if (e.key === 'Enter') { e.preventDefault(); saveEdit() }
      if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
      if (e.key === 'Tab') {
        e.preventDefault()
        const nextCol = e.shiftKey ? editCell.col - 1 : editCell.col + 1
        saveEdit()
        if (nextCol >= 0 && nextCol < colNames.length) {
          setTimeout(() => { setFocusCell({ row: editCell.row, col: nextCol }); startEdit(editCell.row, nextCol) }, 50)
        }
      }
      return
    }
    if (!focusCell) return
    const { row, col } = focusCell
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); if (row > 0) setFocusCell({ row: row - 1, col }); break
      case 'ArrowDown': e.preventDefault(); if (row < data.length - 1) setFocusCell({ row: row + 1, col }); break
      case 'ArrowLeft': e.preventDefault(); if (col > 0) setFocusCell({ row, col: col - 1 }); break
      case 'ArrowRight': e.preventDefault(); if (col < colNames.length - 1) setFocusCell({ row, col: col + 1 }); break
      case 'Enter': e.preventDefault(); startEdit(row, col); break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) { if (col > 0) setFocusCell({ row, col: col - 1 }) }
        else { if (col < colNames.length - 1) setFocusCell({ row, col: col + 1 }) }
        break
      case 'c':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          navigator.clipboard.writeText(formatCell(data[row]?.[colNames[col]]))
          toast('Copied', 'info')
        }
        break
      case 'Delete': e.preventDefault(); handleDeleteRow(row); break
    }
  }

  function onResizeStart(e: React.MouseEvent, colName: string) {
    e.preventDefault(); e.stopPropagation()
    const startW = colWidths[colName] || 150
    resizeRef.current = { col: colName, startX: e.clientX, startW }
    function onMove(ev: MouseEvent) {
      if (!resizeRef.current) return
      const newW = Math.max(60, resizeRef.current.startW + (ev.clientX - resizeRef.current.startX))
      setColWidths((prev) => ({ ...prev, [resizeRef.current!.col]: newW }))
    }
    function onUp() {
      resizeRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function onResizeDblClick(colName: string) {
    const maxLen = Math.max(colName.length, ...data.map((r) => formatCell(r[colName]).length))
    setColWidths((prev) => ({ ...prev, [colName]: Math.min(400, Math.max(80, maxLen * 8 + 24)) }))
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 8rem)' }} onKeyDown={handleKeyDown} tabIndex={0} ref={tableRef}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-2 shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--th-text-muted)]" />
          <input
            type="text" placeholder="Search all columns..." value={globalFilter}
            onChange={(e) => { setGlobalFilter(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface border border-border text-sm text-[var(--th-text)] placeholder-[var(--th-text-muted)] focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
          />
        </div>
        <span className="text-[var(--th-text-secondary)] text-xs tabular-nums">{total.toLocaleString()} rows</span>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--th-text-muted)]" />}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-border rounded-lg">
        <table className="w-max min-w-full text-[13px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-10 px-2 py-2 text-center text-[10px] font-semibold text-[var(--th-text-muted)] uppercase border-b border-r border-border sticky left-0 z-20" style={{ background: 'var(--th-surface)' }}>#</th>
              {columns.map((col, ci) => {
                const w = colWidths[col.column_name] || (col.data_type === 'uuid' ? 100 : isTimestamp(col.data_type) ? 110 : 150)
                const sorted = sort?.col === col.column_name
                return (
                  <th
                    key={col.column_name}
                    className={cn(
                      'px-3 py-2 text-left text-[10px] font-semibold text-[var(--th-text-muted)] uppercase tracking-wider',
                      'border-b border-r border-border cursor-pointer select-none hover:text-[var(--th-text)] transition-colors relative',
                      ci === 0 && 'sticky left-10 z-20'
                    )}
                    style={{ width: w, minWidth: w, background: 'var(--th-surface)' }}
                    onClick={() => handleSort(col.column_name)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="truncate">{col.column_name}</span>
                      {sorted && sort.dir === 'asc' && <ArrowUp className="w-3 h-3 text-brand shrink-0" />}
                      {sorted && sort.dir === 'desc' && <ArrowDown className="w-3 h-3 text-brand shrink-0" />}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand/30"
                      onMouseDown={(e) => onResizeStart(e, col.column_name)}
                      onDoubleClick={() => onResizeDblClick(col.column_name)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri} onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, rowIdx: ri }) }}>
                <td className="px-2 py-1.5 text-center text-[11px] text-[var(--th-text-muted)] border-r border-border sticky left-0 z-10 cursor-pointer" style={{ background: ri % 2 === 1 ? 'var(--th-row-alt)' : 'var(--th-row)' }} onClick={() => onRowClick?.(row)}>
                  {(page - 1) * limit + ri + 1}
                </td>
                {columns.map((col, ci) => {
                  const focused = focusCell?.row === ri && focusCell?.col === ci
                  const editing = editCell?.row === ri && editCell?.col === ci
                  const w = colWidths[col.column_name] || (col.data_type === 'uuid' ? 100 : isTimestamp(col.data_type) ? 110 : 150)
                  return (
                    <td
                      key={col.column_name}
                      className={cn(
                        'px-2 py-1.5 border-r border-border/50 whitespace-nowrap overflow-hidden text-ellipsis cursor-cell',
                        focused && !editing && 'outline outline-2 outline-brand outline-offset-[-2px]',
                        editing && 'p-0',
                        ci === 0 && 'sticky left-10 z-10'
                      )}
                      style={{
                        width: w, minWidth: w, maxWidth: w,
                        background: editing ? 'var(--th-cell-edit)' : (ri % 2 === 1 ? 'var(--th-row-alt)' : 'var(--th-row)'),
                      }}
                      onClick={() => setFocusCell({ row: ri, col: ci })}
                      onDoubleClick={() => startEdit(ri, ci)}
                    >
                      {editing ? (
                        <input ref={editInputRef} type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                          className="w-full h-full px-2 py-1.5 text-[13px] bg-transparent border-none outline-none text-[var(--th-text)]" onBlur={saveEdit} />
                      ) : displayCell(row[col.column_name], col.data_type)}
                    </td>
                  )
                })}
              </tr>
            ))}
            {/* New row */}
            {!loading && schema && (
              <tr>
                <td className="px-2 py-1.5 text-center text-[11px] text-brand border-r border-border sticky left-0 z-10" style={{ background: 'var(--th-surface)' }}>+</td>
                {columns.map((col) => {
                  const skip = ['id', 'created_at', 'updated_at'].includes(col.column_name)
                  return (
                    <td key={col.column_name} className="px-0 py-0 border-r border-border/50" style={{ background: 'var(--th-surface)' }}>
                      {skip ? <span className="px-2 text-[11px] text-[var(--th-text-muted)] italic">auto</span> : (
                        <input type="text" placeholder={col.column_name} value={newRow[col.column_name] || ''}
                          onChange={(e) => setNewRow((p) => ({ ...p, [col.column_name]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddRow() }}
                          className="w-full px-2 py-1.5 text-[13px] bg-transparent border-none outline-none text-[var(--th-text)] placeholder-[var(--th-text-muted)]" />
                      )}
                    </td>
                  )
                })}
              </tr>
            )}
            {!loading && data.length === 0 && (
              <tr><td colSpan={columns.length + 1} className="px-3 py-12 text-center text-[var(--th-text-muted)]">
                <p className="text-sm">No data found</p>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm pt-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[var(--th-text-muted)] text-xs">Rows per page:</span>
          <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
            className="bg-surface border border-border rounded-md px-2 py-1 text-[var(--th-text-secondary)] text-xs">
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--th-text-secondary)] text-xs tabular-nums">Page {page} of {totalPages || 1}</span>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="p-1.5 rounded-md hover:bg-surface-hover disabled:opacity-20 text-[var(--th-text-secondary)]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="p-1.5 rounded-md hover:bg-surface-hover disabled:opacity-20 text-[var(--th-text-secondary)]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <div className="fixed z-50 border border-border rounded-lg shadow-xl py-1 min-w-[160px]" style={{ left: ctxMenu.x, top: ctxMenu.y, background: 'var(--th-surface)' }}>
          <button onClick={() => { onRowClick?.(data[ctxMenu.rowIdx]); setCtxMenu(null) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--th-text)] hover:bg-surface-hover"><Pencil className="w-3.5 h-3.5" /> View / Edit</button>
          <button onClick={() => { handleCopy(ctxMenu.rowIdx); setCtxMenu(null) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--th-text)] hover:bg-surface-hover"><Copy className="w-3.5 h-3.5" /> Copy Row</button>
          <div className="border-t border-border my-1" />
          <button onClick={() => { handleDeleteRow(ctxMenu.rowIdx); setCtxMenu(null) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
        </div>
      )}
    </div>
  )
}
