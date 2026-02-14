import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import type { TableInfo } from '@/lib/api'

let cachedTables: TableInfo[] | null = null

export function useTableSchema() {
  const [tables, setTables] = useState<TableInfo[]>(cachedTables || [])
  const [loading, setLoading] = useState(!cachedTables)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cachedTables) return

    api.getTables()
      .then((data) => {
        cachedTables = data
        setTables(data)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function getColumns(tableName: string) {
    return tables.find((t) => t.table_name === tableName)?.columns || []
  }

  return { tables, loading, error, getColumns }
}
