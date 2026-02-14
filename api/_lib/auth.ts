import { createClient } from '@supabase/supabase-js'
import type { VercelRequest } from '@vercel/node'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'mza8k7@gmail.com'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export { supabaseAdmin }

export async function verifyAdmin(req: VercelRequest): Promise<string> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    throw new Error('Missing authorization token')
  }

  const token = auth.replace('Bearer ', '')
  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) {
    throw new Error('Invalid token')
  }

  if (data.user.email !== ADMIN_EMAIL) {
    throw new Error('Access denied: not admin')
  }

  return data.user.email
}
