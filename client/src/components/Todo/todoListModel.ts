import type { CSSProperties } from 'react'

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
  for (let i = 0; i < kat.length; i++) h = ((h << 5) - h + kat.codePointAt(i)) | 0
  return KAT_COLORS[Math.abs(h) % KAT_COLORS.length]
}

export type FilterType = 'all' | 'my' | 'overdue' | 'done' | string

export interface Member { id: number; username: string; avatar: string | null; is_guest?: boolean }

/** A task's editable fields as its form holds them: empty strings where the task has nothing. */
export interface TaskFieldValues {
  desc: string
  priority: number
  category: string
  dueDate: string
  assignedUserId: number | null
}

/** The label and field look of the task form, shared by the detail pane and the new-task dialog. */
export const taskLabelClass = 'mb-1.5 block text-caption font-semibold text-content-muted'
export const taskInputStyle: CSSProperties = {
  width: '100%', fontSize: 'calc(13px * var(--fs-scale-body, 1))', padding: '9px 11px', border: '1px solid var(--border-primary)',
  borderRadius: 10, background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
}
