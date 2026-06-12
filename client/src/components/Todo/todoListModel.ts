// Pure constants + helpers + types for the todo list. No React, no side effects.

export const KAT_COLORS = [
  '#3b82f6', '#a855f7', '#ec4899', '#22c55e', '#f97316',
  '#06b6d4', '#ef4444', '#eab308', '#8b5cf6', '#14b8a6',
]

export const PRIO_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'P1', color: '#ef4444' },
  2: { label: 'P2', color: '#f59e0b' },
  3: { label: 'P3', color: '#3b82f6' },
}

export function katColor(kat: string, allCategories: string[]) {
  const idx = allCategories.indexOf(kat)
  if (idx >= 0) return KAT_COLORS[idx % KAT_COLORS.length]
  let h = 0
  for (let i = 0; i < kat.length; i++) h = ((h << 5) - h + kat.charCodeAt(i)) | 0
  return KAT_COLORS[Math.abs(h) % KAT_COLORS.length]
}

export type FilterType = 'all' | 'my' | 'overdue' | 'done' | string

export interface Member { id: number; username: string; avatar: string | null }
