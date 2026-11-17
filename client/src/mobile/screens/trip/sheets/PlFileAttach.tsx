import { useRef, useState } from 'react'
import { ExternalLink, FileText, Link2, Paperclip, Wallet, X } from 'lucide-react'
import { openFile } from '../../../../utils/fileDownload'
import { isWalletPass } from '../../../../components/Files/FileManager.helpers'
import type { TripFile } from '../../../../types'
import type { TripPlanner } from '../MTripShell'
import { AddFieldButton, Eyebrow } from './PlSheetChrome'

interface PlFileAttachProps {
  planner: TripPlanner
  files: File[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  /** False hides the picker pill (no upload permission); the row still lists and links files. */
  canAttach?: boolean
  /** Files already on the record, listed above the pending ones and opened on tap. */
  attached?: TripFile[]
  /** The trip's other files the record could take; empty hides the link pill. */
  linkable?: TripFile[]
  /** Links one; resolves true when it worked, which folds the list away. */
  onLink?: (file: TripFile) => Promise<boolean>
}

const ITEM_CLS = 'flex w-full items-center gap-2 rounded-[10px] bg-[color:var(--m-ic)] px-2 py-[6px] text-start'

/**
 * Files row of the place and booking forms: picker pill plus the pending
 * attachments the sheet uploads after save. On a saved booking it also lists
 * the files already attached and links one the trip already has (#2084).
 * Clipboard paste is handled by the sheet's onPaste so it works from any
 * focused field.
 */
export default function PlFileAttach({ planner, files, onAdd, onRemove, canAttach = true, attached = [], linkable = [], onLink }: PlFileAttachProps) {
  const { t } = planner
  const inputRef = useRef<HTMLInputElement>(null)
  const [picking, setPicking] = useState(false)
  const canLink = !!onLink && linkable.length > 0

  return (
    <div>
      <Eyebrow className="mb-[5px] mt-3 uppercase">{t('files.title')}</Eyebrow>
      {(canAttach || canLink) && (
        <div className={`grid gap-2 ${canAttach && canLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {canAttach && <AddFieldButton icon={Paperclip} label={t('files.attach')} onClick={() => inputRef.current?.click()} />}
          {canLink && (
            <AddFieldButton icon={Link2} label={t('files.link')} onClick={() => setPicking(v => !v)} pressed={picking} ariaExpanded={picking} />
          )}
        </div>
      )}
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
              <span dir="auto" className="min-w-0 flex-1 truncate font-geist text-[0.6875rem] text-m-ink">{file.original_name}</span>
              <Link2 size={12} strokeWidth={2.2} className="flex-none text-m-faint" />
            </button>
          ))}
        </div>
      )}
      {(attached.length > 0 || files.length > 0) && (
        <div className="mt-2 flex flex-col gap-1">
          {attached.map(file => (
            <button key={file.id} type="button" onClick={() => { void openFile(file.url, file.original_name) }} className={ITEM_CLS}>
              {isWalletPass(file.mime_type, file.original_name)
                ? <Wallet size={11} strokeWidth={2} className="flex-none text-m-ink" />
                : <FileText size={11} strokeWidth={2} className="flex-none text-m-faint" />}
              <span dir="auto" className="min-w-0 flex-1 truncate font-geist text-[0.6875rem] font-medium text-m-ink">{file.original_name}</span>
              <ExternalLink size={11} strokeWidth={2} className="flex-none text-m-faint" />
            </button>
          ))}
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className={ITEM_CLS}>
              <Paperclip size={11} strokeWidth={2} className="flex-none text-m-faint" />
              <span dir="auto" className="min-w-0 flex-1 truncate font-geist text-[0.6875rem] text-m-muted">{file.name}</span>
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
