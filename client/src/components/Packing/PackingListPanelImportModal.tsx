import { useId } from 'react'
import { Download, FileDown } from 'lucide-react'
import type { PackingState } from './usePackingListPanel'
import { PACKING_IMPORT_ACCEPT } from './packingListPanel.constants'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'

/** Pasting a list or loading a file: one item per line, numbered as it is typed. */
export function BulkImportModal(S: PackingState) {
  const { setShowImportModal, t, importText, setImportText, csvInputRef, handleCsvFile, handleBulkImport, parseImportLines } = S
  const labelId = useId()
  const close = () => setShowImportModal(false)
  const text = fs(13, 'body')

  return (
    <DialogShell
      onClose={close}
      labelledBy={labelId}
      header={(
        <DialogHeader
          tile={<DialogTile><Download size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={close}
          title={t('packing.importTitle')}
        />
      )}
      footer={(
        <DialogFooter>
          <input ref={csvInputRef} type="file" accept={PACKING_IMPORT_ACCEPT} className="hidden" onChange={handleCsvFile} />
          <DialogButton icon={<FileDown size={14} strokeWidth={2} />} onClick={() => csvInputRef.current?.click()}>{t('packing.importCsv')}</DialogButton>
          <FooterSpacer />
          <DialogButton onClick={close}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={handleBulkImport} disabled={!importText.trim()}>
            {t('packing.importAction', { count: parseImportLines(importText).length })}
          </DialogButton>
        </DialogFooter>
      )}
    >
      <p className="m-0 leading-normal text-content-muted" style={fs(12.5, 'body')}>
        {t('packing.importHint')}
        <br />
        {t('packing.importHintMarkdown')}
      </p>
      <div className="flex overflow-hidden rounded-[10px] border border-edge bg-surface-input focus-within:ring-2 focus-within:ring-[color:var(--text-primary)]">
        <div aria-hidden className="min-w-8 flex-none select-none border-r border-edge-faint bg-surface-tertiary py-2.5 text-right font-mono leading-normal text-content-faint" style={text}>
          {(importText || ' ').split('\n').map((_, i) => (
            <div key={i} className="px-1.5">{i + 1}</div>
          ))}
        </div>
        <textarea
          value={importText}
          onChange={e => setImportText(e.target.value)}
          rows={10}
          placeholder={t('packing.importPlaceholder')}
          aria-label={t('packing.importTitle')}
          className="min-w-0 flex-1 resize-y border-0 bg-transparent px-3 py-2.5 font-mono leading-normal text-content outline-none placeholder:text-content-faint dark:bg-transparent"
          style={text}
        />
      </div>
    </DialogShell>
  )
}
