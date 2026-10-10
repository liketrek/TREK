import { useState, useRef } from 'react'
import { useTripStore, type TripStoreState } from '../store/tripStore'
import { useToast } from '../components/shared/Toast'
import { useTranslation } from '../i18n'
import type { MergedItem, DayNotesMap, DayNote } from '../types'

interface NoteUiState {
  mode: 'add' | 'edit'
  noteId?: number
  text: string
  time: string
  icon: string
  /** One of NOTE_COLORS, or null for the neutral card (#1629). Absent on a
   *  caller that predates colours, which then leaves the stored one alone. */
  color?: string | null
  sortOrder?: number
}

interface NoteUiMap {
  [dayId: string]: NoteUiState
}

/** A note's editable fields as the editor holds them; a new note starts blank, with the default icon and no colour. */
export function dayNoteDraft(note?: Pick<DayNote, 'text' | 'time' | 'icon' | 'color'> | null) {
  return { text: note?.text || '', time: note?.time || '', icon: note?.icon || 'FileText', color: note?.color ?? null }
}

/** Where a saved note goes: a new one at a place in the day's order, or an existing one. */
export type DayNoteTarget = { add: true; sortOrder?: number } | { add: false; noteId: number }

/**
 * Saves a day note from either editor, the desktop dialog or the phone sheet. The
 * title is trimmed and an empty detail line is stored as null. On an existing note
 * an undefined `color` leaves its colour as it is. Throws when the write is refused.
 */
export async function writeDayNote(
  actions: Pick<TripStoreState, 'addDayNote' | 'updateDayNote'>,
  tripId: number | string,
  dayId: number,
  target: DayNoteTarget,
  draft: { text: string; time: string; icon: string; color?: string | null },
) {
  const fields = { text: draft.text.trim(), time: draft.time || null, icon: draft.icon || 'FileText' }
  if ('noteId' in target) await actions.updateDayNote(tripId, dayId, target.noteId, { ...fields, color: draft.color })
  else await actions.addDayNote(tripId, dayId, { ...fields, color: draft.color ?? null, sort_order: target.sortOrder })
}

export function useDayNotes(tripId: number | string) {
  const [noteUi, setNoteUi] = useState<NoteUiMap>({})
  const noteInputRef = useRef<HTMLInputElement | null>(null)
  const tripStore = useTripStore()
  const toast = useToast()
  const { t } = useTranslation()
  const dayNotes: DayNotesMap = tripStore.dayNotes || {}

  const openAddNote = (dayId: number, getMergedItems: (dayId: number) => MergedItem[], expandDay?: (dayId: number) => void) => {
    const merged = getMergedItems(dayId)
    const maxKey = merged.length > 0 ? Math.max(...merged.map((i) => i.sortKey)) : -1
    setNoteUi((prev) => ({ ...prev, [dayId]: { mode: 'add', ...dayNoteDraft(), sortOrder: maxKey + 1 } }))
    expandDay?.(dayId)
    setTimeout(() => noteInputRef.current?.focus(), 50)
  }

  const openEditNote = (dayId: number, note: DayNote) => {
    setNoteUi((prev) => ({ ...prev, [dayId]: { mode: 'edit', noteId: note.id, ...dayNoteDraft(note) } }))
    setTimeout(() => noteInputRef.current?.focus(), 50)
  }

  const cancelNote = (dayId: number) => {
    setNoteUi((prev) => { const n = { ...prev }; delete n[dayId]; return n })
  }

  const saveNote = async (dayId: number) => {
    const ui = noteUi[dayId]
    if (!ui?.text?.trim()) return
    try {
      await writeDayNote(tripStore, tripId, dayId, ui.mode === 'add' ? { add: true, sortOrder: ui.sortOrder } : { add: false, noteId: ui.noteId! }, ui)
      cancelNote(dayId)
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }

  const deleteNote = async (dayId: number, noteId: number) => {
    try { await tripStore.deleteDayNote(tripId, dayId, noteId) }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }

  const moveNote = async (dayId: number, noteId: number, direction: 'up' | 'down', getMergedItems: (dayId: number) => MergedItem[]) => {
    const merged = getMergedItems(dayId)
    const idx = merged.findIndex((i) => i.type === 'note' && (i.data as DayNote).id === noteId)
    if (idx === -1) return
    let newSortOrder: number
    if (direction === 'up') {
      if (idx === 0) return
      newSortOrder = idx >= 2 ? (merged[idx - 2].sortKey + merged[idx - 1].sortKey) / 2 : merged[idx - 1].sortKey - 1
    } else {
      if (idx >= merged.length - 1) return
      newSortOrder = idx < merged.length - 2 ? (merged[idx + 1].sortKey + merged[idx + 2].sortKey) / 2 : merged[idx + 1].sortKey + 1
    }
    try { await tripStore.updateDayNote(tripId, dayId, noteId, { sort_order: newSortOrder }) }
    catch (err: unknown) { toast.error(err instanceof Error ? err.message : t('common.unknownError')) }
  }

  return { noteUi, setNoteUi, noteInputRef, dayNotes, openAddNote, openEditNote, cancelNote, saveNote, deleteNote, moveNote }
}
