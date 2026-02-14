import { useParams } from 'react-router-dom'
import { Table2 } from 'lucide-react'

export function TableView() {
  const { name } = useParams<{ name: string }>()

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Table2 className="w-5 h-5 text-brand" />
        <h1 className="text-xl font-semibold text-zinc-100">{name}</h1>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
        <p>Table browser will be built in Phase 2</p>
        <p className="text-xs mt-1">Sort, filter, search, pagination</p>
      </div>
    </div>
  )
}
