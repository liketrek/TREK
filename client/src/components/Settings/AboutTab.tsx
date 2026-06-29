import React from 'react'
import { Info, Coffee, Heart, ExternalLink, Bug, Lightbulb, BookOpen, Tent, Compass, Plane, Crown, Infinity as InfinityIcon } from 'lucide-react'
import { useTranslation } from '../../i18n'
import Section from './Section'

interface Props {
  appVersion: string
}

type SupporterTierId = 'no_return_ticket' | 'lost_luggage_vip' | 'business_class_dreamer' | 'budget_traveller' | 'hostel_bunkmate'

interface SupporterTier {
  id: SupporterTierId
  labelKey: string
  price: string
  gradient: string
  glow: string
  icon: typeof Tent
}

const SUPPORTER_TIERS: SupporterTier[] = [
  { id: 'no_return_ticket', labelKey: 'settings.about.supporter.tier.noReturnTicket', price: '∞', gradient: 'linear-gradient(135deg, #fbbf24, #ec4899 55%, #6366f1)', glow: 'rgba(236,72,153,0.45)', icon: InfinityIcon },
  { id: 'lost_luggage_vip', labelKey: 'settings.about.supporter.tier.lostLuggageVip', price: '$30', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)', glow: 'rgba(168,85,247,0.35)', icon: Crown },
  { id: 'business_class_dreamer', labelKey: 'settings.about.supporter.tier.businessClassDreamer', price: '$15', gradient: 'linear-gradient(135deg, #6366f1, #0ea5e9)', glow: 'rgba(99,102,241,0.35)', icon: Plane },
  { id: 'budget_traveller', labelKey: 'settings.about.supporter.tier.budgetTraveller', price: '$10', gradient: 'linear-gradient(135deg, #14b8a6, #06b6d4)', glow: 'rgba(20,184,166,0.3)', icon: Compass },
  { id: 'hostel_bunkmate', labelKey: 'settings.about.supporter.tier.hostelBunkmate', price: '$5', gradient: 'linear-gradient(135deg, #64748b, #94a3b8)', glow: 'rgba(100,116,139,0.25)', icon: Tent },
]

interface Supporter {
  username: string
  tier: SupporterTierId
  since: string
  link?: string
}

const SUPPORTERS: Supporter[] = [
  { username: 'Someone', tier: 'hostel_bunkmate', since: '2026-04' },
]

