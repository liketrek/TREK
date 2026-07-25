import { useEffect, useState } from 'react'
import { Loader2, RotateCcw, Trash2 } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MConfirmSheet from '../../settings/MConfirmSheet'
import { filesApi } from '../../../../api/client'
import type { TripFile } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { TileHeader } from '../sheets/MTripSheetUi'
import { formatFileDate, getFileTypeMeta } from './filesModel'
import { useTranslation } from '../../../../i18n'
import { formatSize } from '../../../../components/Files/FileManager.helpers'

interface MFileTrashSheetProps {
  planner: TripPlanner
  open: boolean
  onClose: () => void
}

/**
 * Trash sheet (spec 03 §5.3 trashGo, §7.3): fetches the trashed files
 * (filesApi.list(tripId, true)) on open, same lazy-load-on-toggle pattern as
 * useFileManager.ts's toggleTrash/loadTrash. Restore/permanent-delete/empty
 * all bypass the store like the rest of §7.3.
 */
export default function MFileTrashSheet({ planner, open, onClose }: MFileTrashSheetProps) {
  const { t, tripId, can, trip, toast, tripActions } = planner
  const { locale } = useTranslation()
  const [files, setFiles] = useState<TripFile[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    filesApi.list(tripId, true)
      .then((data: { files?: TripFile[] }) => { if (!cancelled) setFiles(data.files || []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, tripId])

  const canDelete = can('file_delete', trip)

  const restore = (id: number) => {
    setBusyId(id)
    filesApi.restore(tripId, id)
      .then(() => {
        setFiles(prev => prev.filter(f => f.id !== id))
        tripActions.loadFiles(tripId)
        toast.success(t('files.toast.restored'))
      })
      .catch(() => toast.error(t('files.toast.restoreError')))
      .finally(() => setBusyId(null))
  }

  const permanentDelete = (id: number) => {
    setConfirmDeleteId(null)
    setBusyId(id)
    filesApi.permanentDelete(tripId, id)
      .then(() => {
        setFiles(prev => prev.filter(f => f.id !== id))
        toast.success(t('files.toast.deleted'))
      })
      .catch(() => toast.error(t('files.toast.deleteError')))
      .finally(() => setBusyId(null))
  }

  const emptyTrash = () => {
    setConfirmEmpty(false)
    filesApi.emptyTrash(tripId)
      .then(() => { setFiles([]); toast.success(t('files.toast.trashEmptied')) })
      .catch(() => toast.error(t('files.toast.deleteError')))
  }

  return (
    <>
      <MSheet open={open} onClose={onClose} variant="card" material="glass" ariaLabel={t('files.trash')}>
        <div className="flex-none px-[18px] pt-4">
          <TileHeader icon={<Trash2 size={19} strokeWidth={1.8} />} title={t('files.trash')} onClose={onClose} closeLabel={t('common.close')} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px]">
          {files.length > 0 && canDelete && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setConfirmEmpty(true)}
                className="font-geist text-[0.6875rem] font-bold text-[color:var(--m-st-danger)]"
              >
                {t('files.emptyTrash')}
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-m-faint" />
            </div>
          ) : files.length === 0 ? (
            <div className="py-10 text-center font-geist text-[0.78125rem] text-m-faint">{t('files.trashEmpty')}</div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {files.map(file => {
                const meta = getFileTypeMeta(file)
                const TypeIcon = meta.icon
                const busy = busyId === file.id
                return (
                  <div key={file.id} className="flex items-center gap-[10px] rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-3 py-[9px] opacity-80">
                    <span
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px]"
                      style={{ background: `${meta.color}22`, color: meta.color }}
                    >
                      <TypeIcon size={15} strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.78125rem] font-semibold text-m-ink">{file.original_name}</div>
                      <div className="mt-[2px] font-geist text-[0.625rem] text-m-faint">
                        {[formatSize(file.file_size), formatFileDate(file.created_at, locale)].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    {canDelete && (
                      <div className="flex flex-none items-center gap-1">
                        <button
                          type="button"
                          aria-label={t('files.restore')}
                          onClick={() => restore(file.id)}
                          disabled={busy}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted disabled:opacity-50"
                        >
                          {busy ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} strokeWidth={2} />}
                        </button>
                        <button
                          type="button"
                          aria-label={t('common.delete')}
                          onClick={() => setConfirmDeleteId(file.id)}
                          disabled={busy}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--m-ic)] text-[color:var(--m-st-danger)] disabled:opacity-50"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </MSheet>

      <MConfirmSheet
        open={confirmEmpty}
        onClose={() => setConfirmEmpty(false)}
        title={t('files.emptyTrash')}
        message={t('files.confirm.emptyTrash')}
        confirmLabel={t('files.emptyTrash')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={emptyTrash}
      />
      <MConfirmSheet
        open={confirmDeleteId != null}
        onClose={() => setConfirmDeleteId(null)}
        title={t('common.delete')}
        message={t('files.confirm.permanentDelete')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => { if (confirmDeleteId != null) permanentDelete(confirmDeleteId) }}
      />
    </>
  )
}
