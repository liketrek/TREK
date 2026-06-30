import React from 'react'
import type { CollectionStatus } from '@trek/shared'
import type { TranslationFn } from '../../types'
import { STATUS_META, nextStatus } from '../../pages/collections/collectionsModel'

interface StatusBadgeProps {
  status: CollectionStatus
  /** One-tap cycle: idea → want → visited → idea. Omit for a read-only badge. */
  onChange?: (next: CollectionStatus) => void
  showLabel?: boolean
  size?: number
  t: TranslationFn
}

/**
 * Coloured per-place status pill (idea / want-to-go / visited). When `onChange`
 * is supplied a single tap cycles the status optimistically; otherwise it is a
 * static badge. Looks intentional in both light and dark mode via the
 * accent/success tokens in STATUS_META.
 */
export default function StatusBadge({ status, onChange, showLabel = true, size = 13, t }: StatusBadgeProps): React.ReactElement {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  const label = t(meta.labelKey)
  const interactive = !!onChange

  const handleClick = (e: React.MouseEvent) => {
    if (!onChange) return
    e.preventDefault()
    e.stopPropagation()
    onChange(nextStatus(status))
  }

  const content = (
    <>
      <Icon size={size} style={{ color: meta.color }} strokeWidth={2.2} />
      {showLabel && <span className="font-semibold" style={{ color: meta.color }}>{label}</span>}
    </>
  )

  const className = `inline-flex items-center gap-1.5 rounded-full text-[11px] leading-none ${showLabel ? 'px-2.5 py-1' : 'p-1.5'} border border-edge bg-surface-card/80 backdrop-blur-sm`

  if (!interactive) {
    return <span className={className} title={label}>{content}</span>
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${label} — ${t('collections.status.cycleHint')}`}
      aria-label={label}
      className={`${className} transition-transform hover:scale-105 active:scale-95 cursor-pointer`}
    >
      {content}
    </button>
  )
}
