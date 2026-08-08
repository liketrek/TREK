import { useRef } from 'react'
import { Paperclip, X } from 'lucide-react'
import type { TripPlanner } from '../MTripShell'

interface PlFileAttachProps {
  planner: TripPlanner
  files: File[]
  onAdd: (files: File[]) => void
  onRemove: (index: number) => void
  /** Hide the "you can also paste…" subline (booking/transport sheets keep it terse). */
  hideHint?: boolean
}

/**
 * Files row of the place form: picker pill plus the pending attachments the
 * sheet uploads after save. Clipboard paste is handled by the sheet's onPaste
 * so it works from any focused field.
 */
export default function PlFileAttach({ planner, files, onAdd, onRemove, hideHint = false }: PlFileAttachProps) {
  const { t } = planner
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="mt-3 rounded-[13px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[10px]">
      <div className="flex items-center gap-[10px]">
        <div className="min-w-0 flex-1">
          <div className="text-[0.78125rem] font-semibold text-m-ink">{t('files.title')}</div>
          {!hideHint && <div className="truncate font-geist text-[0.65625rem] text-m-faint">{t('files.pasteHint')}</div>}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-none items-center gap-[5px] rounded-full bg-m-act px-3 py-[6px] text-[0.6875rem] font-semibold text-m-actfg"
        >
          <Paperclip size={12} strokeWidth={2.2} />
          {t('files.attach')}
        </button>
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
      {files.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-2 rounded-[10px] bg-[color:var(--m-ic)] px-2 py-[6px]"
            >
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
