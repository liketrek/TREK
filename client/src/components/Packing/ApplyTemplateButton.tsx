import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Package } from 'lucide-react'
import { packingApi } from '../../api/client'
import { useTripStore } from '../../store/tripStore'
import { useToast } from '../shared/Toast'
import { useTranslation } from '../../i18n'
import { PackingTemplateOption } from './PackingTemplateOption'
import { PopoverItem } from './PackingPopover'
import { offlineOr } from '../../utils/needsConnection'

interface Template {
  id: number
  name: string
  item_count: number
}

interface ApplyTemplateButtonProps {
  tripId: number
  visibility: 'common' | 'personal'
  style?: React.CSSProperties
  className?: string
  /** 'menu' draws a line of the Lists menu that opens the templates under it; onApplied closes that menu. */
  variant?: 'button' | 'menu'
  onApplied?: () => void
}

// Dropdown-Button um ein Packing-Template auf den aktuellen Trip anzuwenden.
// Rendert nichts wenn keine Templates existieren.
export default function ApplyTemplateButton({ tripId, visibility, style, className, variant = 'button', onApplied }: ApplyTemplateButtonProps): React.ReactElement | null {
  const [templates, setTemplates] = useState<Template[]>([])
  const [open, setOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const { t } = useTranslation()

  useEffect(() => {
    packingApi.listTemplates(tripId).then(d => setTemplates(d.templates || [])).catch(() => {})
  }, [tripId])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleApply = async (templateId: number) => {
    setApplying(true)
    try {
      const data = await packingApi.applyTemplate(tripId, templateId, visibility)
      useTripStore.setState(s => ({ packingItems: [...s.packingItems, ...(data.items || [])] }))
      toast.success(t('packing.templateApplied', { count: data.count }))
      setOpen(false)
      onApplied?.()
    } catch {
      toast.error(offlineOr(t, t('packing.templateError')))
    } finally {
      setApplying(false)
    }
  }

  if (templates.length === 0) return null

  if (variant === 'menu') return (
    <>
      <PopoverItem icon={<Package size={13} />} label={t('packing.applyTemplate')} onClick={() => setOpen(v => !v)}
        trailing={open ? <ChevronDown size={13} className="shrink-0 text-content-faint" /> : <ChevronRight size={13} className="shrink-0 text-content-faint" />} />
      {open && (
        <div className="mb-1 ms-[18px] border-s border-edge-faint ps-1.5">
          {templates.map(tmpl => (
            <PackingTemplateOption key={tmpl.id} name={tmpl.name} itemCount={tmpl.item_count} onClick={() => { if (!applying) void handleApply(tmpl.id) }} t={t} />
          ))}
        </div>
      )}
    </>
  )

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button type="button"
        onClick={() => setOpen(v => !v)}
        disabled={applying}
        className={className ?? 'hover:opacity-[0.88]'}
        style={style}
      >
        <Package size={14} strokeWidth={2.5} />
        <span className="hidden sm:inline">{t('packing.applyTemplate')}</span>
      </button>
      {open && (
        <div
          className="trek-menu-enter"
          style={{
            position: 'absolute', insetInlineEnd: 0, top: '100%', marginTop: 6, zIndex: 50,
            background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: 4, minWidth: 220,
            transformOrigin: 'top right',
          }}
        >
          {templates.map(tmpl => (
            <PackingTemplateOption key={tmpl.id} name={tmpl.name} itemCount={tmpl.item_count} onClick={() => handleApply(tmpl.id)} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}
