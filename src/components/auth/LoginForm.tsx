import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Database, Loader2 } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mx-auto mb-4">
            <Database className="w-6 h-6 text-brand" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Admin Panel</h1>
          <p className="text-zinc-500 text-sm mt-1">ZamTraveler Supabase</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={cn(
                'w-full px-3 py-2.5 rounded-lg bg-surface border border-border',
                'text-sm text-zinc-100 placeholder-zinc-600',
                'focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30',
                'transition-all'
              )}
              placeholder="mza8k7@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={cn(
                'w-full px-3 py-2.5 rounded-lg bg-surface border border-border',
                'text-sm text-zinc-100 placeholder-zinc-600',
                'focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30',
                'transition-all'
              )}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
              'bg-brand hover:bg-brand-dark text-white font-medium text-sm',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors'
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
