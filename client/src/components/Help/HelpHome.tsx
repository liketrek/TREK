import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronRight,
  Compass,
  LayoutGrid,
  LayoutList,
  ListOrdered,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  childHelpContexts,
  ctxBulletKey,
  ctxKey,
  docsRoute,
  guideKey,
  guidesFor,
  helpContextTrail,
  helpMedia,
} from '../../help/registry';
import type { HelpContext, HelpGuide } from '../../help/types';
import { useTranslation } from '../../i18n';
import { docTitle, useHelpStore } from '../../store/helpStore';
import HelpBadge from './HelpBadge';
import HelpDocLink from './HelpDocLink';
import { helpIcon } from './helpIcons';
import HelpSizeChip from './HelpSizeChip';
import { useScreenRoute } from './useScreenRoute';

/**
 * The overview of a screen: what it is, what is on it, and a card per guide.
 * With no registered context (a screen that has no help yet) it says so and
 * leaves the search box as the way forward.
 */
export default function HelpHome({ context }: { context: HelpContext | null }): React.ReactElement {
  const { t } = useTranslation();
  const docIndex = useHelpStore((s) => s.docIndex);
  const closeHelp = useHelpStore((s) => s.closeHelp);
  // Folded until asked for: the guides below matter more, the tabs are one click away.
  const [subScreensOpen, setSubScreensOpen] = useState(false);
  const screenRoute = useScreenRoute(context?.route);

  if (!context) {
    return (
      <div className="trek-help-view flex flex-col items-center gap-2 py-24 text-center">
        <BookOpen className="h-8 w-8 text-content-faint" />
        <p className="text-subtitle font-semibold text-content">{t('help.center.noContext')}</p>
        <p className="max-w-[320px] text-body text-content-muted">{t('help.center.noContextHint')}</p>
      </div>
    );
  }

  const guides = guidesFor(context);
  const bullets = Array.from({ length: context.bullets }, (_, i) => t(ctxBulletKey(context.id, i + 1)));
  const children = childHelpContexts(context.id);
  const Icon = helpIcon(context.icon);

  return (
    <div className="trek-help-view flex flex-col gap-6">
      {/* Which screen, what it is, what help there is */}
      <header className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <HelpBadge tone="outline" icon={Compass}>
            {t('help.center.screens')}
          </HelpBadge>
          {helpContextTrail(context)
            .slice(0, -1)
            .map((parent) => (
              <React.Fragment key={parent.id}>
                <ChevronRight className="h-3.5 w-3.5 text-content-faint" />
                <HelpBadge tone="outline">{t(ctxKey(parent.id, 'title'))}</HelpBadge>
              </React.Fragment>
            ))}
          <ChevronRight className="h-3.5 w-3.5 text-content-faint" />
          <HelpBadge tone="outline">{t('help.center.overview')}</HelpBadge>
        </div>
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-text shadow-card">
            <Icon className="h-6 w-6" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h1 className="text-title font-bold leading-tight text-content">{t(ctxKey(context.id, 'title'))}</h1>
            <p className="text-body leading-relaxed text-content-secondary">{t(ctxKey(context.id, 'summary'))}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-edge-secondary pt-4">
          <HelpBadge tone="accent" icon={ListOrdered} count={guides.length}>
            {t('help.center.searchGuides')}
          </HelpBadge>
          {context.docs.length > 0 && (
            <HelpBadge tone="neutral" icon={BookOpen} count={context.docs.length}>
              {t('help.center.searchDocs')}
            </HelpBadge>
          )}
          {screenRoute && (
            <Link to={screenRoute} onClick={closeHelp} className="ml-auto">
              <HelpBadge tone="accent" icon={ArrowUpRight} className="transition-colors hover:bg-accent-hover">
                {t('help.center.goToScreen', { screen: t(ctxKey(context.id, 'title')) })}
              </HelpBadge>
            </Link>
          )}
        </div>
      </header>

      {/* Screens under this one (the tabs of Settings, the journal of Journey) */}
      {children.length > 0 && (
        <section className="flex flex-col rounded-2xl border border-edge bg-surface-card">
          <button
            type="button"
            onClick={() => setSubScreensOpen((o) => !o)}
            aria-expanded={subScreensOpen}
            className="flex items-center gap-3 rounded-2xl p-4 text-left transition-colors hover:bg-surface-hover"
          >
            <HelpBadge tone="neutral" icon={LayoutGrid} uppercase count={children.length}>
              {t('help.center.subScreensLabel')}
            </HelpBadge>
            <span className="min-w-0 flex-1 truncate text-caption text-content-muted">
              {children.map((child) => t(ctxKey(child.id, 'title'))).join(' · ')}
            </span>
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 text-content-faint transition-transform ${subScreensOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {subScreensOpen && (
            <ul className="grid grid-cols-2 gap-2 px-4 pb-4 md:grid-cols-3 xl:grid-cols-4">
              {children.map((child) => (
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
        <figure className="relative overflow-hidden rounded-2xl border border-edge-secondary bg-surface-tertiary shadow-card">
          <img
            src={helpMedia.hero(context.id)}
            alt=""
            loading="lazy"
            decoding="async"
            className="block aspect-video w-full object-contain"
          />
          <span className="absolute bottom-3 left-3">
            <HelpBadge tone="accent" icon={Camera}>
              {t(ctxKey(context.id, 'title'))}
            </HelpBadge>
          </span>
        </figure>
      )}

      {/* What is on it */}
      {bullets.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-edge bg-surface-card p-4">
          <HelpBadge tone="neutral" icon={LayoutList} uppercase count={bullets.length} className="self-start">
            {t('help.center.onThisScreen')}
          </HelpBadge>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {bullets.map((text, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl bg-surface-tertiary px-3.5 py-3 text-body leading-relaxed text-content-secondary"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-caption font-bold text-accent-text">
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
          <HelpBadge tone="accent" icon={ListOrdered} uppercase count={guides.length} className="self-start">
            {t('help.center.howTo')}
          </HelpBadge>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {guides.map((g) => (
              <li key={g.id}>
                <GuideCard guide={g} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Docs */}
      {context.docs.length > 0 && (
        <section className="flex flex-col gap-2 rounded-2xl border border-edge bg-surface-card p-4">
          <HelpBadge tone="neutral" icon={BookOpen} uppercase count={context.docs.length} className="self-start">
            {t('help.center.docsSection')}
          </HelpBadge>
          <ul className="flex flex-col">
            {context.docs.map((link) => (
              <li key={`${link.slug}#${link.anchor ?? ''}`}>
                <HelpDocLink to={docsRoute(link)} title={docTitle(docIndex, link.slug)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** One sub-screen: opens its overview in place; the one the reader is on says so. */
function SubScreenCard({ screen }: { screen: HelpContext }): React.ReactElement {
  const { t } = useTranslation();
  const browse = useHelpStore((s) => s.browse);
  const contextId = useHelpStore((s) => s.contextId);
  const current = screen.id === contextId;
  const Icon = helpIcon(screen.icon);
  return (
    <button
      type="button"
      onClick={() => browse(current ? null : screen.id)}
      className="group flex h-full w-full items-center gap-3 rounded-xl border border-edge bg-surface-secondary px-3 py-2.5 text-left transition-colors hover:border-content-faint hover:bg-surface-card"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-card text-content-secondary transition-colors group-hover:bg-accent group-hover:text-accent-text">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body font-semibold text-content">{t(ctxKey(screen.id, 'title'))}</span>
        <span className="text-caption text-content-muted">
          {t('help.center.guidesCount', { count: screen.guides.length })}
        </span>
      </span>
      {current ? (
        <ThisScreenChip />
      ) : (
        <ArrowRight className="h-4 w-4 text-content-faint transition-transform group-hover:translate-x-0.5 group-hover:text-content" />
      )}
    </button>
  );
}

/** The marker for the screen the reader is actually on. */
export function ThisScreenChip(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <span className="inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-full bg-accent px-2 py-1 text-caption font-semibold leading-none text-accent-text">
      {t('help.center.thisScreen')}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return <h3 className="text-caption font-semibold uppercase tracking-[0.1em] text-content-faint">{children}</h3>;
}

export function GuideCard({ guide }: { guide: HelpGuide }): React.ReactElement {
  const { t } = useTranslation();
  const openGuide = useHelpStore((s) => s.openGuide);
  const Icon = helpIcon(guide.icon);
  return (
    <button
      type="button"
      onClick={() => openGuide(guide.id)}
      className="group flex h-full w-full flex-col gap-3 rounded-2xl border border-edge bg-surface-card p-4 text-left transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-out-quint)] hover:-translate-y-px hover:border-content-faint hover:shadow-elevated"
    >
      <span className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-tertiary text-content-secondary transition-colors group-hover:bg-accent group-hover:text-accent-text">
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex items-center gap-1.5">
          <HelpSizeChip size={guide.size} />
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="text-body font-semibold leading-snug text-content">{t(guideKey(guide.id, 'title'))}</span>
        <span className="text-caption leading-relaxed text-content-muted">{t(guideKey(guide.id, 'goal'))}</span>
      </span>
      <span className="flex items-center justify-between border-t border-edge-secondary pt-3">
        <HelpBadge tone="neutral" count={guide.steps}>
          {t('help.center.stepsLabel')}
        </HelpBadge>
        <ArrowRight className="h-4 w-4 text-content-faint transition-transform group-hover:translate-x-0.5 group-hover:text-content" />
      </span>
    </button>
  );
}
