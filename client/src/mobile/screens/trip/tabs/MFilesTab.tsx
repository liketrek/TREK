import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent } from 'react'
import { Link, Loader2, MoreVertical, Star } from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import { useTranslation, translateApiError } from '../../../../i18n'
import { filesApi } from '../../../../api/client'
import { openFile } from '../../../../utils/fileDownload'
import { isMedia, formatSize } from '../../../../components/Files/FileManager.helpers'
import type { TripFile } from '../../../../types'
import { TabScroller } from './tabChrome'
import type { MTabScreenProps } from './tabModel'
import MFileMenuSheet from './MFileMenuSheet'
import MFileLinkSheet from './MFileLinkSheet'
import MFileTrashSheet from './MFileTrashSheet'
import MFileLightbox from './MFileLightbox'
import {
  FILE_FILTERS, buildFileLinkLabels, formatFileDate, getFileTypeMeta,
  matchesFileFilter, sortFilesStarredFirst, type FileFilterId,
} from './filesModel'

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

/**
 * Tab 5 — Dateien. Real `planner.files` (already non-deleted, §7.2), the
 * filter grid + starred-first sort from filesModel.ts, and a row per file
 * (spec 03 §5.2). Upload and Trash are triggered from the shell's header
 * (shell.uploadFilesSignal / shell.openFilesTrashSignal, watched below, same
 * pattern as useTodoList.ts's addItemSignal) since those buttons live outside
 * this panel. Star/rename-note/link run straight against filesApi (§7.3);
 * add/delete run through planner.tripActions (§7.3 — the only two file
 * mutations the store owns).
 */
