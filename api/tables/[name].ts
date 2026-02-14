import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAdmin, supabaseAdmin } from '../_lib/auth.js'
import { checkRateLimit } from '../_lib/rateLimit.js'
import { logAction } from '../_lib/audit.js'

// Whitelist of safe table name characters
function isValidTableName(name: string): boolean {
  return /^[a-z_][a-z0-9_]*$/.test(name)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (checkRateLimit(req, res)) return

  let adminEmail: string
  try {
    adminEmail = await verifyAdmin(req)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return res.status(403).json({ error: msg })
  }

  const tableName = req.query.name as string
  if (!tableName || !isValidTableName(tableName)) {
    return res.status(400).json({ error: 'Invalid table name' })
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, tableName)
      case 'POST':
        return await handleInsert(req, res, tableName, adminEmail)
      case 'PUT':
        return await handleUpdate(req, res, tableName, adminEmail)
      case 'DELETE':
        return await handleDelete(req, res, tableName, adminEmail)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    return res.status(500).json({ error: msg })
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse, table: string) {
  // Single row by id
  const id = req.query.id as string | undefined
  if (id) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) return res.status(404).json({ error: error.message })
    return res.json(data)
  }

  // List with pagination, sort, filter
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 25, 100)
  const sort = req.query.sort as string || 'id'
  const order = (req.query.order as string) === 'desc'
  const search = req.query.search as string | undefined

  let query = supabaseAdmin
    .from(table)
    .select('*', { count: 'exact' })

  // Apply column filters
  for (const [key, val] of Object.entries(req.query)) {
    if (key.startsWith('filter.') && val) {
      const col = key.replace('filter.', '')
      if (isValidTableName(col)) {
        query = query.ilike(col, `%${val}%`)
      }
    }
  }

  // Apply global search — search across text-like columns
  if (search) {
    query = query.or(
      `id.eq.${search},` +
      `email.ilike.%${search}%,` +
      `name.ilike.%${search}%,` +
      `display_name.ilike.%${search}%,` +
      `word.ilike.%${search}%`
    )
  }

  // Sort
  query = query.order(sort, { ascending: !order })

  // Pagination
  const from = (page - 1) * limit
  query = query.range(from, from + limit - 1)

  const { data, count, error } = await query

  if (error) return res.status(500).json({ error: error.message })

  return res.json({
    data: data || [],
    total: count || 0,
    page,
    limit,
  })
}

async function handleInsert(req: VercelRequest, res: VercelResponse, table: string, adminEmail: string) {
  const body = req.body
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Request body required' })
  }

  const { data, error } = await supabaseAdmin
    .from(table)
    .insert(body)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  await logAction(req, adminEmail, 'INSERT', table, String(data.id), null, data)

  return res.status(201).json(data)
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, table: string, adminEmail: string) {
  const { id, ...updates } = req.body || {}
  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  // Fetch old data for audit
  const { data: oldData } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabaseAdmin
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  await logAction(req, adminEmail, 'UPDATE', table, String(id), oldData, data)

  return res.json(data)
}

async function handleDelete(req: VercelRequest, res: VercelResponse, table: string, adminEmail: string) {
  const { ids } = req.body || {}
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array required' })
  }

  // Fetch old data for audit
  const { data: oldRows } = await supabaseAdmin
    .from(table)
    .select('*')
    .in('id', ids)

  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .in('id', ids)

  if (error) return res.status(500).json({ error: error.message })

  // Log each deletion
  for (const row of oldRows || []) {
    await logAction(req, adminEmail, 'DELETE', table, String(row.id), row, null)
  }

  return res.json({ deleted: ids.length })
}
