import type { ComponentType, ReactNode } from 'react'
import { CalendarDays, Eye, Heart } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { fs } from '../../components/shared/DialogShell'
import { SlidingTabs } from '../../components/shared/SlidingTabs'
import { Tooltip } from '../../components/shared/Tooltip'
import PublicLanguagePicker from '../../components/shared/PublicLanguagePicker'
import { coverSrc, formatDateRange } from './sharedTripModel'

/**
 * The frame of the public trip page: the top bar the planner has, a hero made
 * of the trip's cover, the tab bar that stays in reach while the page scrolls,
 * and the footer. The page pins itself to the light look (applyAppearance
 * skips /shared), so the tokens here resolve to their light values.
 */

export const PAGE_WIDTH = 'mx-auto w-full max-w-[1280px] px-4 sm:px-6'

// Over a photo nothing but white type on a dark scrim reads, whatever the
// photo is; without a cover the same dark ground keeps the hero one piece.
const HERO_GROUND = 'linear-gradient(135deg, #0b1020 0%, #1e293b 55%, #334155 100%)' // theme-lint-disable: the hero's own ground under white type
const HERO_SCRIM = 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.74) 100%)' // theme-lint-disable: a scrim over a photo
const GLASS = 'inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 font-semibold text-white backdrop-blur-md' // theme-lint-disable: glass over a photo

interface TopBarProps {
  title: string
  locale: string
  langOpen: boolean
  onLangOpenChange: React.Dispatch<React.SetStateAction<boolean>>
}

/** The planner's top bar, for a reader: the brand and the trip, read-only, and the language. */
export function SharedTopBar({ title, locale, langOpen, onLangOpenChange }: TopBarProps) {
  const { t } = useTranslation()
  return (
    <header className="border-b border-edge-faint bg-surface-elevated">
      <div className={`${PAGE_WIDTH} flex h-14 items-center gap-3`}>
        <img src="/icons/icon-dark.svg" alt="TREK" className="sm:hidden" style={{ height: 22, width: 22 }} />
        <img src="/logo-dark.svg" alt="TREK" className="hidden sm:block" style={{ height: 26 }} />
        <span className="hidden text-content-faint sm:inline">/</span>
        <span className="hidden min-w-0 truncate font-medium text-content-muted sm:inline" style={fs(14, 'body')}>{title}</span>
        <div className="ml-auto flex flex-none items-center gap-2">
          <Tooltip label={t('shared.readOnly')}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-tertiary px-3 py-1.5 font-semibold text-content-muted" style={fs(12, 'body')}>
              <Eye size={13} strokeWidth={2} className="flex-none" aria-hidden />
              <span className="hidden sm:inline">{t('shared.readOnly')}</span>
            </span>
          </Tooltip>
          <PublicLanguagePicker variant="bar" locale={locale} open={langOpen} onOpenChange={onLangOpenChange} />
        </div>
      </div>
    </header>
  )
}

export interface HeroStat {
  key: string
  value: number
  label: string
}

interface HeroProps {
  trip: { title: string; description?: string | null; cover_image?: string | null; start_date?: string | null; end_date?: string | null }
  stats: HeroStat[]
}

