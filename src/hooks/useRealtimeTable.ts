import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/Toast'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Options = {
  tableName: string
  enabled?: boolean
  onInsert?: (row: Record<string, unknown>) => void
  onUpdate?: (row: Record<string, unknown>) => void
  onDelete?: (old: Record<string, unknown>) => void
  onAny?: () => void
}

export function useRealtimeTable({
  tableName,
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
  onAny,
}: Options) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload: any) => {
      switch (payload.eventType) {
        case 'INSERT':
          onInsert?.(payload.new)
          toast(`New row in ${tableName}`, 'info')
          break
        case 'UPDATE':
          onUpdate?.(payload.new)
          break
        case 'DELETE':
          onDelete?.(payload.old)
          break
      }
      onAny?.()
    },
    [tableName, onInsert, onUpdate, onDelete, onAny]
  )

  useEffect(() => {
    if (!enabled || !tableName) return

    const channel: RealtimeChannel = supabase
      .channel(`admin-${tableName}`)
      .on(
        'postgres_changes' as 'system',
        { event: '*', schema: 'public', table: tableName } as Record<string, string>,
        handleChange
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [tableName, enabled, handleChange])
}
