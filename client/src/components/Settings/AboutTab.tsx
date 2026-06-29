import React from 'react'
import { Info, Coffee, Heart, ExternalLink, Bug, Lightbulb, BookOpen } from 'lucide-react'
import { useTranslation } from '../../i18n'
import Section from './Section'

interface Props {
  appVersion: string
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

    </Section>
  )
}