/** The trip as a postcard: its cover, its dates, its name, what the owner wrote about it, and how big it is. */
export function SharedHero({ trip, stats }: HeroProps) {
  const { locale } = useTranslation()
  const cover = coverSrc(trip.cover_image)
  const dates = formatDateRange(trip.start_date, trip.end_date, locale)
  return (
    <section data-testid="shared-hero" className="relative isolate overflow-hidden rounded-[28px] shadow-sm" style={{ background: HERO_GROUND }}>
      {cover && <img src={cover} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />}
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: HERO_SCRIM }} />
      <div className="flex min-h-[170px] flex-col items-start justify-end gap-2.5 p-5 text-white sm:min-h-[200px] sm:px-8 sm:py-6">
        {dates && (
          <span className={GLASS} style={fs(12, 'body')}>
            <CalendarDays size={13} strokeWidth={2} aria-hidden />
            {dates}
          </span>
        )}
        <h1 className="max-w-4xl text-balance font-bold leading-[1.1] tracking-tight" style={{ fontSize: 'calc(32px * var(--fs-scale-title, 1))' }}>{trip.title}</h1>
        {trip.description && (
          <p className="max-w-2xl whitespace-pre-line text-white/80" style={fs(14.5, 'body')}>{trip.description}</p> // theme-lint-disable: white type over a photo
        )}
        {stats.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {stats.map(s => (
              <span key={s.key} className={GLASS} style={fs(12, 'body')}>
                <span className="font-geist font-bold tabular-nums">{s.value}</span>
                <span className="font-medium text-white/80">{s.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export interface SharedTab {
  id: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
}

/** The tabs, in a raised pill that stays at the top while the page scrolls under it. */
export function SharedTabBar({ tabs, active, onChange }: { tabs: SharedTab[]; active: string; onChange: (id: string) => void }) {
  if (tabs.length < 2) return null
  return (
    <div
      className="sticky top-0 z-30 py-3"
      style={{ background: 'color-mix(in srgb, var(--bg-secondary) 86%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
    >
      <div className="flex justify-center">
        <div className="max-w-full rounded-full border border-edge-faint bg-surface-card p-1 shadow-sm">
          <SlidingTabs
            tabs={tabs.map(tab => ({ id: tab.id, label: <span className="hidden sm:inline">{tab.label}</span>, ariaLabel: tab.label, icon: tab.icon }))}
            activeTab={active}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  )
}

/** A section's own head: its name, a count, and whatever else it says about itself. */
export function SectionTitle({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 px-0.5">
      <span className="grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-card text-content-secondary shadow-sm">{icon}</span>
      <h2 className="font-bold text-content" style={fs(16, 'subtitle')}>{title}</h2>
      {children}
    </div>
  )
}

/** What a section says when the owner shared it but there is nothing in it yet. */
export function EmptySection({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-edge bg-surface-card px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-tertiary text-content-faint">{icon}</span>
      <p className="font-medium text-content-muted" style={fs(13.5, 'body')}>{text}</p>
    </div>
  )
}

export function SharedFooter() {
  const { t } = useTranslation()
  return (
    <footer className="mt-14 border-t border-edge-faint bg-surface-card">
      <div className={`${PAGE_WIDTH} flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left`}>
        <div className="flex items-center gap-3">
          <img src="/icons/icon.svg" alt="TREK" width="34" height="34" className="rounded-[10px] shadow-sm" />
          <div>
            <div className="text-content-muted" style={fs(13, 'body')}>
              {t('shared.sharedVia')} <strong className="text-content">TREK</strong>
            </div>
            <div className="text-content-faint" style={fs(12, 'body')}>{t('shared.footerTagline')}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 text-content-faint" style={fs(12, 'body')}>
            Made with <Heart size={12} strokeWidth={2.4} className="fill-current text-danger" aria-label="love" /> by Maurice
          </span>
          <a
            href="https://github.com/liketrek/TREK"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-edge-faint bg-surface-card px-3 py-1.5 font-semibold text-content-secondary shadow-sm transition-colors hover:text-content"
            style={fs(12, 'body')}
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}

/** The page's shape while the payload is on its way, so nothing jumps when it lands. */
export function SharedLoading() {
  return (
    <div className="min-h-screen bg-surface-secondary" aria-busy="true">
      <div className="h-14 border-b border-edge-faint bg-surface-elevated" />
      <div className={`${PAGE_WIDTH} animate-pulse pt-5`}>
        <div className="h-[170px] rounded-[28px] bg-surface-tertiary sm:h-[200px]" />
        <div className="mx-auto my-4 h-10 w-72 rounded-full bg-surface-tertiary" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map(i => <div key={i} className="h-28 rounded-2xl bg-surface-tertiary" />)}
          </div>
          <div className="hidden h-[520px] rounded-2xl bg-surface-tertiary lg:block" />
        </div>
      </div>
    </div>
  )
}
