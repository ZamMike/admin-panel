import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAdmin, supabaseAdmin } from './_lib/auth.js'
import { checkRateLimit } from './_lib/rateLimit.js'

const BLOCKED_KEYWORDS = [
  'DROP', 'ALTER', 'TRUNCATE', 'DELETE', 'UPDATE', 'INSERT',
  'CREATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE',
  'PG_READ_FILE', 'PG_WRITE_FILE', 'LO_IMPORT', 'LO_EXPORT',
  'COPY', 'SET ROLE', 'SET SESSION',
]

const MAX_ROWS = 500

function validateQuery(query: string): string | null {
  const trimmed = query.trim()
  if (!trimmed) return 'Empty query'

  const upper = trimmed.toUpperCase()

  // Must start with SELECT or WITH
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
    return 'Only SELECT or WITH queries allowed'
  }

  // Check for blocked keywords as standalone words
  for (const keyword of BLOCKED_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(trimmed)) {
      return `Blocked keyword: ${keyword}`
    }
  }

  // Check for semicolons (prevent multi-statement)
  const withoutStrings = trimmed.replace(/'[^']*'/g, '')
  if (withoutStrings.includes(';') && withoutStrings.indexOf(';') < withoutStrings.length - 1) {
    return 'Multiple statements not allowed'
  }

  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (checkRateLimit(req, res)) return

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

  const validationError = validateQuery(query)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  // Add LIMIT if not present to prevent huge result sets
  const upper = query.trim().toUpperCase()
  let safeQuery = query.trim().replace(/;$/, '')
  if (!upper.includes('LIMIT')) {
    safeQuery += ` LIMIT ${MAX_ROWS}`
  }

  // Wrap in read-only transaction with timeout
  const wrappedQuery = `
    SET LOCAL statement_timeout = '10s';
    BEGIN READ ONLY;
    ${safeQuery};
    COMMIT;
  `.trim()

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { query_text: wrappedQuery })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Internal error'
    return res.status(500).json({ error: msg })
  }
}
