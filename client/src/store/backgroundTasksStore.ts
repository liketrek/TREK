import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BookingImportPreviewItem } from '@trek/shared'

/**
 * Tracks booking-import parses that run in the BACKGROUND (the async endpoint).
 * The upload modal closes the moment a parse starts and adds a task here; the
 * server pushes import:progress / import:done / import:error over the user's
 * WebSocket (which reaches every page), and the global BackgroundTasksWidget
 * renders the list. The trip page turns a finished task into the review flow.
 *
 * Persisted (minimal): the server keeps the job for ~10 min and exposes a status
 * endpoint, so a reload mid-parse must NOT drop the widget — we persist the running
 * (and finished-but-unreviewed) tasks by id and the widget re-fetches their status
 * on mount. We deliberately persist neither the parsed `items` (re-fetched) nor the
 * transient review flags (so a reload never auto-reopens the review flow).
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
  /** The uploaded files this parse ran on — kept in memory so the review can attach the
   *  source document to each created booking. Not persisted (a File can't survive a reload). */
  sourceFiles?: File[]
}

interface BackgroundTasksState {
  tasks: BackgroundImportTask[]
  addTask: (task: { id: string; tripId: string; label: string; total: number; files?: File[] }) => void
  setProgress: (id: string, tripId: string, done: number, total: number) => void
  setDone: (id: string, tripId: string, items: BookingImportPreviewItem[], warnings: string[]) => void
  setError: (id: string, tripId: string, error: string) => void
  requestReview: (id: string) => void
  markConsumed: (id: string) => void
  dismiss: (id: string) => void
}

export const useBackgroundTasksStore = create<BackgroundTasksState>()(
  persist(
    (set) => {
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
        addTask: ({ id, tripId, label, total, files }) => upsert(id, tripId, { label, total, status: 'running', done: 0, sourceFiles: files }),
        setProgress: (id, tripId, done, total) => upsert(id, tripId, { done, total, status: 'running' }),
        setDone: (id, tripId, items, warnings) => upsert(id, tripId, { status: 'done', items, warnings, done: items?.length ?? 0 }),
        setError: (id, tripId, error) => upsert(id, tripId, { status: 'error', error }),
        requestReview: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, reviewRequested: true } : t)) })),
        markConsumed: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, consumed: true, reviewRequested: false } : t)) })),
        dismiss: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      }
    },
    {
      name: 'trek.bg-import-tasks',
      // Persist only what survives a reload usefully: the job id/trip/label and a coarse
      // status. The widget re-fetches each job's real status (and parsed items) on mount,
      // so we keep neither the heavy `items`/`warnings` nor the transient review flags —
      // that also guarantees a reload never re-opens the review flow on its own.
      partialize: (state) => ({
        tasks: state.tasks
          .filter((t) => !t.consumed && t.status !== 'error')
          .map((t) => ({ id: t.id, tripId: t.tripId, label: t.label, status: t.status, done: t.done, total: t.total })),
      }),
    },
  ),
)