export default function MFilesTab({ planner, shell }: MTabScreenProps) {
  const { t } = planner
  const files = planner.files || []

  const [filter, setFilter] = useState<FileFilterId>('all')
  const [menuFileId, setMenuFileId] = useState<number | null>(null)
  const [linkFileId, setLinkFileId] = useState<number | null>(null)
  const [trashOpen, setTrashOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)

  const menuFile = menuFileId != null ? files.find(f => f.id === menuFileId) ?? null : null
  const linkFile = linkFileId != null ? files.find(f => f.id === linkFileId) ?? null : null

  // ── Upload: the shell's header "Upload" button only increments a signal —
  // this panel owns the actual file picker + upload call. ──
  const inputRef = useRef<HTMLInputElement>(null)
  const lastUploadSignal = useRef(shell.uploadFilesSignal)
  useEffect(() => {
    if (shell.uploadFilesSignal !== lastUploadSignal.current && shell.uploadFilesSignal > 0) {
      inputRef.current?.click()
    }
    lastUploadSignal.current = shell.uploadFilesSignal
  }, [shell.uploadFilesSignal])

  const uploadFiles = async (list: File[]) => {
    const tooBig = list.filter(f => f.size > MAX_UPLOAD_BYTES)
    const okFiles = list.filter(f => f.size <= MAX_UPLOAD_BYTES)
    if (tooBig.length > 0) planner.toast.error(t('files.uploadErrorSize'))
    if (okFiles.length === 0) return
    setUploading(true)
    try {
      for (const file of okFiles) {
        const fd = new FormData()
        fd.append('file', file)
        await planner.tripActions.addFile(planner.tripId, fd)
      }
      planner.toast.success(t('files.uploaded', { count: okFiles.length }))
    } catch (err) {
      planner.toast.error(translateApiError(t, err, 'files.uploadError'))
    } finally {
      setUploading(false)
    }
  }

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || [])
    e.target.value = ''
    if (list.length > 0) void uploadFiles(list)
  }

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (!planner.canUploadFiles) return
    const items = e.clipboardData?.items
    if (!items) return
    const pasted: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const f = item.getAsFile()
        if (f) pasted.push(f)
      }
    }
    if (pasted.length > 0) {
      e.preventDefault()
      void uploadFiles(pasted)
    }
  }

  // ── Trash: same signal pattern as upload. ──
  const lastTrashSignal = useRef(shell.openFilesTrashSignal)
  useEffect(() => {
    if (shell.openFilesTrashSignal !== lastTrashSignal.current && shell.openFilesTrashSignal > 0) {
      setTrashOpen(true)
    }
    lastTrashSignal.current = shell.openFilesTrashSignal
  }, [shell.openFilesTrashSignal])

  // ── Star toggle (ungated, §7.6) — direct filesApi call + store refresh, same as §7.3. ──
  const toggleStar = async (file: TripFile) => {
    try {
      await filesApi.toggleStar(planner.tripId, file.id)
      planner.tripActions.loadFiles(planner.tripId)
    } catch {
      planner.toast.error(t('files.toast.assignError'))
    }
  }

  const sorted = sortFilesStarredFirst(files)
  const visible = sorted.filter(f => matchesFileFilter(f, filter))
  const mediaFiles = visible.filter(f => isMedia(f.mime_type))

  const openRow = (file: TripFile) => {
    if (isMedia(file.mime_type)) {
      const idx = mediaFiles.findIndex(f => f.id === file.id)
      setLightboxIndex(idx >= 0 ? idx : 0)
    } else {
      // Wallet passes and everything else (PDF/docs) share the same browser-native
      // handling as the transport/reservation file chips: openFile() opens PDFs
      // inline (SAFE_INLINE_TYPES) and forces a download for anything unsafe
      // (incl. .pkpass, so it reaches Apple Wallet, #1447).
      openFile(file.url, file.original_name).catch(() => planner.toast.error(t('files.openError')))
    }
  }

  const visibleFilters = FILE_FILTERS.filter(f => f.id !== 'collab' || files.some(x => x.note_id != null))
  const isEmpty = files.length === 0

  return (
    <TabScroller>
      <div onPaste={onPaste} tabIndex={-1} className="flex min-h-full flex-col">
        <input ref={inputRef} type="file" multiple className="hidden" onChange={onPickFiles} />

        {uploading && (
          <div className="mb-2 flex items-center justify-center gap-2 rounded-full bg-[color:var(--m-ic)] px-3 py-[6px] font-geist text-[0.6875rem] font-bold text-m-muted">
            <Loader2 size={13} className="animate-spin" />
            {t('files.uploading')}
          </div>
        )}

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
            <MDancingTrek scene="files" className="mb-2" />
            <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('mobileTrip.filesEmpty')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-[6px]" style={{ gridTemplateColumns: `repeat(${visibleFilters.length}, 1fr)` }}>
              {visibleFilters.map(f => {
                const Icon = f.icon
                const active = filter === f.id
                const count = files.filter(x => matchesFileFilter(x, f.id)).length
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`rounded-[14px] border px-[2px] pb-[9px] pt-[11px] text-center ${
                      active
                        ? 'border-[color:var(--m-act)] bg-m-act text-m-actfg'
                        : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'
                    }`}
                  >
                    <Icon size={15} strokeWidth={2} className="mx-auto" />
                    <div className="mt-1 truncate font-geist text-[0.5625rem] font-bold">{t(f.labelKey)}</div>
                    <div className="mt-px font-geist text-[0.5625rem] font-bold opacity-55">{count}</div>
                  </button>
                )
              })}
            </div>

            {visible.length === 0 ? (
              <div className="pt-14 text-center font-geist text-[0.8125rem] text-m-faint">{t('mobileTrip.filesEmpty')}</div>
            ) : (
              <div className="flex flex-col">
                {visible.map(file => (
                  <FileRow
                    key={file.id}
                    file={file}
                    planner={planner}
                    onOpen={() => openRow(file)}
                    onStar={() => void toggleStar(file)}
                    onMenu={() => setMenuFileId(file.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <MFileMenuSheet
        planner={planner}
        file={menuFile}
        onClose={() => setMenuFileId(null)}
        onOpenLinks={f => { setMenuFileId(null); setLinkFileId(f.id) }}
      />
      <MFileLinkSheet planner={planner} file={linkFile} onClose={() => setLinkFileId(null)} />
      <MFileTrashSheet planner={planner} open={trashOpen} onClose={() => setTrashOpen(false)} />
      {lightboxIndex != null && mediaFiles.length > 0 && (
        <MFileLightbox
          files={mediaFiles}
          index={Math.min(lightboxIndex, mediaFiles.length - 1)}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          t={t}
        />
      )}
    </TabScroller>
  )
}

function FileRow({ file, planner, onOpen, onStar, onMenu }: {
  file: TripFile
  planner: MTabScreenProps['planner']
  onOpen: () => void
  onStar: () => void
  onMenu: () => void
}) {
  const { t } = planner
  const { locale } = useTranslation()
  const meta = getFileTypeMeta(file)
  const TypeIcon = meta.icon
  const linkLabels = buildFileLinkLabels(file, planner.places, planner.reservations, planner.TRANSPORT_TYPES, t)
  const starred = !!file.starred

  return (
    <div className="mt-2 flex items-center gap-[11px] rounded-2xl border border-[color:var(--m-rowbr)] bg-m-sheetop px-[11px] py-[10px]">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-[11px] text-left">
        <div
          className="flex h-[42px] w-[42px] flex-none flex-col items-center justify-center gap-[2px] rounded-[13px]"
          style={{ background: `${meta.color}22`, color: meta.color }}
        >
          <TypeIcon size={15} strokeWidth={2} />
          <span className="font-geist text-[0.4375rem] font-extrabold tracking-[.04em]">{meta.label}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.8125rem] font-bold text-m-ink">{file.original_name}</div>

          <div className="mt-1 flex flex-wrap items-center gap-1">
            {!!file.file_size && (
              <span className="whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-[7px] py-[2px] font-geist text-[0.53125rem] font-bold text-m-muted">
                {formatSize(file.file_size)}
              </span>
            )}
            <span className="whitespace-nowrap rounded-full bg-[color:var(--m-ic)] px-[7px] py-[2px] font-geist text-[0.53125rem] font-bold text-m-muted">
              {formatFileDate(file.created_at, locale)}
            </span>
            {file.uploaded_by_name && (
              <span className="flex items-center gap-[3px] rounded-full bg-[color:var(--m-ic)] py-[2px] pl-[3px] pr-[7px]">
                <span className="flex h-3 w-3 flex-none items-center justify-center rounded-full bg-m-act font-geist text-[0.40625rem] font-extrabold text-m-actfg">
                  {file.uploaded_by_name[0]?.toUpperCase()}
                </span>
                <span className="max-w-[92px] truncate font-geist text-[0.53125rem] font-bold text-m-muted">{file.uploaded_by_name}</span>
              </span>
            )}
          </div>

          {linkLabels.length > 0 && (
            <div className="mt-1 flex items-center gap-1 overflow-hidden text-m-faint">
              <Link size={9} strokeWidth={2.4} className="flex-none" />
              <span className="truncate font-geist text-[0.5625rem] font-bold">{linkLabels.join('  ·  ')}</span>
            </div>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={e => { e.stopPropagation(); onStar() }}
        aria-label={starred ? t('files.unstar') : t('files.star')}
        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ${
          starred ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-muted'
        }`}
      >
        <Star size={13} strokeWidth={2.4} fill={starred ? 'currentColor' : 'none'} />
      </button>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onMenu() }}
        aria-label={t('files.menu')}
        className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
      >
        <MoreVertical size={14} strokeWidth={2} />
      </button>
    </div>
  )
}
