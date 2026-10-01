import { useRef, useState } from 'react'
import { ExternalLink, FileText, Link2, Paperclip, X } from 'lucide-react'
import { openFile } from '../../../../utils/fileDownload'
import type { TripFile } from '../../../../types'
import type { TripPlanner } from '../MTripShell'

interface PlFileAttachProps {
  planner: TripPlanner
  files: File[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  /** Hide the "you can also paste…" subline (booking/transport sheets keep it terse). */
  hideHint?: boolean
  /** False hides the picker pill (no upload permission); the row still lists and links files. */
  canAttach?: boolean
  /** Files already on the record, listed above the pending ones and opened on tap. */
  attached?: TripFile[]
  /** The trip's other files the record could take; empty hides the link pill. */
  linkable?: TripFile[]
  /** Links one; resolves true when it worked, which folds the list away. */
  onLink?: (file: TripFile) => Promise<boolean>
}

const ITEM_CLS = 'flex w-full items-center gap-2 rounded-[10px] bg-[color:var(--m-ic)] px-2 py-[6px] text-left'

/**
 * Files row of the place and booking forms: picker pill plus the pending
 * attachments the sheet uploads after save. On a saved booking it also lists
 * the files already attached and links one the trip already has (#2084).
 * Clipboard paste is handled by the sheet's onPaste so it works from any
 * focused field.
 */
export default function PlFileAttach({ planner, files, onAdd, onRemove, hideHint = false, canAttach = true, attached = [], linkable = [], onLink }: PlFileAttachProps) {
  const { t } = planner
  const inputRef = useRef<HTMLInputElement>(null)
  const [picking, setPicking] = useState(false)
  const canLink = !!onLink && linkable.length > 0

  return (
    <div className="mt-3 rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[10px]">
      <div className="flex items-center gap-[10px]">
        <div className="min-w-0 flex-1">
          <div className="text-[0.78125rem] font-semibold text-m-ink">{t('files.title')}</div>
          {!hideHint && <div className="truncate font-geist text-[0.65625rem] text-m-faint">{t('files.pasteHint')}</div>}
        </div>
        {canLink && (
          <button
            type="button"
            onClick={() => setPicking(v => !v)}
            aria-expanded={picking}
            className={`flex flex-none items-center gap-[5px] rounded-full border px-3 py-[5px] text-[0.6875rem] font-semibold ${picking ? 'border-transparent bg-m-act text-m-actfg' : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-ink'}`}
          >
            <Link2 size={12} strokeWidth={2.2} />
            {t('files.link')}
          </button>
        )}
        {canAttach && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-none items-center gap-[5px] rounded-full bg-m-act px-3 py-[6px] text-[0.6875rem] font-semibold text-m-actfg"
          >
            <Paperclip size={12} strokeWidth={2.2} />
            {t('files.attach')}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => {
          onAdd(Array.from(e.target.files || []))
          e.target.value = ''
        }}
      />
      {picking && canLink && (
        <div className="mt-2 flex max-h-[200px] flex-col gap-1 overflow-y-auto">
          {linkable.map(file => (
            <button
              key={file.id}
              type="button"
              onClick={async () => { if (await onLink!(file)) setPicking(false) }}
              className={ITEM_CLS}
            >
              <FileText size={11} strokeWidth={2} className="flex-none text-m-faint" />
              <span className="min-w-0 flex-1 truncate font-geist text-[0.6875rem] text-m-ink">{file.original_name}</span>
              <Link2 size={12} strokeWidth={2.2} className="flex-none text-m-faint" />
            </button>
          ))}
        </div>
      )}
      {(attached.length > 0 || files.length > 0) && (
        <div className="mt-2 flex flex-col gap-1">
          {attached.map(file => (
            <button key={file.id} type="button" onClick={() => { void openFile(file.url, file.original_name) }} className={ITEM_CLS}>
              <FileText size={11} strokeWidth={2} className="flex-none text-m-faint" />
              <span className="min-w-0 flex-1 truncate font-geist text-[0.6875rem] font-medium text-m-ink">{file.original_name}</span>
              <ExternalLink size={11} strokeWidth={2} className="flex-none text-m-faint" />
            </button>
          ))}
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className={ITEM_CLS}>
              <Paperclip size={11} strokeWidth={2} className="flex-none text-m-faint" />
              <span className="min-w-0 flex-1 truncate font-geist text-[0.6875rem] text-m-muted">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                aria-label={t('common.delete')}
                className="flex-none text-m-faint"
              >
                <X size={13} strokeWidth={2.2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
