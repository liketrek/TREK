import { useId, type ReactNode } from 'react'
import type { TourListItem } from '@trek/shared'
import { fs } from '../shared/DialogShell'
import { useTranslation } from '../../i18n'
import { TourFactPills, TourTile } from './tourParts'
import { tourWebsitePresentation } from './tourPresentation'

interface TourListRowProps {
  tour: TourListItem
  selected?: boolean
  disabled?: boolean
  onSelect: (tour: TourListItem, opener: HTMLElement) => void
  action?: ReactNode
  children?: ReactNode
}

/** A tour in a list, shaped like a place row: tile, name, its facts as pills and the day action on the right. */
export default function TourListRow({ tour, selected = false, disabled = false, onSelect, action, children }: TourListRowProps) {
  const { t } = useTranslation()
  const nameId = useId()
  const tone = selected ? 'bg-surface-selected' : disabled ? '' : 'hover:bg-surface-hover'
  const website = tourWebsitePresentation(tour.website)
  return (
    <li
      role="option"
      tabIndex={disabled ? -1 : 0}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      aria-labelledby={nameId}
      className={`group mb-px rounded-[12px] px-2.5 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)] ${tone} ${disabled ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
      onClick={event => { if (!disabled) onSelect(tour, event.currentTarget) }}
      onKeyDown={event => {
        if (disabled || event.target !== event.currentTarget) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(tour, event.currentTarget)
        }
      }}
    >
      <div className="flex items-start gap-2.5">
        <TourTile />
        <div className="min-w-0 flex-1 pt-px">
          <span id={nameId} className="block min-w-0 truncate font-semibold leading-tight text-content" style={fs(13, 'body')}>{tour.name}</span>
          <TourFactPills tour={tour} className="mt-1.5" />
          {tour.description && (
            <div data-testid="tour-description-preview" className="mt-1 overflow-hidden text-ellipsis text-content-faint" style={{ ...fs(11), lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {tour.description}
            </div>
          )}
          {website && (
            <div className="mt-1 truncate text-content-faint" style={fs(10.5)}>
              {website.provider ? `${website.provider} · ${website.domain}` : `${t('places.formWebsite')} · ${website.domain}`}
            </div>
          )}
        </div>
        {action && (
          <div data-testid="tour-action-row" role="presentation" className="flex flex-none items-center gap-1.5 pt-1" onClick={event => event.stopPropagation()}>
            {action}
          </div>
        )}
      </div>
      {children}
    </li>
  )
}
