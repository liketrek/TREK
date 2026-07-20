import React, { useState } from 'react'
import { GripVertical, ArrowUp, ArrowDown, ChevronsDown, ChevronsUp, Lock } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useMobileNavEditor, type MobileNavValue, type NavZone } from './useMobileNavEditor'
import { useIsTouch } from '../../hooks/useIsTouch'
import { MOBILE_NAV_MAX_BAR, type NavItemDef } from '../Layout/navItems'
import MobileNavPreview from './MobileNavPreview'

/**
 * Desktop customizer for the mobile bottom navbar. Two zones — "in the bar" and
 * "under More" — with a live dock preview on top. Rows reorder within a zone by
 * drag (mouse only) or the up/down arrows, and cross a zone via the move button.
 * Dashboard is pinned first and cannot be moved.
 */
export default function MobileNavCustomizer({
  value,
  onChange,
}: {
  value: MobileNavValue
  onChange: (next: MobileNavValue) => void
}) {
  const { t } = useTranslation()
  const isTouch = useIsTouch()
  const ed = useMobileNavEditor(value, onChange)
  const [drag, setDrag] = useState<{ zone: NavZone; index: number } | null>(null)
  const [over, setOver] = useState<{ zone: NavZone; index: number } | null>(null)

  const cellBtn: React.CSSProperties = {
    display: 'grid', placeItems: 'center', width: 28, height: 28,
    border: '1px solid var(--border-faint)', borderRadius: 7,
    background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, flexShrink: 0,
  }

  const iconTile = (item: NavItemDef) => {
    const Icon = item.icon
    return (
      <span
        className="flex h-8 w-8 flex-none items-center justify-center rounded-lg"
        style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
      >
        <Icon size={17} strokeWidth={1.9} />
      </span>
    )
  }

  // Inline render helper (not a nested component) so rows re-render in place
  // instead of remounting on every drag/state change.
  const renderRow = (item: NavItemDef, index: number, zone: NavZone, count: number) => {
    const dragging = drag?.zone === zone && drag.index === index
    const isOver = over?.zone === zone && over.index === index && drag && !(drag.zone === zone && drag.index === index)
    const canDrag = !isTouch
    return (
      <div
        key={item.id}
        draggable={canDrag}
        onDragStart={(e) => { if (!canDrag) { e.preventDefault(); return } setDrag({ zone, index }) }}
        onDragEnd={() => { setDrag(null); setOver(null) }}
        onDragOver={(e) => { e.preventDefault(); if (drag?.zone === zone && (over?.index !== index || over?.zone !== zone)) setOver({ zone, index }) }}
        onDrop={(e) => {
          e.preventDefault()
          if (drag && drag.zone === zone && drag.index !== index) ed.move(zone, drag.index, index)
          setDrag(null); setOver(null)
        }}
        className="flex items-center gap-2.5"
        style={{
          padding: '7px 9px', borderRadius: 9,
          border: '1px solid var(--border-faint)',
          background: isOver ? 'var(--bg-hover)' : 'var(--bg-card)',
          opacity: dragging ? 0.5 : 1,
          outline: isOver ? '2px dashed var(--border-primary)' : 'none',
          outlineOffset: -2,
        }}
      >
        <GripVertical
          size={15}
          strokeWidth={1.8}
          style={{ cursor: canDrag ? 'grab' : 'default', color: 'var(--text-faint)', flexShrink: 0, opacity: canDrag ? 1 : 0.4 }}
        />
        {iconTile(item)}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-content">{item.label}</span>

        <button
          onClick={() => (zone === 'bar' ? ed.toMore(item.id) : ed.toBar(item.id))}
          disabled={zone === 'more' && ed.barFull}
          title={zone === 'bar' ? t('settings.appearance.mobileNav.toMore') : t('settings.appearance.mobileNav.toBar')}
          aria-label={zone === 'bar' ? t('settings.appearance.mobileNav.toMore') : t('settings.appearance.mobileNav.toBar')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexShrink: 0,
            height: 30, minWidth: 96, padding: '0 14px', borderRadius: 8,
            border: '1px solid var(--border-primary)', background: 'var(--bg-hover)',
            color: 'var(--text-secondary)', fontFamily: 'inherit',
            opacity: zone === 'more' && ed.barFull ? 0.4 : 1,
            cursor: zone === 'more' && ed.barFull ? 'not-allowed' : 'pointer',
          }}
        >
          {zone === 'bar' ? <ChevronsDown size={15} strokeWidth={2.2} /> : <ChevronsUp size={15} strokeWidth={2.2} />}
          <span className="text-[13px] font-semibold whitespace-nowrap">{zone === 'bar' ? t('settings.appearance.mobileNav.more') : t('settings.appearance.mobileNav.bar')}</span>
        </button>

        <button
          onClick={() => ed.move(zone, index, index - 1)}
          disabled={index === 0}
          aria-label={t('dayplan.moveUp')}
          style={{ ...cellBtn, opacity: index === 0 ? 0.35 : 1, cursor: index === 0 ? 'default' : 'pointer' }}
        >
          <ArrowUp size={14} strokeWidth={2} />
        </button>
        <button
          onClick={() => ed.move(zone, index, index + 1)}
          disabled={index === count - 1}
          aria-label={t('dayplan.moveDown')}
          style={{ ...cellBtn, opacity: index === count - 1 ? 0.35 : 1, cursor: index === count - 1 ? 'default' : 'pointer' }}
        >
          <ArrowDown size={14} strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Live preview */}
      <div>
        <MobileNavPreview bar={ed.previewBar} hasMore={ed.hasMore} moreLabel={t('mobileNav.more')} />
        <p className="mt-2 text-xs text-content-faint">{t('settings.appearance.mobileNav.hint')}</p>
      </div>

      {/* In the bar */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-content-faint">
            {t('settings.appearance.mobileNav.inBar')}
          </span>
          <span className="text-[11px] text-content-faint tabular-nums">{ed.barItems.length + 1}/{MOBILE_NAV_MAX_BAR + 1}</span>
        </div>
        <div className="space-y-1.5">
          {/* Dashboard — pinned, never moves */}
          {ed.dashboard && (
            <div
              className="flex items-center gap-2.5"
              style={{ padding: '7px 9px', borderRadius: 9, border: '1px solid var(--border-faint)', background: 'var(--bg-hover)' }}
            >
              <Lock size={13} strokeWidth={2} style={{ color: 'var(--text-faint)', flexShrink: 0, margin: '0 1px' }} />
              {iconTile(ed.dashboard)}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-content">{ed.dashboard.label}</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-content-muted" style={{ background: 'var(--bg-card)' }}>
                {t('settings.appearance.mobileNav.pinned')}
              </span>
            </div>
          )}
          {ed.barItems.map((item, i) => renderRow(item, i, 'bar', ed.barItems.length))}
        </div>
      </div>

      {/* Under More */}
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-content-faint">
          {t('settings.appearance.mobileNav.underMore')}
        </div>
        {ed.moreItems.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-content-faint" style={{ borderColor: 'var(--border-secondary)' }}>
            {t('settings.appearance.mobileNav.moreEmpty')}
          </p>
        ) : (
          <div className="space-y-1.5">
            {ed.moreItems.map((item, i) => renderRow(item, i, 'more', ed.moreItems.length))}
          </div>
        )}
      </div>
    </div>
  )
}
