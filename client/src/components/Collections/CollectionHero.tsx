import React from 'react'
import { avatarSrc } from '../../utils/avatarSrc'
import { Share2, Users, Link2, Pencil } from 'lucide-react'
import type { CollectionMember, CollectionLink } from '@trek/shared'
import type { TranslationFn } from '../../types'

const AV_COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#3b82f6', '#ef4444', '#22c55e']

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'
}

interface CollectionHeroProps {
  eyebrow: string
  title: string
  /** List colour — drives the gradient wash (or tints the cover image). */
  color: string
  coverImage?: string | null
  description?: string | null
  links?: CollectionLink[]
  /** Accepted members (owner first) — shown as an avatar stack when shared. */
  members: CollectionMember[]
  canShare: boolean
  isOwner: boolean
  canEdit: boolean
  onEdit: () => void
  shareMemberCount: number
  onShare: () => void
  t: TranslationFn
}

/**
 * The page header — a colour-washed (or cover-image) glass hero that gives the
 * active list an identity: an eyebrow with the sharing state + member avatars,
 * the big list name, an optional description + link chips, and a Share action
 * top-right. Filtering lives in the toolbar above the places, not here.
 * Modelled on the dashboard hero-trip.
 */
function linkHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export default function CollectionHero({
  eyebrow, title, color, coverImage, description, links,
  members, canShare, isOwner, canEdit, onEdit, shareMemberCount, onShare, t,
}: CollectionHeroProps): React.ReactElement {
  const accepted = members.filter(m => m.status === 'accepted' || m.is_owner)
  const showAvatars = accepted.length > 1
  const shown = accepted.slice(0, 5)
  const extra = accepted.length - shown.length

  return (
    <header className="col-hero" style={{ ['--hero-color' as string]: color }}>
      {coverImage ? (
        <>
          <img className="col-hero-img" src={coverImage} alt="" />
          <div className="col-hero-tint" />
        </>
      ) : (
        <div className="col-hero-bg" />
      )}
      <div className="col-hero-scrim" />

      <div className="col-hero-content">
        <div className="col-hero-eyebrow">
          <span>{eyebrow}</span>
          {showAvatars && (
            <span className="members">
              {shown.map(m => (
                m.avatar
                  ? <img key={m.user_id} className="col-av" src={avatarSrc(m.avatar)!} alt={m.username} />
                  : <span key={m.user_id} className="col-av" style={{ background: AV_COLORS[m.user_id % AV_COLORS.length] }}>{initials(m.username)}</span>
              ))}
              {extra > 0 && <span className="col-av" style={{ background: 'rgba(255,255,255,.28)' }}>+{extra}</span>}
            </span>
          )}
          {links && links.length > 0 && (
            <span className="col-hero-links">
              {links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="col-hero-link" onClick={e => e.stopPropagation()}>
                  <Link2 size={12} /> {l.label || linkHost(l.url)}
                </a>
              ))}
            </span>
          )}
        </div>

        <div className="col-hero-titlerow">
          <h1 className="col-hero-title">{title}</h1>
          <div className="col-hero-actions">
            {canEdit && (
              <button type="button" onClick={onEdit} aria-label={t('common.edit')} title={t('common.edit')} className="col-glass-btn">
                <Pencil size={15} />
                <span className="txt">{t('common.edit')}</span>
              </button>
            )}
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
          </div>
        </div>

        {description && <p className="col-hero-desc">{description}</p>}
      </div>
    </header>
  )
}
