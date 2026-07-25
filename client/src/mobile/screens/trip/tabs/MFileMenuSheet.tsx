import { useEffect, useRef, useState } from 'react'
import { Download, Link2, Trash2 } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import MListRow from '../../../components/MListRow'
import MConfirmSheet from '../../settings/MConfirmSheet'
import { downloadFile } from '../../../../utils/fileDownload'
import { filesApi } from '../../../../api/client'
import type { TripFile } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { Eyebrow, TileHeader } from '../sheets/MTripSheetUi'
import { formatFileDate, getFileTypeMeta } from './filesModel'
import { useTranslation } from '../../../../i18n'
import { formatSize } from '../../../../components/Files/FileManager.helpers'

interface MFileMenuSheetProps {
  planner: TripPlanner
  /** null closes the sheet; kept mounted through the exit animation via heldRef. */
  file: TripFile | null
  onClose: () => void
  onOpenLinks: (file: TripFile) => void
}

/**
 * Kebab context menu for a file row (spec 03 §5.2/§5.3 f.menuGo): the file
 * note (desktop's only "rename" — there is no original_name-rename endpoint,
 * see report), download, link-to-place/booking and delete-to-trash. Reachable
 * regardless of permissions; the sensitive rows gate themselves (§7.6).
 */
export default function MFileMenuSheet({ planner, file, onClose, onOpenLinks }: MFileMenuSheetProps) {
  const { t, tripId, can, trip, tripActions, toast } = planner
  const { locale } = useTranslation()
  const open = file != null

  // Hold the last file so the sheet content survives the 280ms exit animation.
  const heldRef = useRef<TripFile | null>(file)
  if (file) heldRef.current = file
  const shown = file ?? heldRef.current

  const [noteDraft, setNoteDraft] = useState(shown?.description || '')
  useEffect(() => {
    setNoteDraft(shown?.description || '')
    // Reset the draft only when the sheet targets a different file, not on
    // every background files refetch (which would clobber an in-progress edit).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown?.id])

  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!shown) return <MSheet open={false} onClose={onClose} variant="card" material="glass" />

  const canEdit = can('file_edit', trip)
  const canDelete = can('file_delete', trip)
  const meta = getFileTypeMeta(shown)
  const TypeIcon = meta.icon

  const commitNote = () => {
    const value = noteDraft.trim()
    if (value === (shown.description || '')) return
    setSaving(true)
    filesApi.update(tripId, shown.id, { description: value })
      .then(() => tripActions.loadFiles(tripId))
      .catch(() => toast.error(t('files.toast.assignError')))
      .finally(() => setSaving(false))
  }

  const download = () => { downloadFile(shown.url, shown.original_name).catch(() => {}) }

  const remove = () => {
    setConfirmDelete(false)
    setDeleting(true)
    tripActions.deleteFile(tripId, shown.id)
      .then(() => { toast.success(t('files.toast.trashed')); onClose() })
      .catch(() => toast.error(t('files.toast.deleteError')))
      .finally(() => setDeleting(false))
  }

  return (
    <>
      <MSheet open={open} onClose={onClose} variant="card" material="glass" ariaLabel={shown.original_name}>
        <div className="flex-none px-[18px] pt-4">
          <TileHeader
            icon={<TypeIcon size={19} strokeWidth={1.8} style={{ color: meta.color }} />}
            title={<span className="truncate">{shown.original_name}</span>}
            sub={[formatSize(shown.file_size), formatFileDate(shown.created_at, locale)].filter(Boolean).join(' · ')}
            onClose={onClose}
            closeLabel={t('common.close')}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px]">
          {canEdit && (
            <div className="mt-3">
              <Eyebrow className="mb-[6px]">{t('files.noteLabel')}</Eyebrow>
              <input
                value={noteDraft}
                onChange={e => setNoteDraft(e.target.value)}
                onBlur={commitNote}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                placeholder={t('files.notePlaceholder')}
                disabled={saving}
                className="w-full rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[9px] text-[0.8125rem] font-medium text-m-ink outline-none disabled:opacity-60"
              />
            </div>
          )}

          <div className="mt-3 flex flex-col gap-[2px]">
            <MListRow icon={Download} label={t('files.download')} onClick={download} />
            {canEdit && (
              <MListRow icon={Link2} label={t('files.link')} onClick={() => onOpenLinks(shown)} />
            )}
            {canDelete && (
              <MListRow icon={Trash2} label={t('common.delete')} danger onClick={() => setConfirmDelete(true)} />
            )}
          </div>
        </div>
      </MSheet>

      <MConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('common.delete')}
        message={t('files.confirm.delete')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        busy={deleting}
        onConfirm={remove}
      />
    </>
  )
}
