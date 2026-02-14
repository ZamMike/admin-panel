import { supabase } from './supabase'

const BASE = '/api'

async function getToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || `API error: ${res.status}`)
  }

  return res.json()
}

export type TableInfo = {
  table_name: string
  columns: {
    column_name: string
    data_type: string
    is_nullable: string
  }[]
}

export type TableQuery = {
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
  search?: string
  filters?: Record<string, string>
}

export type TableResponse = {
  data: Record<string, unknown>[]
  total: number
  page: number
  limit: number
}

export type StatsResponse = {
  tables: Record<string, number>
  recent: {
    table: string
    action: string
    record: Record<string, unknown>
    timestamp: string
  }[]
}

export const api = {
  // Tables
  getTables: () => request<TableInfo[]>('/tables'),

  getTableData: (name: string, query: TableQuery = {}) => {
    const params = new URLSearchParams()
    if (query.sort) params.set('sort', query.sort)
    if (query.order) params.set('order', query.order)
    if (query.page) params.set('page', String(query.page))
    if (query.limit) params.set('limit', String(query.limit))
    if (query.search) params.set('search', query.search)
    if (query.filters) {
      for (const [k, v] of Object.entries(query.filters)) {
        if (v) params.set(`filter.${k}`, v)
      }
    }
    const qs = params.toString()
    return request<TableResponse>(`/tables/${name}${qs ? `?${qs}` : ''}`)
  },

  getRow: (table: string, id: string) =>
    request<Record<string, unknown>>(`/tables/${table}?id=${id}`),

  insertRow: (table: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/tables/${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRow: (table: string, id: string, data: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/tables/${table}`, {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    }),

  deleteRows: (table: string, ids: string[]) =>
    request(`/tables/${table}`, {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),

  // Stats
  getStats: () => request<StatsResponse>('/stats'),

  // SQL
  runSql: (query: string) =>
    request<{ columns: string[]; rows: unknown[][] }>('/sql', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),
}
