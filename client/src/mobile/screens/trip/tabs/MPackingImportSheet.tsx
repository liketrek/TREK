import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import MSheet from '../../../components/MSheet'
import { Eyebrow, FIELD_AREA_CLS, FormSheetFooter, FormSheetHeader } from '../sheets/PlSheetChrome'
import { packingApi } from '../../../../api/client'
import { useTripStore } from '../../../../store/tripStore'
import { parseImportLines } from '../../../../components/Packing/packingListPanel.helpers'
import type { TripPlanner } from '../MTripShell'

export interface MPackingImportSheetProps {
  planner: TripPlanner
  open: boolean
  onClose: () => void
}

/**
 * Bulk packing import (spec 03 §4.2 action-menu "Import"): one item per line,
 * `Category, Name, Weight(g), Bag, checked` — same parser + endpoint as the
 * desktop bulk-import modal (`packingListPanel.helpers.parseImportLines` +
 * `packingApi.bulkImport`), appended straight into the trip store so both
 * surfaces stay consistent.
 */
export default function MPackingImportSheet({ planner, open, onClose }: MPackingImportSheetProps) {
  const { t, toast, tripId } = planner
  const [text, setText] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parsed = parseImportLines(text)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === 'string') setText(reader.result) }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (parsed.length === 0 || importing) return
    setImporting(true)
    try {
      const result = await packingApi.bulkImport(tripId, parsed)
      useTripStore.setState(s => ({ packingItems: [...s.packingItems, ...(result.items || [])] }))
      toast.success(t('packing.importSuccess', { count: result.count }))
      setText('')
      onClose()
    } catch {
      toast.error(t('packing.importError'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <MSheet open={open} onClose={onClose} ariaLabel={t('packing.importTitle')}>
      <FormSheetHeader title={t('packing.importTitle')} onClose={onClose} closeLabel={t('common.close')} />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-1">
        <p className="mb-3 font-geist text-[0.71875rem] leading-[1.5] text-m-muted">{t('packing.importHint')}</p>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={7}
          placeholder={t('packing.importPlaceholder')}
          className={`${FIELD_AREA_CLS} font-geist`}
        />

        <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 flex items-center gap-[6px] rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-[13px] py-[7px] text-[0.75rem] font-semibold text-m-muted"
        >
          <Upload size={12} strokeWidth={2.2} />
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
