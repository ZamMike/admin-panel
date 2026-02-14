import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(date: string | Date): string {
  const now = Date.now()
  const d = new Date(date).getTime()
  const diff = now - d
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}

export function shortUuid(uuid: string): string {
  if (!uuid || uuid.length < 8) return uuid
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/.test(uuid)) {
    return uuid.slice(0, 8)
  }
  return uuid
}

export function truncate(str: string, len = 50) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}
