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
  /** Dark-glass variant for a pill sitting over a photo cover / the hero. */
  onCover?: boolean
  t: TranslationFn
}

/**
 * Coloured per-place status pill (idea / want-to-go / visited). When `onChange`
 * is supplied a single tap cycles the status optimistically; otherwise it is a
 * static badge. Two skins: the default surface pill (list / inspector) and the
 * `onCover` dark-glass pill that stays legible on top of a photo cover. Styled
 * with utility classes only, so it works both inside and outside `.trek-dash`.
 */
export default function StatusBadge({ status, onChange, showLabel = true, size = 13, onCover = false, t }: StatusBadgeProps): React.ReactElement {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  const label = t(meta.labelKey)
  const color = onCover ? meta.coverColor : meta.color
  const interactive = !!onChange

  const cycle = (e: React.SyntheticEvent) => {
    if (!onChange) return
    e.preventDefault()
    e.stopPropagation()
    onChange(nextStatus(status))
  }

  const content = (
    <>
      <Icon size={size} style={{ color }} strokeWidth={2.4} />
      {showLabel && <span className="font-semibold" style={{ color }}>{label}</span>}
    </>
  )

  const skin = onCover
    ? 'bg-black/45 border-white/25 text-white'
    : 'bg-surface-card/85 border-edge text-content'
  const className = `inline-flex items-center gap-1.5 rounded-full text-[11px] leading-none border backdrop-blur-md ${showLabel ? 'px-2.5 py-1' : 'p-1.5'} ${skin}`

  if (!interactive) {
    return <span className={className} title={label}>{content}</span>
  }

  // Rendered as a role=button span (not a native <button>) on purpose: inside
  // the .trek-dash scope the global `.trek-dash button` reset would strip the
  // pill's background/border/padding, and the pill also has to sit inside the
  // grid card's own clickable element without nesting one button in another.
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={cycle}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') cycle(e) }}
      title={`${label} — ${t('collections.status.cycleHint')}`}
      aria-label={label}
      className={`${className} transition-transform hover:scale-110 active:scale-95 cursor-pointer select-none`}
    >
      {content}
    </span>
  )
}
