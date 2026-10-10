import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useToast } from '../shared/Toast'
import { useTranslation, translateApiError } from '../../i18n'
import { filesApi } from '../../api/client'
import type { Place, Reservation, TripFile, Day, AssignmentsMap } from '../../types'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import { useAuthStore } from '../../store/authStore'
import { canManageDocSync } from './docsync/useDocSync'
import { useDocSyncOffered } from './docsync/useDocSyncOffered'
import { getAuthUrl } from '../../api/authUrl'
import { isMedia, isWalletPass } from './FileManager.helpers'
import { openFile as openFileInTab } from '../../utils/fileDownload'
import { useFileTrash } from './useFileTrash'
import { DESKTOP_FILE_TRASH_TOAST_RULES, filesFromClipboard, trashFileWithToast, updateFileFields } from './fileActions'
import { matchesFileFilter } from './fileListRules'

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
  const [showDocSync, setShowDocSync] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showTrash, setShowTrash] = useState(false)
  const toast = useToast()
  const can = useCanDo()
  const trip = useTripStore((s) => s.trip)
  const currentUser = useAuthStore((s) => s.user)
  const maxUploadMb = useAuthStore((s) => s.maxUploadMb)
  const canManageSync = canManageDocSync(currentUser, trip)
  const docSyncOffered = useDocSyncOffered(tripId, canManageSync)
  const { t, locale } = useTranslation()

  // onUpdate doubles as the "files changed" signal towards the parent; the arguments carry no payload.
  const refreshFiles = useCallback(async () => {
    if (onUpdate) void onUpdate(0, {} as any)
  }, [onUpdate])

  const trash = useFileTrash({ tripId, t, toast, onRestored: refreshFiles })
  const { load: loadTrash } = trash
  const trashFiles = trash.files
  const loadingTrash = trash.loading

  const toggleTrash = useCallback(() => {
    if (!showTrash) loadTrash()
    setShowTrash(v => !v)
  }, [showTrash, loadTrash])

  const handleStar = async (fileId: number) => {
    try {
      await filesApi.toggleStar(tripId, fileId)
      refreshFiles()
    } catch { /* */ }
  }

  const handleRestore = trash.restore

  const handlePermanentDelete = async (fileId: number) => {
    if (!confirm(t('files.confirm.permanentDelete'))) return
    await trash.permanentDelete(fileId)
  }

  const handleEmptyTrash = async () => {
    if (!confirm(t('files.confirm.emptyTrash'))) return
    await trash.emptyTrash()
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
    } catch (err) {
      toast.error(translateApiError(t, err, 'files.uploadError'))
    } finally {
      setUploading(false)
    }
  }, [onUpload, toast, t, places, reservations])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxUploadMb * 1024 * 1024,
    // A file over the limit used to vanish without a word; say why it was left out.
    onDropRejected: rejections => {
      if (rejections.some(r => r.errors.some(e => e.code === 'file-too-large'))) {
        toast.error(t('files.uploadErrorSize', { max: maxUploadMb }))
      }
    },
    noClick: false,
  })

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (!can('file_upload', trip)) return
    const pastedFiles = filesFromClipboard(e.clipboardData)
    if (pastedFiles.length > 0) {
      e.preventDefault()
      onDrop(pastedFiles)
    }
  }, [onDrop])

  const filteredFiles = files.filter(f => matchesFileFilter(f, filterType))

  const handleDelete = (id) => trashFileWithToast(() => onDelete(id), { t, toast }, DESKTOP_FILE_TRASH_TOAST_RULES)

  useEffect(() => {
    if (previewFile) {
      void getAuthUrl(previewFile.url, 'download').then(setPreviewFileUrl)
    } else {
      setPreviewFileUrl('')
    }
  }, [previewFile?.url])

  const handleAssign = (fileId: number, data: { place_id?: number | null; reservation_id?: number | null }) =>
    updateFileFields(tripId, fileId, data, { t, toast, refresh: refreshFiles })

  // Image OR video — both open in the lightbox; videos play there (#823).
  const mediaFiles = filteredFiles.filter(f => isMedia(f.mime_type))

  const openFile = (file) => {
    if (isMedia(file.mime_type)) {
      const idx = mediaFiles.findIndex(f => f.id === file.id)
      setLightboxIndex(idx >= 0 ? idx : 0)
    } else if (isWalletPass(file.mime_type, file.original_name)) {
      // Download so the OS hands the pass to Apple Wallet (#1447) rather than
      // forcing it into the in-app PDF preview.
      openFileInTab(file.url, file.original_name).catch(() => {})
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
    handleAssign, mediaFiles, openFile,
    showDocSync, setShowDocSync, canManageSync, docSyncOffered,
  }
}

export type FileManagerState = ReturnType<typeof useFileManager>
