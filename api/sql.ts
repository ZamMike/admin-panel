import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAdmin, supabaseAdmin } from './_lib/auth.js'

// Only allow SELECT statements
function isReadOnly(query: string): boolean {
  const normalized = query.trim().toUpperCase()
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE']
  return normalized.startsWith('SELECT') && !forbidden.some(kw => normalized.includes(kw))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await verifyAdmin(req)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return res.status(403).json({ error: msg })
  }

  const { query } = req.body || {}
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string required' })
  }

  if (!isReadOnly(query)) {
    return res.status(400).json({ error: 'Only SELECT queries allowed' })
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { query_text: query })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    return res.status(500).json({ error: msg })
  }
}
