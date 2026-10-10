import { useRef } from 'react'
import { FileDown } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { Eyebrow, FIELD_AREA_CLS, FormSheetFooter, FormSheetHeader } from '../sheets/PlSheetChrome'
import { usePackingImport } from '../../../../components/Packing/usePackingImport'
import { PACKING_IMPORT_ACCEPT } from '../../../../components/Packing/packingListPanel.constants'
import type { TripPlanner } from '../MTripShell'

export interface MPackingImportSheetProps {
  planner: TripPlanner
  open: boolean
  onClose: () => void
}

/**
 * Bulk packing import (spec 03 §4.2 action-menu "Import"): one item per line,
 * `Category, Name, Weight(g), Bag, checked`, run by the same `usePackingImport`
 * as the desktop bulk-import dialog, which appends the result straight into the
 * trip store so both surfaces stay consistent.
 */
export default function MPackingImportSheet({ planner, open, onClose }: MPackingImportSheetProps) {
  const { t, toast, tripId } = planner
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { text, setText, parsed, importing, readFile: handleFile, runImport: handleImport } =
    usePackingImport({ tripId, t, toast, onImported: onClose, oneAtATime: true })

  return (
    <MSheet open={open} onClose={onClose} ariaLabel={t('packing.importTitle')}>
      <FormSheetHeader title={t('packing.importTitle')} onClose={onClose} closeLabel={t('common.close')} />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-1">
        <p className="mb-1 font-geist text-[0.71875rem] leading-[1.5] text-m-muted">{t('packing.importHint')}</p>
        <p className="mb-3 font-geist text-[0.71875rem] leading-[1.5] text-m-muted">{t('packing.importHintMarkdown')}</p>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={7}
          placeholder={t('packing.importPlaceholder')}
          className={`${FIELD_AREA_CLS} font-geist`}
        />

        <input ref={fileInputRef} type="file" accept={PACKING_IMPORT_ACCEPT} onChange={handleFile} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 flex items-center gap-[6px] rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[13px] py-[7px] text-[0.75rem] font-semibold text-m-muted"
        >
          <FileDown size={12} strokeWidth={2.2} />
          {t('packing.importCsv')}
        </button>

        {parsed.length === 0 && text.trim() !== '' && (
          <Eyebrow className="mt-3">{t('packing.importEmpty')}</Eyebrow>
        )}
      </div>

      <FormSheetFooter
        onCancel={onClose}
        cancelLabel={t('common.cancel')}
        onSubmit={handleImport}
        submitLabel={t('packing.importAction', { count: parsed.length })}
        submitDisabled={parsed.length === 0 || importing}
      />
    </MSheet>
  )
}
