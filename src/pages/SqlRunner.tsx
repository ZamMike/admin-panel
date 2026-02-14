import { Terminal } from 'lucide-react'

export function SqlRunner() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Terminal className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold text-zinc-100">SQL Runner</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
        <p>SQL query runner — Phase 5</p>
      </div>
    </div>
  )
}
