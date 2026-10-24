import { useState, type DragEvent } from 'react'
import { journeyApi } from '../../api/client'
import { getApiErrorMessage } from '../../types'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'

/** The list with the item at `from` taken out and put back at `to`. */
export function movedTo<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item)
  return next
}

/**
 * The order of an entry's photos (#824): drag one onto another's place, or send
 * one to the front. One request for the whole order; the order is shared with the
 * other members, the share page and the PDF, so a refused write goes back.
 */
export function useEntryPhotoOrder<T extends { id: number }>(entryId: number, photos: T[], setPhotos: (next: T[]) => void) {
  const { t } = useTranslation()
  const toast = useToast()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const commit = (next: T[]) => {
    if (next === photos) return
    const before = photos
    setPhotos(next)
    journeyApi.reorderEntryPhotos(entryId, next.map(p => p.id)).catch((err: unknown) => {
      toast.error(getApiErrorMessage(err, t('common.error')))
      setPhotos(before)
    })
  }

  const reset = () => { setDragIndex(null); setOverIndex(null) }

  const dragProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => { e.dataTransfer.effectAllowed = 'move'; setDragIndex(index) },
    onDragOver: (e: DragEvent) => { if (dragIndex === null) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverIndex(index) },
    onDrop: (e: DragEvent) => { e.preventDefault(); if (dragIndex !== null) commit(movedTo(photos, dragIndex, index)); reset() },
    onDragEnd: reset,
  })

  return {
    makeFirst: (index: number) => commit(movedTo(photos, index, 0)),
    dragProps,
    dragIndex,
    overIndex,
  }
}
