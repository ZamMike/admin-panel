import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAdmin, supabaseAdmin } from '../_lib/auth.js'
import { checkRateLimit } from '../_lib/rateLimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (checkRateLimit(req, res)) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await verifyAdmin(req)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unauthorized'
    return res.status(403).json({ error: msg })
  }

  try {
    const { data, error } = await supabaseAdmin.rpc('get_table_info')

    if (error) {
      // Fallback: query information_schema directly
      const { data: fallback, error: fbErr } = await supabaseAdmin
        .from('information_schema.tables' as string)
        .select('table_name')

      if (fbErr || !fallback) {
        return res.status(500).json({ error: error.message })
      }
    }

    return res.json(data || [])
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    return res.status(500).json({ error: msg })
  }
}
