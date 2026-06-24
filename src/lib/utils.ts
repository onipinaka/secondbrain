import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeUrl(url: string | null | undefined): string {
  if (!url) return '#'
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  return 'https://' + url
}

// Returns today's date as YYYY-MM-DD in LOCAL timezone (not UTC).
// Use for all date-only DB fields. new Date().toISOString() gives UTC which
// shifts the date before 5:30 AM in IST.
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Returns an ISO-8601 string in local timezone (no UTC conversion).
// Use for timestamp fields when you want the local wall-clock time stored.
export function localISOString(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${localDateStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${ms}`
}
