import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/Toast'

const TIMEOUT_MS = 24 * 60 * 60 * 1000    // 24 hours
const WARNING_MS = 5 * 60 * 1000           // 5 minutes before logout

export function useSessionTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const warningRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }, [])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    // Warning toast 5 minutes before timeout
    warningRef.current = setTimeout(() => {
      toast('Session expires in 5 minutes. Click anywhere to stay logged in.', 'info')
    }, TIMEOUT_MS - WARNING_MS)

    // Auto-logout
    timerRef.current = setTimeout(() => {
      toast('Session expired. Logging out...', 'error')
      setTimeout(logout, 2000)
    }, TIMEOUT_MS)
  }, [logout])

  useEffect(() => {
    const events = ['click', 'keypress', 'mousemove', 'scroll', 'touchstart']

    // Throttle: only reset at most once per minute
    let lastReset = Date.now()
    function handleActivity() {
      if (Date.now() - lastReset > 60_000) {
        lastReset = Date.now()
        resetTimer()
      }
    }

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))
    resetTimer()

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity))
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, [resetTimer])
}
