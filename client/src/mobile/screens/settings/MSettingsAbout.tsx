import { Bug, BookOpen, Coffee, ExternalLink, Heart, Info, Lightbulb } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { MSetCard } from './MSettingsUi'

interface AboutLink {
  href: string
  icon: LucideIcon
  title: string
  sub: string
}

/** "About" section — AboutTab parity as tappable link rows. */
export default function MSettingsAbout({ appVersion }: { appVersion: string }) {
  const { t } = useTranslation()

  const links: AboutLink[] = [
    { href: 'https://ko-fi.com/mauriceboe', icon: Coffee, title: 'Ko-fi', sub: t('admin.github.support') },
    { href: 'https://buymeacoffee.com/mauriceboe', icon: Heart, title: 'Buy Me a Coffee', sub: t('admin.github.support') },
    { href: 'https://discord.gg/NhZBDSd4qW', icon: Heart, title: 'Discord', sub: 'Join the community' },
    { href: 'https://github.com/mauriceboe/TREK/issues/new?template=bug_report.yml', icon: Bug, title: t('settings.about.reportBug'), sub: t('settings.about.reportBugHint') },
    { href: 'https://github.com/mauriceboe/TREK/discussions/new?category=feature-requests', icon: Lightbulb, title: t('settings.about.featureRequest'), sub: t('settings.about.featureRequestHint') },
    { href: 'https://github.com/mauriceboe/TREK/wiki', icon: BookOpen, title: 'Wiki', sub: t('settings.about.wikiHint') },
  ]

  return (
    <MSetCard title={t('settings.about')} icon={Info}>
      <p className="text-[0.78125rem] leading-relaxed text-m-muted">{t('settings.about.description')}</p>
      <p className="mt-2 font-geist text-[0.6875rem] text-m-faint">
        {t('settings.about.madeWith')} <Heart size={10} className="inline-block align-[-1px] text-[color:var(--m-st-danger)]" />{' '}
        {t('settings.about.madeBy')}{' '}
        <span className="inline-flex items-center rounded-full bg-[color:var(--m-ic)] px-[7px] py-[1px] font-geist text-[0.625rem] font-bold text-m-muted align-[1px]">
          v{appVersion}
        </span>
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[13px] rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-[14px] py-3 no-underline"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[color:var(--m-ic)] text-m-ink">
              <link.icon size={19} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-bold text-m-ink">{link.title}</span>
              <span className="block font-geist text-[0.625rem] text-m-muted">{link.sub}</span>
            </span>
            <ExternalLink size={14} className="flex-none text-m-faint" />
          </a>
        ))}
      </div>
    </MSetCard>
  )
}
