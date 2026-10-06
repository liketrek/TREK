import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Link2,
  ListOrdered,
  Maximize2,
} from 'lucide-react';
import React from 'react';
import { Link } from 'react-router';
import {
  ctxKey,
  docsRoute,
  getHelpContext,
  getHelpGuide,
  guideKey,
  guideStepKey,
  guideTipKey,
  helpContextTrail,
  helpMedia,
} from '../../help/registry';
import type { HelpGuide } from '../../help/types';
import { useTranslation } from '../../i18n';
import { docTitle, useHelpStore } from '../../store/helpStore';
import HelpBadge from './HelpBadge';
import HelpDocLink from './HelpDocLink';
import { helpIcon } from './helpIcons';
import HelpSizeChip from './HelpSizeChip';
import { useScreenRoute } from './useScreenRoute';

/**
 * One guide, top to bottom: a header card that says where you are and how big
 * the task is, the steps as a numbered rail with a picture each, what the
 * reader ends up with, the things worth knowing, and where to go next.
 */
export default function HelpGuideView({ guide }: { guide: HelpGuide }): React.ReactElement {
  const { t } = useTranslation();
  const openLightbox = useHelpStore((s) => s.openLightbox);
  const closeHelp = useHelpStore((s) => s.closeHelp);
  const docIndex = useHelpStore((s) => s.docIndex);
  const openGuide = useHelpStore((s) => s.openGuide);
  const title = t(guideKey(guide.id, 'title'));
  const screen = getHelpContext(guide.context);
  const steps = Array.from({ length: guide.steps }, (_, i) => i + 1);
  const tips = Array.from({ length: guide.tips }, (_, i) => t(guideTipKey(guide.id, i + 1)));
  const related = (guide.related ?? []).map(getHelpGuide).filter((g): g is HelpGuide => g !== null);
  const Icon = helpIcon(guide.icon);
  const ScreenIcon = screen ? helpIcon(screen.icon) : Icon;
  const screenRoute = useScreenRoute(screen?.route);

  return (
    <div className="trek-help-view flex flex-col gap-6">
      {/* Where you are, what this is, how big it is */}
      <header className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {screen &&
            helpContextTrail(screen).map((c, i, all) => (
              <React.Fragment key={c.id}>
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-content-faint" />}
                <HelpBadge tone="outline" icon={i === all.length - 1 ? ScreenIcon : undefined}>
                  {t(ctxKey(c.id, 'title'))}
                </HelpBadge>
              </React.Fragment>
            ))}
          <ChevronRight className="h-3.5 w-3.5 text-content-faint" />
          <HelpBadge tone="outline">{t('help.center.howTo')}</HelpBadge>
        </div>
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-text shadow-card">
            <Icon className="h-6 w-6" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h1 className="text-title font-bold leading-tight text-content">{title}</h1>
            <p className="text-body leading-relaxed text-content-secondary">{t(guideKey(guide.id, 'goal'))}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-edge-secondary pt-4">
          <HelpSizeChip size={guide.size} />
          <HelpBadge tone="neutral" icon={ListOrdered} count={guide.steps}>
            {t('help.center.stepsLabel')}
          </HelpBadge>
          {guide.media.steps && (
            <HelpBadge tone="neutral" icon={Camera} count={guide.steps}>
              {t('help.center.screenshot')}
            </HelpBadge>
          )}
          {/* One way out of the header: into the screen. The docs link waits at the bottom. */}
          {screen && screenRoute && (
            <Link to={screenRoute} onClick={closeHelp} className="ml-auto">
              <HelpBadge tone="accent" icon={ArrowUpRight} className="transition-colors hover:bg-accent-hover">
                {t('help.center.goToScreen', { screen: t(ctxKey(screen.id, 'title')) })}
              </HelpBadge>
            </Link>
          )}
        </div>
      </header>

      {/* Steps, on a rail */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <HelpBadge tone="accent" icon={ListOrdered} uppercase count={guide.steps}>
            {t('help.center.stepsLabel')}
          </HelpBadge>
        </div>
        <ol className="relative flex flex-col gap-3">
          {/* The rail: runs behind the step numbers from the first to the last. */}
          <span className="absolute bottom-6 left-[27px] top-6 w-px bg-edge" aria-hidden="true" />
          {steps.map((n) => {
            const text = t(guideStepKey(guide.id, n));
            const src = helpMedia.step(guide.id, n);
            const alt = t('help.center.imageAlt', { n, title });
            return (
              <li
                key={n}
                className={`trek-help-step relative grid grid-cols-1 gap-4 rounded-2xl border border-edge bg-surface-card p-3 ${
                  guide.media.steps ? 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-label={t('help.center.step', { n })}
                    className="trek-help-step-no relative z-[1] flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-edge bg-surface-card text-caption font-bold text-content"
                  >
                    {n}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <HelpBadge tone="outline" uppercase className="self-start">
                      {t('help.center.stepOf', { n, total: guide.steps })}
                    </HelpBadge>
                    <p className="rounded-xl bg-surface-tertiary px-3.5 py-3 text-body leading-relaxed text-content">
                      {text}
                    </p>
                  </div>
                </div>
                {guide.media.steps && (
                  <figure className="relative">
                    <button
                      type="button"
                      onClick={() => openLightbox({ src, alt })}
                      className="trek-help-shot group relative block w-full overflow-hidden rounded-xl border border-edge-secondary bg-surface-tertiary"
                      aria-label={alt}
                    >
                      {/* No number over the picture: the step it belongs to is
                          numbered beside it, and the picture carries the ring's
                          own badge. Contained, not covered: a step whose target
                          did not fit the 16:10 window was shot wider than this
                          box, and covering it would crop away the sides the
                          ring is drawn on. */}
                      <img
                        src={src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="block aspect-[16/10] w-full object-contain"
                      />
                      <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-inverse text-inverse-text opacity-0 shadow-elevated transition-opacity group-hover:opacity-100">
                        <Maximize2 className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </figure>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Result */}
      <section
        className={`grid grid-cols-1 items-start gap-4 rounded-2xl border border-edge bg-surface-card p-4 ${
          guide.media.result ? 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]' : ''
        }`}
      >
        <div className="flex flex-col gap-2.5">
          <HelpBadge tone="success" icon={CheckCircle2} uppercase className="self-start">
            {t('help.center.result')}
          </HelpBadge>
          <p className="rounded-xl bg-surface-tertiary px-3.5 py-3 text-body leading-relaxed text-content">
            {t(guideKey(guide.id, 'result'))}
          </p>
        </div>
        {guide.media.result && (
          <button
            type="button"
            onClick={() => openLightbox({ src: helpMedia.result(guide.id), alt: t(guideKey(guide.id, 'result')) })}
            className="trek-help-shot group relative overflow-hidden rounded-xl border border-edge-secondary bg-surface-tertiary"
          >
            <img
              src={helpMedia.result(guide.id)}
              alt=""
              loading="lazy"
              decoding="async"
              className="block aspect-video w-full object-contain"
            />
            <span className="absolute bottom-2 left-2">
              <HelpBadge tone="success" icon={CheckCircle2}>
                {t('help.center.result')}
              </HelpBadge>
            </span>
            <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-inverse text-inverse-text opacity-0 shadow-elevated transition-opacity group-hover:opacity-100">
              <Maximize2 className="h-3.5 w-3.5" />
            </span>
          </button>
        )}
      </section>

      {/* Tips */}
      {tips.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface-card p-4">
          <HelpBadge tone="warning" icon={Lightbulb} uppercase count={tips.length} className="self-start">
            {t('help.center.tips')}
          </HelpBadge>
          <ul className="flex flex-col gap-2">
            {tips.map((tip, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl bg-surface-tertiary px-3.5 py-3 text-body leading-relaxed text-content-secondary"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-warning-soft text-caption font-bold text-warning">
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
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(guide.link || guide.docs) && (
            <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface-card p-4">
              <HelpBadge tone="neutral" icon={Link2} uppercase className="self-start">
                {t('help.center.docsSection')}
              </HelpBadge>
              {guide.link && (
                <Link
                  to={guide.link}
                  onClick={closeHelp}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-body font-semibold text-accent-text transition-colors hover:bg-accent-hover"
                >
                  {t(guideKey(guide.id, 'link'))}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              )}
              {guide.docs && (
                <HelpDocLink
                  to={docsRoute(guide.docs)}
                  title={t('help.center.openDocs')}
                  subtitle={docTitle(docIndex, guide.docs.slug)}
                />
              )}
            </div>
          )}
          {related.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface-card p-4">
              <HelpBadge tone="neutral" icon={ChevronRight} uppercase count={related.length} className="self-start">
                {t('help.center.related')}
              </HelpBadge>
              <ul className="flex flex-col gap-1">
                {related.map((g) => {
                  const RelIcon = helpIcon(g.icon);
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => openGuide(g.id)}
                        className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-hover"
                      >
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-surface-tertiary text-content-muted transition-colors group-hover:bg-accent group-hover:text-accent-text">
                          <RelIcon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-body text-content-secondary transition-colors group-hover:text-content">
                          {t(guideKey(g.id, 'title'))}
                        </span>
                        {/* A guide on another screen says which, so the jump is no surprise. */}
                        {g.context === guide.context ? (
                          <HelpBadge tone="neutral" count={g.steps}>
                            {t('help.center.stepsLabel')}
                          </HelpBadge>
                        ) : (
                          <HelpBadge tone="outline" icon={ArrowUpRight}>
                            {t(ctxKey(g.context, 'title'))}
                          </HelpBadge>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
