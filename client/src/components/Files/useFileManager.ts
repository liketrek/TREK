import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { filesApi } from '../../api/client'
import type { Place, Reservation, TripFile, Day, AssignmentsMap } from '../../types'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { getAuthUrl } from '../../api/authUrl'
import { isImage } from './FileManager.helpers'

export interface FileManagerProps {
  files?: TripFile[]
  onUpload: (fd: FormData) => Promise<any>
  onDelete: (fileId: number) => Promise<void>
  onUpdate?: (fileId: number, data: Partial<TripFile>) => Promise<void>
  places: Place[]
  days?: Day[]
  assignments?: AssignmentsMap
  reservations?: Reservation[]
  tripId: number
  allowedFileTypes?: string | null
}

/**
 * File manager state: upload (dropzone + paste), star/trash/restore, the
 * filter tabs, lightbox + PDF preview and the assign-to-place/reservation
 * modal. Kept in one hook so FileManager renders as thin layout sections.
 */
export function useFileManager({ files = [], onUpload, onDelete, onUpdate, places, days = [], assignments = {}, reservations = [], tripId, allowedFileTypes }: FileManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const [trashFiles, setTrashFiles] = useState<TripFile[]>([])
  const [loadingTrash, setLoadingTrash] = useState(false)
  const toast = useToast()
  const can = useCanDo()
  const trip = useTripStore((s) => s.trip)
  const { t, locale } = useTranslation()

  const loadTrash = useCallback(async () => {
    setLoadingTrash(true)
    try {
      const data = await filesApi.list(tripId, true)
      setTrashFiles(data.files || [])
    } catch { /* */ }
    setLoadingTrash(false)
  }, [tripId])

  const toggleTrash = useCallback(() => {
    if (!showTrash) loadTrash()
    setShowTrash(v => !v)
  }, [showTrash, loadTrash])

  const refreshFiles = useCallback(async () => {
    if (onUpdate) onUpdate(0, {} as any)
  }, [onUpdate])

  const handleStar = async (fileId: number) => {
    try {
      await filesApi.toggleStar(tripId, fileId)
      refreshFiles()
    } catch { /* */ }
  }

  const handleRestore = async (fileId: number) => {
    try {
      await filesApi.restore(tripId, fileId)
      setTrashFiles(prev => prev.filter(f => f.id !== fileId))
      refreshFiles()
      toast.success(t('files.toast.restored'))
    } catch {
      toast.error(t('files.toast.restoreError'))
    }
  }

  const handlePermanentDelete = async (fileId: number) => {
    if (!confirm(t('files.confirm.permanentDelete'))) return
    try {
      await filesApi.permanentDelete(tripId, fileId)
      setTrashFiles(prev => prev.filter(f => f.id !== fileId))
      toast.success(t('files.toast.deleted'))
    } catch {
      toast.error(t('files.toast.deleteError'))
    }
  }

  const handleEmptyTrash = async () => {
    if (!confirm(t('files.confirm.emptyTrash'))) return
    try {
      await filesApi.emptyTrash(tripId)
      setTrashFiles([])
      toast.success(t('files.toast.trashEmptied') || 'Trash emptied')
    } catch {
      toast.error(t('files.toast.deleteError'))
    }
  }

  const [previewFile, setPreviewFile] = useState(null)
  const [previewFileUrl, setPreviewFileUrl] = useState('')
  const [assignFileId, setAssignFileId] = useState<number | null>(null)

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    setUploading(true)
    const uploadedIds: number[] = []
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        const result = await onUpload(formData)
        const fileObj = result?.file || result
        if (fileObj?.id) uploadedIds.push(fileObj.id)
      }
      toast.success(t('files.uploaded', { count: acceptedFiles.length }))
      // Open assign modal for the last uploaded file
      const lastId = uploadedIds[uploadedIds.length - 1]
      if (lastId && (places.length > 0 || reservations.length > 0)) {
        setAssignFileId(lastId)
      }
    } catch {
      toast.error(t('files.uploadError'))
    } finally {
      setUploading(false)
    }
  }, [onUpload, toast, t, places, reservations])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024,
    noClick: false,
  })

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (!can('file_upload', trip)) return
    const items = e.clipboardData?.items
    if (!items) return
    const pastedFiles: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) pastedFiles.push(file)
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault()
      onDrop(pastedFiles)
    }
  }, [onDrop])

  const filteredFiles = files.filter(f => {
    if (filterType === 'starred') return !!f.starred
    if (filterType === 'pdf') return f.mime_type === 'application/pdf'
    if (filterType === 'image') return isImage(f.mime_type)
    if (filterType === 'doc') return (f.mime_type || '').includes('word') || (f.mime_type || '').includes('excel') || (f.mime_type || '').includes('text')
    if (filterType === 'collab') return !!f.note_id
    return true
  })

  const handleDelete = async (id) => {
    try {
      await onDelete(id)
      toast.success(t('files.toast.trashed') || 'Moved to trash')
    } catch {
      toast.error(t('files.toast.deleteError'))
    }
  }

  useEffect(() => {
    if (previewFile) {
      getAuthUrl(previewFile.url, 'download').then(setPreviewFileUrl)
    } else {
      setPreviewFileUrl('')
    }
  }, [previewFile?.url])

  const handleAssign = async (fileId: number, data: { place_id?: number | null; reservation_id?: number | null }) => {
    try {
      await filesApi.update(tripId, fileId, data)
      refreshFiles()
    } catch {
      toast.error(t('files.toast.assignError'))
    }
  }

  const imageFiles = filteredFiles.filter(f => isImage(f.mime_type))

  const openFile = (file) => {
    if (isImage(file.mime_type)) {
      const idx = imageFiles.findIndex(f => f.id === file.id)
      setLightboxIndex(idx >= 0 ? idx : 0)
    } else {
      setPreviewFile(file)
    }
  }

  return {
    files, places, days, assignments, reservations, tripId, allowedFileTypes,
    uploading, filterType, setFilterType, lightboxIndex, setLightboxIndex,
    showTrash, trashFiles, loadingTrash, toast, can, trip, t, locale,
    toggleTrash, refreshFiles, handleStar, handleRestore, handlePermanentDelete, handleEmptyTrash,
    previewFile, setPreviewFile, previewFileUrl, assignFileId, setAssignFileId,
    getRootProps, getInputProps, isDragActive, handlePaste, filteredFiles, handleDelete,
    handleAssign, imageFiles, openFile,
  }
}

export type FileManagerState = ReturnType<typeof useFileManager>
