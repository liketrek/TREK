import React, { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { FileSpreadsheet, FileText, Printer, Upload } from 'lucide-react'
import { useTranslation } from '../../i18n'
import PackingPrintPreview from './PackingPrintPreview'
import { usePackingExport, type PackingView } from './usePackingExport'

interface PackingExportMenuProps {
  tripId: number
  view: PackingView
  style: React.CSSProperties
  className?: string
}

function MenuItem({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-caption font-medium text-content hover:bg-surface-tertiary"
    >
      <Icon size={13} className="text-content-faint" />
      {label}
    </button>
  )
}

/**
 * The list's way out, beside Import in the Lists header (#875, #1420): print or save
 * as PDF, a Markdown checklist, or CSV in the import's own format. Covers the view on
 * screen and renders nothing while that view is empty.
 */
export default function PackingExportMenu({ tripId, view, style, className }: PackingExportMenuProps): React.ReactElement | null {
  const { t } = useTranslation()
  const packingExport = usePackingExport(tripId, view)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!packingExport.hasItems && !packingExport.printHtml) return null

  const choose = (action: () => void | Promise<void>) => () => {
    setOpen(false)
    void action()
  }

  return (
    // A flex box, so the button stretches to the row height like its neighbours in the header.
    <div ref={menuRef} className="relative flex">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('packing.export')}
        title={t('packing.export')}
        className={className ?? 'hover:opacity-[0.88]'}
        style={style}
      >
        <Upload size={14} strokeWidth={2.5} />
      </button>
      {open && (
        <div
          role="menu"
          className="trek-menu-enter absolute right-0 top-full z-50 mt-1.5 min-w-[220px] origin-top-right rounded-[10px] border border-edge bg-surface-card p-1 shadow-dropdown"
        >
          <MenuItem icon={Printer} label={t('packing.exportPrint')} onClick={choose(packingExport.openPrint)} />
          <MenuItem icon={FileText} label={t('packing.exportMarkdown')} onClick={choose(packingExport.exportMarkdown)} />
          <MenuItem icon={FileSpreadsheet} label={t('packing.exportCsv')} onClick={choose(packingExport.exportCsv)} />
        </div>
      )}
      <PackingPrintPreview html={packingExport.printHtml} title={packingExport.printTitle} onClose={packingExport.closePrint} />
    </div>
  )
}
