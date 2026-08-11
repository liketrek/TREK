import { useState, useRef } from 'react'
import { useTripStore } from '../store/tripStore'
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
    setNoteUi((prev) => ({ ...prev, [dayId]: { mode: 'add', text: '', time: '', icon: 'FileText', color: null, sortOrder: maxKey + 1 } }))
    expandDay?.(dayId)
    setTimeout(() => noteInputRef.current?.focus(), 50)
  }

  const openEditNote = (dayId: number, note: DayNote) => {
    setNoteUi((prev) => ({ ...prev, [dayId]: { mode: 'edit', noteId: note.id, text: note.text, time: note.time || '', icon: note.icon || 'FileText', color: note.color ?? null } }))
    setTimeout(() => noteInputRef.current?.focus(), 50)
  }

  const cancelNote = (dayId: number) => {
    setNoteUi((prev) => { const n = { ...prev }; delete n[dayId]; return n })
  }

  const saveNote = async (dayId: number) => {
    const ui = noteUi[dayId]
    if (!ui?.text?.trim()) return
    try {
      if (ui.mode === 'add') {
        await tripStore.addDayNote(tripId, dayId, { text: ui.text.trim(), time: ui.time || null, icon: ui.icon || 'FileText', color: ui.color ?? null, sort_order: ui.sortOrder })
      } else {
        await tripStore.updateDayNote(tripId, dayId, ui.noteId!, { text: ui.text.trim(), time: ui.time || null, icon: ui.icon || 'FileText', color: ui.color })
      }
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
