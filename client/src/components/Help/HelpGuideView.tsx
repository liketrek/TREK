import React from 'react'
import { Link } from 'react-router'
import { CheckCircle2, Lightbulb, ArrowUpRight, ChevronRight, Maximize2, ListOrdered, Camera, Link2 } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useHelpStore, docTitle } from '../../store/helpStore'
import { guideKey, guideStepKey, guideTipKey, helpMedia, docsRoute, getHelpGuide, getHelpContext, ctxKey, helpContextTrail } from '../../help/registry'
import type { HelpGuide } from '../../help/types'
import { helpIcon } from './helpIcons'
import HelpBadge from './HelpBadge'
import HelpDocLink from './HelpDocLink'
import HelpSizeChip from './HelpSizeChip'
import { useScreenRoute } from './useScreenRoute'

/**
 * One guide, top to bottom: a header card that says where you are and how big
 * the task is, the steps as a numbered rail with a picture each, what the
 * reader ends up with, the things worth knowing, and where to go next.
 */
export default function HelpGuideView({ guide }: { guide: HelpGuide }): React.ReactElement {
  const { t } = useTranslation()
  const openLightbox = useHelpStore(s => s.openLightbox)
  const closeHelp = useHelpStore(s => s.closeHelp)
  const docIndex = useHelpStore(s => s.docIndex)
  const openGuide = useHelpStore(s => s.openGuide)
  const title = t(guideKey(guide.id, 'title'))
  const screen = getHelpContext(guide.context)
  const steps = Array.from({ length: guide.steps }, (_, i) => i + 1)
  const tips = Array.from({ length: guide.tips }, (_, i) => t(guideTipKey(guide.id, i + 1)))
  const related = (guide.related ?? []).map(getHelpGuide).filter((g): g is HelpGuide => g !== null)
  const Icon = helpIcon(guide.icon)
  const ScreenIcon = screen ? helpIcon(screen.icon) : Icon
  const screenRoute = useScreenRoute(screen?.route)

  return (
    <div className="trek-help-view flex flex-col gap-6">
      {/* Where you are, what this is, how big it is */}
      <header className="rounded-2xl border border-edge bg-surface-card p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {screen && helpContextTrail(screen).map((c, i, all) => (
            <React.Fragment key={c.id}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-content-faint" />}
              <HelpBadge tone="outline" icon={i === all.length - 1 ? ScreenIcon : undefined}>{t(ctxKey(c.id, 'title'))}</HelpBadge>
            </React.Fragment>
          ))}
          <ChevronRight className="w-3.5 h-3.5 text-content-faint" />
          <HelpBadge tone="outline">{t('help.center.howTo')}</HelpBadge>
        </div>
        <div className="flex items-start gap-4">
          <span className="w-14 h-14 rounded-2xl bg-accent text-accent-text flex items-center justify-center flex-shrink-0 shadow-card">
            <Icon className="w-6 h-6" />
          </span>
          <div className="min-w-0 flex-1 flex flex-col gap-1.5">
            <h1 className="text-title font-bold text-content leading-tight">{title}</h1>
            <p className="text-body text-content-secondary leading-relaxed">{t(guideKey(guide.id, 'goal'))}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-edge-secondary">
          <HelpSizeChip size={guide.size} />
          <HelpBadge tone="neutral" icon={ListOrdered} count={guide.steps}>{t('help.center.stepsLabel')}</HelpBadge>
          {guide.media.steps && <HelpBadge tone="neutral" icon={Camera} count={guide.steps}>{t('help.center.screenshot')}</HelpBadge>}
          {/* One way out of the header: into the screen. The docs link waits at the bottom. */}
          {screen && screenRoute && (
            <Link to={screenRoute} onClick={closeHelp} className="ml-auto">
              <HelpBadge tone="accent" icon={ArrowUpRight} className="hover:bg-accent-hover transition-colors">
                {t('help.center.goToScreen', { screen: t(ctxKey(screen.id, 'title')) })}
              </HelpBadge>
            </Link>
          )}
        </div>
      </header>

      {/* Steps, on a rail */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <HelpBadge tone="accent" icon={ListOrdered} uppercase count={guide.steps}>{t('help.center.stepsLabel')}</HelpBadge>
        </div>
        <ol className="relative flex flex-col gap-3">
          {/* The rail: runs behind the step numbers from the first to the last. */}
          <span className="absolute left-[27px] top-6 bottom-6 w-px bg-edge" aria-hidden="true" />
          {steps.map(n => {
            const text = t(guideStepKey(guide.id, n))
            const src = helpMedia.step(guide.id, n)
            const alt = t('help.center.imageAlt', { n, title })
            return (
              <li
                key={n}
                className={`trek-help-step relative grid grid-cols-1 gap-4 rounded-2xl border border-edge bg-surface-card p-3 ${
                  guide.media.steps ? 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : ''
                }`}
              >
                <div className="flex gap-3 items-start">
                  <span
                    aria-label={t('help.center.step', { n })}
                    className="trek-help-step-no relative z-[1] w-8 h-8 rounded-full bg-surface-card text-content text-caption font-bold flex items-center justify-center flex-shrink-0 border border-edge"
                  >
                    {n}
                  </span>
                  <div className="min-w-0 flex-1 flex flex-col gap-2">
                    <HelpBadge tone="outline" uppercase className="self-start">
                      {t('help.center.stepOf', { n, total: guide.steps })}
                    </HelpBadge>
                    <p className="rounded-xl bg-surface-tertiary px-3.5 py-3 text-body text-content leading-relaxed">{text}</p>
                  </div>
                </div>
                {guide.media.steps && (
                  <figure className="relative">
                    <button
                      type="button"
                      onClick={() => openLightbox({ src, alt })}
                      className="trek-help-shot group relative block w-full rounded-xl overflow-hidden border border-edge-secondary bg-surface-tertiary"
                      aria-label={alt}
                    >
                      {/* No number over the picture: the step it belongs to is
                          numbered beside it, and the picture carries the ring's
                          own badge. Contained, not covered: a step whose target
                          did not fit the 16:10 window was shot wider than this
                          box, and covering it would crop away the sides the
                          ring is drawn on. */}
                      <img src={src} alt="" loading="lazy" decoding="async" className="block w-full aspect-[16/10] object-contain" />
                      <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-inverse text-inverse-text flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-elevated">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </figure>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      {/* Result */}
      <section
        className={`rounded-2xl border border-edge bg-surface-card p-4 grid grid-cols-1 gap-4 items-start ${
          guide.media.result ? 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : ''
        }`}
      >
        <div className="flex flex-col gap-2.5">
          <HelpBadge tone="success" icon={CheckCircle2} uppercase className="self-start">{t('help.center.result')}</HelpBadge>
          <p className="rounded-xl bg-surface-tertiary px-3.5 py-3 text-body text-content leading-relaxed">{t(guideKey(guide.id, 'result'))}</p>
        </div>
        {guide.media.result && (
          <button
            type="button"
            onClick={() => openLightbox({ src: helpMedia.result(guide.id), alt: t(guideKey(guide.id, 'result')) })}
            className="trek-help-shot group relative rounded-xl overflow-hidden border border-edge-secondary bg-surface-tertiary"
          >
            <img src={helpMedia.result(guide.id)} alt="" loading="lazy" decoding="async" className="block w-full aspect-video object-contain" />
            <span className="absolute bottom-2 left-2">
              <HelpBadge tone="success" icon={CheckCircle2}>{t('help.center.result')}</HelpBadge>
            </span>
            <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-inverse text-inverse-text flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-elevated">
              <Maximize2 className="w-3.5 h-3.5" />
            </span>
          </button>
        )}
      </section>

      {/* Tips */}
      {tips.length > 0 && (
        <section className="rounded-2xl border border-edge bg-surface-card p-4 flex flex-col gap-3">
          <HelpBadge tone="warning" icon={Lightbulb} uppercase count={tips.length} className="self-start">{t('help.center.tips')}</HelpBadge>
          <ul className="flex flex-col gap-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-surface-tertiary px-3.5 py-3 text-body text-content-secondary leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-warning-soft text-warning text-caption font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Go there / docs / related */}
      {(guide.link || guide.docs || related.length > 0) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(guide.link || guide.docs) && (
            <div className="rounded-2xl border border-edge bg-surface-card p-4 flex flex-col gap-3">
              <HelpBadge tone="neutral" icon={Link2} uppercase className="self-start">{t('help.center.docsSection')}</HelpBadge>
              {guide.link && (
                <Link
                  to={guide.link}
                  onClick={closeHelp}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-text text-body font-semibold px-4 py-2.5 hover:bg-accent-hover transition-colors"
                >
                  {t(guideKey(guide.id, 'link'))}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              )}
              {guide.docs && (
                <HelpDocLink to={docsRoute(guide.docs)} title={t('help.center.openDocs')} subtitle={docTitle(docIndex, guide.docs.slug)} />
              )}
            </div>
          )}
          {related.length > 0 && (
            <div className="rounded-2xl border border-edge bg-surface-card p-4 flex flex-col gap-3">
              <HelpBadge tone="neutral" icon={ChevronRight} uppercase count={related.length} className="self-start">{t('help.center.related')}</HelpBadge>
              <ul className="flex flex-col gap-1">
                {related.map(g => {
                  const RelIcon = helpIcon(g.icon)
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => openGuide(g.id)}
                        className="group w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-surface-hover transition-colors"
                      >
                        <span className="w-7 h-7 rounded-md bg-surface-tertiary text-content-muted flex items-center justify-center flex-shrink-0 group-hover:bg-accent group-hover:text-accent-text transition-colors">
                          <RelIcon className="w-3.5 h-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 text-body text-content-secondary group-hover:text-content truncate transition-colors">
                          {t(guideKey(g.id, 'title'))}
                        </span>
                        {/* A guide on another screen says which, so the jump is no surprise. */}
                        {g.context === guide.context ? (
                          <HelpBadge tone="neutral" count={g.steps}>{t('help.center.stepsLabel')}</HelpBadge>
                        ) : (
                          <HelpBadge tone="outline" icon={ArrowUpRight}>{t(ctxKey(g.context, 'title'))}</HelpBadge>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
