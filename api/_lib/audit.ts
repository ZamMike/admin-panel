import type { VercelRequest } from '@vercel/node'
import { supabaseAdmin } from './auth.js'

function getIP(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return 'unknown'
}

export async function logAction(
  req: VercelRequest,
  adminEmail: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  tableName: string,
  rowId?: string,
  oldData?: Record<string, unknown> | null,
  newData?: Record<string, unknown> | null
) {
  try {
    await supabaseAdmin.from('admin_logs').insert({
      admin_email: adminEmail,
      action,
      table_name: tableName,
      row_id: rowId || null,
      old_data: oldData || null,
      new_data: newData || null,
      ip_address: getIP(req),
    })
  } catch (e) {
    // Don't fail the request if logging fails
    console.error('Audit log error:', e)
  }
}
