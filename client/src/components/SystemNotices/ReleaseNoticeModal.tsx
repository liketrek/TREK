import React from 'react';
import { ArrowRight, Heart, Infinity as InfinityIcon, X } from 'lucide-react';
import { useTranslation } from '../../i18n/TranslationContext.js';
import type { SystemNoticeDTO } from '../../store/systemNoticeStore.js';
import { ReleaseFeatureVisual } from './ReleaseNoticeVisuals.js';
import './releaseNotice.css';

interface Props {
  notice: SystemNoticeDTO;
  visible: boolean;
  onDismiss: () => void;
  onCTA: () => void;
  onSecondaryCTA: () => void;
}

/** Lucide's coffee cup, drawn here so its three steam strokes can drift up in waves. */
function SteamingCoffee() {
  return (
    <svg className="rn-coffee" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path className="rn-steam" d="M6 5.5c-1.2-.9 1.2-1.7 0-2.6s1.2-1.7 0-2.6 1.2-1.7 0-2.6" />
      <path className="rn-steam" d="M10 5.5c-1.2-.9 1.2-1.7 0-2.6s1.2-1.7 0-2.6 1.2-1.7 0-2.6" />
      <path className="rn-steam" d="M14 5.5c-1.2-.9 1.2-1.7 0-2.6s1.2-1.7 0-2.6 1.2-1.7 0-2.6" />
    </svg>
  );
}

/** Splits a translated block into paragraphs the way the notice bodies are written. */
function paragraphs(text: string): string[] {
  return text.split('\n\n').map(p => p.trim()).filter(Boolean);
}

/**
 * The release modal: what shipped on the left, a note from the maintainer on
 * the right. Rendered instead of the generic notice body whenever a notice
 * carries `release`. Every string comes from that block, so a later release
 * only edits the registry entry and its keys.
 *
 * Desktop only (the notice carrying it sets `desktopOnly`), and it keeps the
 * generic modal's behaviour: the host hook still owns ESC, the scroll lock and
 * the dismissal, this component only draws.
 */
export function ReleaseNoticeModal({ notice, visible, onDismiss, onCTA, onSecondaryCTA }: Props) {
  const { t } = useTranslation();
  const release = notice.release;
  if (!release) return null;

  const titleId = `notice-title-${notice.id}`;
  const bodyId = `notice-body-${notice.id}`;

  return (
    <div
      className="rn-overlay"
      role="presentation"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 260ms ease' }}
      onClick={notice.dismissible ? e => { if (e.target === e.currentTarget) onDismiss() } : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="rn-panel"
      >
        {/* A child of the panel, not the note: stacked, the panel scrolls and the
            note is its second screen, so the button sticks to the panel's edge. */}
        {notice.dismissible && (
          <button type="button" className="rn-close" onClick={onDismiss} aria-label={t('common.close')}>
            <X size={17} strokeWidth={2} />
          </button>
        )}

        {/* ── Left: the release ─────────────────────────────────────────── */}
        <div className="rn-release">
          <div className="rn-release-grain" aria-hidden="true" />

          <div className="rn-release-inner">
            <div className="rn-eyebrow-row">
              <span className="rn-mark">
                <img src="/icons/icon-white.svg" alt="" aria-hidden="true" />
              </span>
              <span className="rn-eyebrow">{t(release.eyebrowKey)}</span>
            </div>

            <div className="rn-version">{release.version}</div>

            <h2 id={titleId} className="rn-headline">{t(release.headlineKey)}</h2>
            <p id={bodyId} className="rn-intro">{t(release.introKey)}</p>

            <div className="rn-features-head">
              <span className="rn-features-label">{t(release.featuresLabelKey)}</span>
              <span className="rn-features-rule" aria-hidden="true" />
              {release.featuresAsideKey && (
                <span className="rn-features-aside">{t(release.featuresAsideKey)}</span>
              )}
            </div>

            <div className="rn-features">
              {release.features.map(f => (
                <div key={f.titleKey} className={f.layout === 'wide' ? 'rn-feature rn-feature-wide' : 'rn-feature'}>
                  <div className="rn-feature-shine" aria-hidden="true" />
                  <div className="rn-feature-visual" aria-hidden="true">
                    <ReleaseFeatureVisual visual={f.visual} iconName={f.iconName} />
                  </div>
                  <div>
                    <div className="rn-feature-title">{t(f.titleKey)}</div>
                    <div className="rn-feature-body">{t(f.bodyKey)}</div>
                  </div>
                </div>
              ))}
            </div>

            {(release.footnoteKey || release.notes) && (
              <div className="rn-release-foot">
                <div className="rn-footnote">{release.footnoteKey ? t(release.footnoteKey) : null}</div>
                {release.notes && (
                  <a
                    className="rn-notes"
                    href={release.notes.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t(release.notes.labelKey)}
                    <span className="rn-notes-arrow">
                      <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: the note ───────────────────────────────────────────── */}
        <div className="rn-note">
          <div className="rn-note-body">
            <div className="rn-note-eyebrow">{t(release.note.eyebrowKey)}</div>
            <h3 className="rn-note-title">{t(release.note.titleKey)}</h3>

            {paragraphs(t(release.note.bodyKey)).map((p, i) => <p key={i}>{p}</p>)}

            <div className="rn-promise">
              <div className="rn-promise-label">
                <InfinityIcon size={14} strokeWidth={2.1} aria-hidden="true" />
                {t(release.note.promiseLabelKey)}
              </div>
              <div className="rn-promise-text">
                <b>{t(release.note.promiseLeadKey)}</b>{' '}
                <span>{t(release.note.promiseTextKey)}</span>
              </div>
            </div>

            {paragraphs(t(release.note.bodyAfterKey)).map((p, i) => <p key={i}>{p}</p>)}

            <div className="rn-closing">{t(release.note.closingKey)}</div>
          </div>

          <div className="rn-support">
            <div className="rn-support-text">
              <b>{t(release.supportLeadKey)}</b> {t(release.supportTextKey)}
            </div>
            <div className="rn-support-buttons">
              {notice.cta && (
                <button type="button"
                  id={`notice-cta-${notice.id}`}
                  className="rn-support-btn rn-support-bmc"
                  onClick={onCTA}
                >
                  <SteamingCoffee />
                  {t(notice.cta.labelKey)}
                </button>
              )}
              {notice.secondaryCta && (
                <button type="button"
                  id={`notice-cta2-${notice.id}`}
                  className="rn-support-btn rn-support-kofi"
                  onClick={onSecondaryCTA}
                >
                  <Heart className="rn-heart" size={18} strokeWidth={2.1} aria-hidden="true" />
                  {t(notice.secondaryCta.labelKey)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