function SupporterSection({ t, locale }: { t: (key: string, vars?: Record<string, string | number>) => string; locale: string }) {
  if (SUPPORTERS.length === 0) return null

  const formatSince = (yearMonth: string): string => {
    const [y, m] = yearMonth.split('-').map(Number)
    if (!y || !m) return yearMonth
    try {
      return new Date(y, m - 1, 1).toLocaleDateString(locale, { year: 'numeric', month: 'long' })
    } catch { return yearMonth }
  }

  return (
    <div className="supporter-section">
      <style>{`
        .supporter-section { margin-top: 20px; }
        .supporter-card {
          position: relative;
          border-radius: 20px;
          padding: 22px 22px 18px;
          background: linear-gradient(180deg, rgba(99,102,241,0.06) 0%, rgba(236,72,153,0.04) 100%);
          border: 1px solid rgba(99,102,241,0.18);
          overflow: hidden;
        }
        .supporter-glow {
          position: absolute; inset: -60px; z-index: 0; pointer-events: none;
          background: radial-gradient(500px 240px at 15% -10%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(400px 200px at 90% 110%, rgba(236,72,153,0.12), transparent 60%);
          animation: supporterGlow 6s ease-in-out infinite;
        }
        .supporter-header {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .supporter-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 999px;
          background: linear-gradient(90deg, #6366f1, #ec4899, #fbbf24);
          background-size: 200% 100%;
          animation: supporterShimmer 4s ease-in-out infinite;
          color: #fff; font-weight: 700; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase;
          box-shadow: 0 4px 16px rgba(236,72,153,0.25);
          white-space: nowrap;
        }
        .supporter-title {
          margin: 0; font-size: 16px; font-weight: 700;
          color: var(--text-primary); letter-spacing: -0.01em;
        }
        .supporter-subtitle {
          position: relative; z-index: 1;
          margin: 0 0 16px; font-size: 12.5px;
          color: var(--text-secondary); line-height: 1.55;
        }
        .supporter-tiers {
          position: relative; z-index: 1;
          display: flex; flex-direction: column; gap: 10px;
        }
        .supporter-tier {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 12px; border-radius: 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
        }
        .supporter-tier-icon {
          width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
        }
        .supporter-tier-body { flex: 1; min-width: 0; }
        .supporter-tier-head {
          display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
        }
        .supporter-tier-label {
          font-size: 13.5px; font-weight: 700; color: var(--text-primary);
        }
        .supporter-tier-price {
          font-size: 11px; font-weight: 600; color: var(--text-faint);
          padding: 1px 7px; border-radius: 6px; background: var(--bg-tertiary);
        }
        .supporter-tier-chips {
          display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;
        }
        .supporter-tier-empty {
          font-size: 11.5px; font-style: italic; color: var(--text-faint);
        }
        .supporter-chip {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 4px 10px; border-radius: 999px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          max-width: 100%;
        }
        .supporter-chip-name {
          font-size: 12px; font-weight: 600; color: var(--text-primary);
          white-space: nowrap;
        }
        .supporter-chip-since {
          font-size: 10.5px; font-weight: 500; color: var(--text-faint);
          white-space: nowrap;
        }
        .supporter-chip-since-short { display: none; }
        @keyframes supporterShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes supporterGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.75; }
        }
        @media (max-width: 640px) {
          .supporter-card { border-radius: 16px; padding: 16px 14px 14px; }
          .supporter-glow { inset: -40px; }
          .supporter-header { gap: 8px; }
          .supporter-badge { font-size: 10px; padding: 3px 9px; letter-spacing: 0.03em; }
          .supporter-title { font-size: 15px; flex-basis: 100%; }
          .supporter-subtitle { font-size: 12px; margin-bottom: 14px; }
          .supporter-tier { padding: 10px; gap: 10px; border-radius: 12px; }
          .supporter-tier-icon { width: 34px; height: 34px; border-radius: 10px; }
          .supporter-tier-label { font-size: 13px; }
          .supporter-tier-chips { gap: 5px; margin-top: 7px; }
          .supporter-chip { padding: 3px 9px; }
          .supporter-chip-since { font-size: 10px; }
          .supporter-chip-since-full { display: none; }
          .supporter-chip-since-short { display: inline; }
        }
      `}</style>
      <div className="supporter-card">
        <div className="supporter-glow" />

        <div className="supporter-header">
          <span className="supporter-badge">{t('settings.about.supporters.badge')}</span>
          <h3 className="supporter-title">{t('settings.about.supporters.title')}</h3>
        </div>
        <p className="supporter-subtitle">{t('settings.about.supporters.subtitle')}</p>

        <div className="supporter-tiers">
          {SUPPORTER_TIERS.map(tier => {
            const members = SUPPORTERS.filter(s => s.tier === tier.id)
            const empty = members.length === 0
            const TierIcon = tier.icon
            return (
              <div key={tier.id} className="supporter-tier" style={{ opacity: empty ? 0.55 : 1 }}>
                <div className="supporter-tier-icon" style={{ background: tier.gradient, boxShadow: `0 6px 18px ${tier.glow}` }}>
                  <TierIcon size={18} strokeWidth={2.2} />
                </div>
                <div className="supporter-tier-body">
                  <div className="supporter-tier-head">
                    <span className="supporter-tier-label">{t(tier.labelKey)}</span>
                    <span className="supporter-tier-price">{tier.price}</span>
                  </div>
                  <div className="supporter-tier-chips">
                    {empty && (
                      <span className="supporter-tier-empty">
                        {t('settings.about.supporters.tierEmpty')}
                      </span>
                    )}
                    {members.map(m => {
                      const chipContent = (
                        <>
                          <span className="supporter-chip-name">{m.username}</span>
                          <span className="supporter-chip-since supporter-chip-since-full">
                            · {t('settings.about.supporters.since', { date: formatSince(m.since) })}
                          </span>
                          <span className="supporter-chip-since supporter-chip-since-short">
                            · {formatSince(m.since)}
                          </span>
                        </>
                      )
                      return m.link ? (
                        <a key={m.username} href={m.link} target="_blank" rel="noopener noreferrer" className="supporter-chip"
                          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-faint)'; e.currentTarget.style.boxShadow = `0 2px 8px ${tier.glow}` }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none' }}
                        >
                          {chipContent}
                        </a>
                      ) : (
                        <div key={m.username} className="supporter-chip">{chipContent}</div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AboutTab({ appVersion }: Props): React.ReactElement {
  const { t, locale } = useTranslation()

  return (
    <Section title={t('settings.about')} icon={Info}>
      <style>{`
        @keyframes heartPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
      <p className="text-content-secondary" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', lineHeight: 1.6, marginBottom: 6, marginTop: -4 }}>
        {t('settings.about.description')}
      </p>
      <p className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', lineHeight: 1.6, marginBottom: 16 }}>
        {t('settings.about.madeWith')}{' '}
        <Heart size={11} fill="#991b1b" stroke="#991b1b" style={{ display: 'inline-block', verticalAlign: '-1px', animation: 'heartPulse 1.5s ease-in-out infinite' }} />
        {' '}{t('settings.about.madeBy')}{' '}
        <span className="text-content-faint bg-surface-tertiary" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 99, padding: '1px 7px', fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, verticalAlign: '1px' }}>v{appVersion}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href="https://ko-fi.com/mauriceboe"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border overflow-hidden flex items-center gap-4 px-5 py-4 transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] bg-surface-card border-edge no-underline"
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff5e5b'; e.currentTarget.style.boxShadow = '0 0 0 1px #ff5e5b22' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="bg-[#ff5e5b15]" style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Coffee size={20} className="text-[#ff5e5b]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-content">Ko-fi</div>
            <div className="text-xs text-content-faint">{t('admin.github.support')}</div>
          </div>
          <ExternalLink size={14} className="ml-auto flex-shrink-0 text-content-faint" />
        </a>
        <a
          href="https://buymeacoffee.com/mauriceboe"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border overflow-hidden flex items-center gap-4 px-5 py-4 transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] bg-surface-card border-edge no-underline"
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ffdd00'; e.currentTarget.style.boxShadow = '0 0 0 1px #ffdd0022' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="bg-[#ffdd0015]" style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Heart size={20} className="text-[#ffdd00]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-content">Buy Me a Coffee</div>
            <div className="text-xs text-content-faint">{t('admin.github.support')}</div>
          </div>
          <ExternalLink size={14} className="ml-auto flex-shrink-0 text-content-faint" />
        </a>
        <a
          href="https://discord.gg/NhZBDSd4qW"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border overflow-hidden flex items-center gap-4 px-5 py-4 transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] bg-surface-card border-edge no-underline"
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#5865F2'; e.currentTarget.style.boxShadow = '0 0 0 1px #5865F222' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="bg-[#5865F215]" style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-content">Discord</div>
            <div className="text-xs text-content-faint">Join the community</div>
          </div>
          <ExternalLink size={14} className="ml-auto flex-shrink-0 text-content-faint" />
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <a
          href="https://github.com/mauriceboe/TREK/issues/new?template=bug_report.yml"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border overflow-hidden flex items-center gap-4 px-5 py-4 transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] bg-surface-card border-edge no-underline"
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.boxShadow = '0 0 0 1px #ef444422' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="bg-[#ef444415]" style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bug size={20} className="text-[#ef4444]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-content">{t('settings.about.reportBug')}</div>
            <div className="text-xs text-content-faint">{t('settings.about.reportBugHint')}</div>
          </div>
          <ExternalLink size={14} className="ml-auto flex-shrink-0 text-content-faint" />
        </a>
        <a
          href="https://github.com/mauriceboe/TREK/discussions/new?category=feature-requests"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border overflow-hidden flex items-center gap-4 px-5 py-4 transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] bg-surface-card border-edge no-underline"
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 1px #f59e0b22' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="bg-[#f59e0b15]" style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lightbulb size={20} className="text-[#f59e0b]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-content">{t('settings.about.featureRequest')}</div>
            <div className="text-xs text-content-faint">{t('settings.about.featureRequestHint')}</div>
          </div>
          <ExternalLink size={14} className="ml-auto flex-shrink-0 text-content-faint" />
        </a>
        <a
          href="https://github.com/mauriceboe/TREK/wiki"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border overflow-hidden flex items-center gap-4 px-5 py-4 transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] bg-surface-card border-edge no-underline"
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 1px #6366f122' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <div className="bg-[#6366f115]" style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={20} className="text-[#6366f1]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-content">Wiki</div>
            <div className="text-xs text-content-faint">{t('settings.about.wikiHint')}</div>
          </div>
          <ExternalLink size={14} className="ml-auto flex-shrink-0 text-content-faint" />
        </a>
      </div>

      <SupporterSection t={t} locale={locale} />
    </Section>
  )
}
