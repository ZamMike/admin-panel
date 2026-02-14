import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: number
  message: string
  type: ToastType
  exiting?: boolean
}

let addToastFn: ((message: string, type?: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'info') {
  addToastFn?.(message, type)
}

let nextId = 0

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      )
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 300)
    }, 4000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm',
            t.exiting ? 'toast-exit' : 'toast-enter',
            t.type === 'success' && 'bg-green-900/90 text-green-100 border border-green-700',
            t.type === 'error' && 'bg-red-900/90 text-red-100 border border-red-700',
            t.type === 'info' && 'bg-zinc-800/90 text-zinc-100 border border-zinc-700'
          )}
        >
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="p-0.5 hover:bg-white/10 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
