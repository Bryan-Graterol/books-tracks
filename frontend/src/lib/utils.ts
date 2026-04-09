import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ReadingStatus, NoteType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function readingProgress(currentPage: number, totalPages?: number): number {
  if (!totalPages || totalPages === 0) return 0
  return Math.min(Math.round((currentPage / totalPages) * 100), 100)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  want_to_read: 'Want to Read',
  reading: 'Reading',
  paused: 'Paused',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

export const STATUS_COLOR: Record<ReadingStatus, string> = {
  want_to_read: 'bg-zinc-700 text-zinc-300',
  reading: 'bg-amber-400/15 text-amber-400',
  paused: 'bg-blue-400/15 text-blue-400',
  completed: 'bg-green-400/15 text-green-400',
  abandoned: 'bg-red-400/15 text-red-400',
}

export const NOTE_COLOR: Record<NoteType, string> = {
  highlight: 'bg-amber-400/15 text-amber-400',
  quote: 'bg-purple-400/15 text-purple-400',
  reflection: 'bg-blue-400/15 text-blue-400',
  bookmark: 'bg-zinc-600/40 text-zinc-300',
}

export const NOTE_ICON: Record<NoteType, string> = {
  highlight: '✦',
  quote: '"',
  reflection: '◈',
  bookmark: '⊕',
}
