import React from 'react'
import { Share2, Users, Plus } from 'lucide-react'
import type { CollectionMember } from '@trek/shared'
import type { TranslationFn } from '../../types'
import type { StatusFilter } from '../../store/collectionStore'
import { STATUS_META, STATUS_ORDER } from '../../pages/collections/collectionsModel'

const AV_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#3b82f6', '#ef4444', '#22c55e']

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
}

interface CollectionHeroProps {
  eyebrow: string
  title: string
  /** List colour — drives the gradient wash when there is no cover image. */
  color: string
  coverImage?: string | null
  counts: Record<StatusFilter, number>
  statusFilter: StatusFilter
  onStatusFilter: (f: StatusFilter) => void
  /** Accepted members (owner first) — shown as an avatar stack when shared. */
  members: CollectionMember[]
  canShare: boolean
  isOwner: boolean
  shareMemberCount: number
  onShare: () => void
  onNewList: () => void
  t: TranslationFn
}

/**
 * The page header — a colour-washed (or cover-image) glass hero that gives the
 * active list an identity: an eyebrow with the sharing state + member avatars,
 * the big list name, and a row of stat chips that double as the status filter
 * (All / Idea / Want / Visited with live counts). Share + New-list actions sit
 * top-right. Modelled on the dashboard hero-trip.
 */
export default function CollectionHero({
  eyebrow, title, color, coverImage, counts, statusFilter, onStatusFilter,
  members, canShare, isOwner, shareMemberCount, onShare, onNewList, t,
}: CollectionHeroProps): React.ReactElement {
  const accepted = members.filter(m => m.status === 'accepted' || m.is_owner)
  const showAvatars = accepted.length > 1
  const shown = accepted.slice(0, 5)
  const extra = accepted.length - shown.length

  const chips: { key: StatusFilter; label: string; color?: string }[] = [
    { key: 'all', label: t('collections.status.filterAll') },
    ...STATUS_ORDER.map(s => ({ key: s as StatusFilter, label: t(STATUS_META[s].labelKey), color: STATUS_META[s].color })),
  ]

  return (
    <header className="col-hero" style={{ ['--hero-color' as string]: color }}>
      {coverImage
        ? <img className="col-hero-img" src={coverImage} alt="" />
        : <div className="col-hero-bg" />}
      <div className="col-hero-scrim" />

      <div className="col-hero-actions">
        {canShare && (
          <button
            type="button"
            onClick={onShare}
            aria-label={isOwner ? t('collections.share.button') : t('collections.shared')}
            title={isOwner ? t('collections.share.button') : t('collections.shared')}
            className={`col-glass-btn${isOwner && shareMemberCount > 0 ? ' has-count' : ''}`}
          >
            {isOwner ? <Share2 size={15} /> : <Users size={15} />}
            <span className="txt">{isOwner ? t('collections.share.button') : t('collections.shared')}</span>
            {isOwner && shareMemberCount > 0 && <span className="cnt">{shareMemberCount}</span>}
          </button>
        )}
        <button type="button" onClick={onNewList} aria-label={t('collections.newList')} title={t('collections.newList')} className="col-glass-btn">
          <Plus size={15} /> <span className="txt">{t('collections.newList')}</span>
        </button>
      </div>

      <div className="col-hero-content">
        <div className="col-hero-eyebrow">
          <span>{eyebrow}</span>
          {showAvatars && (
            <span className="members">
              {shown.map(m => (
                m.avatar
                  ? <img key={m.user_id} className="col-av" src={m.avatar} alt={m.username} />
                  : <span key={m.user_id} className="col-av" style={{ background: AV_COLORS[m.user_id % AV_COLORS.length] }}>{initials(m.username)}</span>
              ))}
              {extra > 0 && <span className="col-av" style={{ background: 'rgba(255,255,255,.28)' }}>+{extra}</span>}
            </span>
          )}
        </div>

        <h1 className="col-hero-title">{title}</h1>

        <div className="col-hero-stats">
          {chips.map(chip => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onStatusFilter(chip.key)}
              className={`col-chip${statusFilter === chip.key ? ' on' : ''}`}
            >
              {chip.color && <span className="sw" style={{ background: chip.color }} />}
              {chip.label}
              <span className="n">{counts[chip.key]}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
