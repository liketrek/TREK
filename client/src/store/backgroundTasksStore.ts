import { create } from 'zustand'
import type { BookingImportPreviewItem } from '@trek/shared'

/**
 * Tracks booking-import parses that run in the BACKGROUND (the async endpoint).
 * The upload modal closes the moment a parse starts and adds a task here; the
 * server pushes import:progress / import:done / import:error over the user's
 * WebSocket (which reaches every page), and the global BackgroundTasksWidget
 * renders the list. The trip page turns a finished task into the review flow.
 *
 * Memory-only (no persist): a parse is tied to a live server job and WebSocket,
 * so it shouldn't survive a reload.
 */
export interface BackgroundImportTask {
  id: string                 // server job id
  tripId: string
  label: string              // file name(s) being parsed
  status: 'running' | 'done' | 'error'
  done: number
  total: number
  items?: BookingImportPreviewItem[]
  warnings?: string[]
  error?: string
  reviewRequested?: boolean  // user clicked "review" — the trip page consumes it
  consumed?: boolean         // review has been handed to the trip page
}

interface BackgroundTasksState {
  tasks: BackgroundImportTask[]
  addTask: (task: { id: string; tripId: string; label: string; total: number }) => void
  setProgress: (id: string, tripId: string, done: number, total: number) => void
  setDone: (id: string, tripId: string, items: BookingImportPreviewItem[], warnings: string[]) => void
  setError: (id: string, tripId: string, error: string) => void
  requestReview: (id: string) => void
  markConsumed: (id: string) => void
  dismiss: (id: string) => void
}

export const useBackgroundTasksStore = create<BackgroundTasksState>((set) => {
  /** Update an existing task by id, or insert a fresh one (events can arrive before addTask). */
  const upsert = (id: string, tripId: string, patch: Partial<BackgroundImportTask>) =>
    set((state) => {
      const idx = state.tasks.findIndex((t) => t.id === id)
      if (idx === -1) {
        const base: BackgroundImportTask = { id, tripId, label: 'Import', status: 'running', done: 0, total: 1 }
        return { tasks: [...state.tasks, { ...base, ...patch }] }
      }
      const tasks = state.tasks.slice()
      tasks[idx] = { ...tasks[idx], ...patch }
      return { tasks }
    })

  return {
    tasks: [],
    addTask: ({ id, tripId, label, total }) => upsert(id, tripId, { label, total, status: 'running', done: 0 }),
    setProgress: (id, tripId, done, total) => upsert(id, tripId, { done, total, status: 'running' }),
    setDone: (id, tripId, items, warnings) => upsert(id, tripId, { status: 'done', items, warnings, done: items?.length ?? 0 }),
    setError: (id, tripId, error) => upsert(id, tripId, { status: 'error', error }),
    requestReview: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, reviewRequested: true } : t)) })),
    markConsumed: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, consumed: true, reviewRequested: false } : t)) })),
    dismiss: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  }
})
