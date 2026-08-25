import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ArrowRight, Coffee, Heart, Infinity as InfinityIcon, Sparkles, X } from 'lucide-react';
import { useTranslation } from '../../i18n/TranslationContext.js';
import type { SystemNoticeDTO } from '../../store/systemNoticeStore.js';
import './releaseNotice.css';

interface Props {
  notice: SystemNoticeDTO;
  visible: boolean;
  onDismiss: () => void;
  onCTA: () => void;
  onSecondaryCTA: () => void;
}

/** Splits a translated block into paragraphs the way the notice bodies are written. */
function paragraphs(text: string): string[] {
  return text.split('\n\n').map(p => p.trim()).filter(Boolean);
}

/**
 * The release modal: what shipped on the left, a note from the maintainer on
 * the right. Rendered instead of the generic notice body whenever a notice
 * carries `release` — every string comes from that block, so a later release
 * only edits the registry entry.
 *
 * Desktop only (the notices carrying it set `desktopOnly`), and it keeps the
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

            <div className="rn-version-row">
              <div className="rn-version">{release.version}</div>
              <div className="rn-tag">{t(release.tagKey)}</div>
            </div>

            <h2 id={titleId} className="rn-headline">{t(release.headlineKey)}</h2>
            <p id={bodyId} className="rn-intro">{t(release.introKey)}</p>

            <div className="rn-features">
              {release.features.map(f => {
                const Icon: React.ElementType =
                  ((LucideIcons as Record<string, unknown>)[f.iconName] as React.ElementType) ?? Sparkles;
                return (
                  <div key={f.titleKey} className="rn-feature">
                    <span className="rn-feature-icon">
                      <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <div className="rn-feature-text">
                      <div className="rn-feature-title">
                        {t(f.titleKey)}
                        {f.badgeKey && <span className="rn-badge">{t(f.badgeKey)}</span>}
                      </div>
                      <div className="rn-feature-body">{t(f.bodyKey)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {((release.stats?.length ?? 0) > 0 || release.notes) && (
              <div className="rn-release-foot">
                {release.stats && release.stats.length > 0 && (
                  <div className="rn-stats">
                    {release.stats.map(s => (
                      <div key={s.labelKey}>
                        <div className="rn-stat-value">{s.value}</div>
                        <div className="rn-stat-label">{t(s.labelKey)}</div>
                      </div>
                    ))}
                  </div>
                )}

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

            {release.footnoteKey && (
              <div className="rn-footnote">{t(release.footnoteKey)}</div>
            )}
          </div>
        </div>

        {/* ── Right: the note ───────────────────────────────────────────── */}
        <div className="rn-note">
          {notice.dismissible && (
            <button type="button" className="rn-close" onClick={onDismiss} aria-label={t('common.close')}>
              <X size={18} strokeWidth={2} />
            </button>
          )}

          <div className="rn-note-body">
            <div className="rn-note-eyebrow">{t(release.note.eyebrowKey)}</div>
            <h3 className="rn-note-title">{t(release.note.titleKey)}</h3>

            {paragraphs(t(release.note.bodyKey)).map((p, i) => <p key={i}>{p}</p>)}

            <div className="rn-promise">
              <div className="rn-promise-label">
                <InfinityIcon size={14} strokeWidth={2.1} aria-hidden="true" />
                {t(release.note.promiseLabelKey)}
              </div>
              <div className="rn-promise-text">{t(release.note.promiseTextKey)}</div>
            </div>

            {paragraphs(t(release.note.bodyAfterKey)).map((p, i) => <p key={i}>{p}</p>)}

            <div className="rn-signoff">
              <div className="rn-closing">{t(release.note.closingKey)}</div>
              <div className="rn-signature">{t(release.note.signatureKey)}</div>
            </div>
          </div>

          <div className="rn-support">
            <div className="rn-support-text">{t(release.supportTextKey)}</div>
            <div className="rn-support-buttons">
              {notice.cta && (
                <button type="button"
                  id={`notice-cta-${notice.id}`}
                  className="rn-support-btn rn-support-bmc"
                  onClick={onCTA}
                >
                  <Coffee size={18} strokeWidth={2.1} aria-hidden="true" />
                  {t(notice.cta.labelKey)}
                </button>
              )}
              {notice.secondaryCta && (
                <button type="button"
                  id={`notice-cta2-${notice.id}`}
                  className="rn-support-btn rn-support-kofi"
                  onClick={onSecondaryCTA}
                >
                  <Heart size={18} strokeWidth={2.1} aria-hidden="true" />
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
