import React, { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight, BookOpen, LayoutList, ListOrdered, Compass, ChevronRight, ChevronDown, Camera, LayoutGrid } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useHelpStore, docTitle } from '../../store/helpStore'
import { ctxKey, ctxBulletKey, guideKey, guidesFor, helpMedia, docsRoute, helpContextTrail, childHelpContexts } from '../../help/registry'
import type { HelpContext, HelpGuide } from '../../help/types'
import { helpIcon } from './helpIcons'
import HelpBadge from './HelpBadge'
import HelpDocLink from './HelpDocLink'
import HelpSizeChip from './HelpSizeChip'
import { useScreenRoute } from './useScreenRoute'

/**
 * The overview of a screen: what it is, what is on it, and a card per guide.
 * With no registered context (a screen that has no help yet) it says so and
 * leaves the search box as the way forward.
 */
export default function HelpHome({ context }: { context: HelpContext | null }): React.ReactElement {
  const { t } = useTranslation()
  const docIndex = useHelpStore(s => s.docIndex)
  const closeHelp = useHelpStore(s => s.closeHelp)
  // Folded until asked for: the guides below matter more, the tabs are one click away.
  const [subScreensOpen, setSubScreensOpen] = useState(false)
  const screenRoute = useScreenRoute(context?.route)

  if (!context) {
    return (
      <div className="trek-help-view flex flex-col items-center text-center gap-2 py-24">
        <BookOpen className="w-8 h-8 text-content-faint" />
        <p className="text-subtitle font-semibold text-content">{t('help.center.noContext')}</p>
        <p className="text-body text-content-muted max-w-[320px]">{t('help.center.noContextHint')}</p>
      </div>
    )
  }

  const guides = guidesFor(context)
  const bullets = Array.from({ length: context.bullets }, (_, i) => t(ctxBulletKey(context.id, i + 1)))
  const children = childHelpContexts(context.id)
  const Icon = helpIcon(context.icon)

  return (
    <div className="trek-help-view flex flex-col gap-6">
      {/* Which screen, what it is, what help there is */}
      <header className="rounded-2xl border border-edge bg-surface-card p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <HelpBadge tone="outline" icon={Compass}>{t('help.center.screens')}</HelpBadge>
          {helpContextTrail(context).slice(0, -1).map(parent => (
            <React.Fragment key={parent.id}>
              <ChevronRight className="w-3.5 h-3.5 text-content-faint" />
              <HelpBadge tone="outline">{t(ctxKey(parent.id, 'title'))}</HelpBadge>
            </React.Fragment>
          ))}
          <ChevronRight className="w-3.5 h-3.5 text-content-faint" />
          <HelpBadge tone="outline">{t('help.center.overview')}</HelpBadge>
        </div>
        <div className="flex items-start gap-4">
          <span className="w-14 h-14 rounded-2xl bg-accent text-accent-text flex items-center justify-center flex-shrink-0 shadow-card">
            <Icon className="w-6 h-6" />
          </span>
          <div className="min-w-0 flex-1 flex flex-col gap-1.5">
            <h1 className="text-title font-bold text-content leading-tight">{t(ctxKey(context.id, 'title'))}</h1>
            <p className="text-body text-content-secondary leading-relaxed">{t(ctxKey(context.id, 'summary'))}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-edge-secondary">
          <HelpBadge tone="accent" icon={ListOrdered} count={guides.length}>{t('help.center.searchGuides')}</HelpBadge>
          {context.docs.length > 0 && <HelpBadge tone="neutral" icon={BookOpen} count={context.docs.length}>{t('help.center.searchDocs')}</HelpBadge>}
          {screenRoute && (
            <Link to={screenRoute} onClick={closeHelp} className="ml-auto">
              <HelpBadge tone="accent" icon={ArrowUpRight} className="hover:bg-accent-hover transition-colors">
                {t('help.center.goToScreen', { screen: t(ctxKey(context.id, 'title')) })}
              </HelpBadge>
            </Link>
          )}
        </div>
      </header>

      {/* Screens under this one (the tabs of Settings, the journal of Journey) */}
      {children.length > 0 && (
        <section className="rounded-2xl border border-edge bg-surface-card flex flex-col">
          <button
            type="button"
            onClick={() => setSubScreensOpen(o => !o)}
            aria-expanded={subScreensOpen}
            className="flex items-center gap-3 p-4 text-left rounded-2xl hover:bg-surface-hover transition-colors"
          >
            <HelpBadge tone="neutral" icon={LayoutGrid} uppercase count={children.length}>{t('help.center.subScreensLabel')}</HelpBadge>
            <span className="min-w-0 flex-1 text-caption text-content-muted truncate">
              {children.map(child => t(ctxKey(child.id, 'title'))).join(' · ')}
            </span>
            <ChevronDown className={`w-4 h-4 text-content-faint flex-shrink-0 transition-transform ${subScreensOpen ? 'rotate-180' : ''}`} />
          </button>
          {subScreensOpen && (
            <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 px-4 pb-4">
              {children.map(child => (
                <li key={child.id}>
                  <SubScreenCard screen={child} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* The screen itself */}
      {context.hero && (
        <figure className="relative rounded-2xl overflow-hidden border border-edge-secondary bg-surface-tertiary shadow-card">
          <img
            src={helpMedia.hero(context.id)}
            alt=""
            loading="lazy"
            decoding="async"
            className="block w-full aspect-video object-contain"
          />
          <span className="absolute bottom-3 left-3">
            <HelpBadge tone="accent" icon={Camera}>{t(ctxKey(context.id, 'title'))}</HelpBadge>
          </span>
        </figure>
      )}

      {/* What is on it */}
      {bullets.length > 0 && (
        <section className="rounded-2xl border border-edge bg-surface-card p-4 flex flex-col gap-3">
          <HelpBadge tone="neutral" icon={LayoutList} uppercase count={bullets.length} className="self-start">{t('help.center.onThisScreen')}</HelpBadge>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {bullets.map((text, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-surface-tertiary px-3.5 py-3 text-body text-content-secondary leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-accent text-accent-text text-caption font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Guides */}
      {guides.length > 0 && (
        <section className="flex flex-col gap-3">
          <HelpBadge tone="accent" icon={ListOrdered} uppercase count={guides.length} className="self-start">{t('help.center.howTo')}</HelpBadge>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guides.map(g => (
              <li key={g.id}>
                <GuideCard guide={g} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Docs */}
      {context.docs.length > 0 && (
        <section className="rounded-2xl border border-edge bg-surface-card p-4 flex flex-col gap-2">
          <HelpBadge tone="neutral" icon={BookOpen} uppercase count={context.docs.length} className="self-start">{t('help.center.docsSection')}</HelpBadge>
          <ul className="flex flex-col">
            {context.docs.map(link => (
              <li key={`${link.slug}#${link.anchor ?? ''}`}>
                <HelpDocLink to={docsRoute(link)} title={docTitle(docIndex, link.slug)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

/** One sub-screen: opens its overview in place; the one the reader is on says so. */
function SubScreenCard({ screen }: { screen: HelpContext }): React.ReactElement {
  const { t } = useTranslation()
  const browse = useHelpStore(s => s.browse)
  const contextId = useHelpStore(s => s.contextId)
  const current = screen.id === contextId
  const Icon = helpIcon(screen.icon)
  return (
    <button
      type="button"
      onClick={() => browse(current ? null : screen.id)}
      className="group w-full h-full flex items-center gap-3 rounded-xl border border-edge bg-surface-secondary px-3 py-2.5 text-left hover:border-content-faint hover:bg-surface-card transition-colors"
    >
      <span className="w-9 h-9 rounded-lg bg-surface-card text-content-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-accent group-hover:text-accent-text transition-colors">
        <Icon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1 flex flex-col gap-0.5">
        <span className="text-body font-semibold text-content truncate">{t(ctxKey(screen.id, 'title'))}</span>
        <span className="text-caption text-content-muted">{t('help.center.guidesCount', { count: screen.guides.length })}</span>
      </span>
      {current ? <ThisScreenChip /> : <ArrowRight className="w-4 h-4 text-content-faint transition-transform group-hover:translate-x-0.5 group-hover:text-content" />}
    </button>
  )
}

/** The marker for the screen the reader is actually on. */
export function ThisScreenChip(): React.ReactElement {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center rounded-full bg-accent text-accent-text px-2 py-1 text-caption font-semibold leading-none whitespace-nowrap flex-shrink-0">
      {t('help.center.thisScreen')}
    </span>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return <h3 className="text-caption font-semibold uppercase tracking-[0.1em] text-content-faint">{children}</h3>
}

export function GuideCard({ guide }: { guide: HelpGuide }): React.ReactElement {
  const { t } = useTranslation()
  const openGuide = useHelpStore(s => s.openGuide)
  const Icon = helpIcon(guide.icon)
  return (
    <button
      type="button"
      onClick={() => openGuide(guide.id)}
      className="group w-full h-full flex flex-col gap-3 rounded-2xl border border-edge bg-surface-card p-4 text-left hover:border-content-faint hover:shadow-elevated transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-out-quint)] hover:-translate-y-px"
    >
      <span className="flex items-center justify-between">
        <span className="w-10 h-10 rounded-xl bg-surface-tertiary text-content-secondary flex items-center justify-center group-hover:bg-accent group-hover:text-accent-text transition-colors">
          <Icon className="w-4 h-4" />
        </span>
        <span className="flex items-center gap-1.5">
          <HelpSizeChip size={guide.size} />
        </span>
      </span>
      <span className="flex flex-col gap-1 flex-1">
        <span className="text-body font-semibold text-content leading-snug">{t(guideKey(guide.id, 'title'))}</span>
        <span className="text-caption text-content-muted leading-relaxed">{t(guideKey(guide.id, 'goal'))}</span>
      </span>
      <span className="flex items-center justify-between pt-3 border-t border-edge-secondary">
        <HelpBadge tone="neutral" count={guide.steps}>{t('help.center.stepsLabel')}</HelpBadge>
        <ArrowRight className="w-4 h-4 text-content-faint transition-transform group-hover:translate-x-0.5 group-hover:text-content" />
      </span>
    </button>
  )
}
