import React, { useEffect, useRef, useState } from 'react'
import { Search, LifeBuoy, ArrowUpRight, ChevronsUpDown, ChevronDown, ChevronRight, Check, MapPin, CornerDownRight } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useHelpStore, docTitle } from '../../store/helpStore'
import { ctxKey, guideKey, guidesFor, docsRoute, topLevelHelpContexts, childHelpContexts, helpContextTrail } from '../../help/registry'
import type { HelpContext, HelpGuide } from '../../help/types'
import { helpIcon } from './helpIcons'
import HelpDocLink from './HelpDocLink'
import { ThisScreenChip } from './HelpHome'

const GITHUB_DISCUSSIONS = 'https://github.com/liketrek/TREK/discussions/new?category=ideas'
const DISCORD = 'https://discord.gg/NhZBDSd4qW'

/**
 * Left pane of the help dialog: search, the current screen with its guides,
 * the docs that go with it, and the ways to reach a human.
 */
export default function HelpNav({ context, currentId, activeGuideId }: {
  /** The screen whose help is shown. */
  context: HelpContext | null
  /** The screen the reader is actually on, for the "this screen" marker. */
  currentId: string | null
  activeGuideId: string | null
}): React.ReactElement {
  const { t } = useTranslation()
  const query = useHelpStore(s => s.query)
  const setQuery = useHelpStore(s => s.setQuery)
  const closeGuide = useHelpStore(s => s.closeGuide)
  const docIndex = useHelpStore(s => s.docIndex)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    searchRef.current?.focus({ preventScroll: true })
  }, [])

  const guides = context ? guidesFor(context) : []
  const overviewActive = !activeGuideId && !query.trim()
  // The tabs of the screen on show, or of its parent when the reader is on one of them.
  const family = context ? childHelpContexts(context.parent ?? context.id) : []
  // Folded by default: the guides matter more, the tabs are one click away.
  const [familyOpen, setFamilyOpen] = useState(false)

  return (
    <nav className="flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-edge bg-surface-secondary" aria-label={t('help.center.title')}>
      <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent text-accent-text">
          <LifeBuoy className="w-4 h-4" />
        </span>
        <span className="text-subtitle font-bold text-content leading-none">{t('help.center.title')}</span>
      </div>

      <div className="px-5 pb-4">
        <label className="relative block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-content-faint pointer-events-none" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('help.center.searchPlaceholder')}
            aria-label={t('help.center.searchPlaceholder')}
            className="w-full rounded-xl bg-surface-card text-content text-body pl-9 pr-3 py-2.5 outline-none border border-edge focus:border-content-faint transition-colors placeholder:text-content-faint"
          />
        </label>
      </div>

      <div className="trek-help-scroll flex-1 min-h-0 overflow-y-auto px-3 pb-3 flex flex-col gap-5">
        <section className="flex flex-col gap-1">
          <NavLabel>{t('help.center.screens')}</NavLabel>
          <ScreenSwitcher shown={context} currentId={currentId} />
        </section>
        {context ? (
          <>
            {family.length > 0 && (
              <section className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setFamilyOpen(o => !o)}
                  aria-expanded={familyOpen}
                  className="flex items-center gap-1.5 px-2 pb-1 text-left text-caption font-semibold uppercase tracking-[0.1em] text-content-faint hover:text-content transition-colors"
                >
                  <span className="flex-1">{t('help.center.subScreensLabel')}</span>
                  <span className="text-caption font-bold tabular-nums normal-case tracking-normal">{family.length}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${familyOpen ? 'rotate-180' : ''}`} />
                </button>
                {familyOpen && (
                  <ul className="flex flex-col gap-0.5">
                    {family.map(screen => (
                      <li key={screen.id}>
                        <NavScreen screen={screen} shown={screen.id === context.id} current={screen.id === currentId} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section className="flex flex-col gap-1">
              <NavLabel>{t('help.center.overview')}</NavLabel>
              <button
                type="button"
                onClick={() => { closeGuide(); setQuery('') }}
                aria-current={overviewActive ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                  overviewActive ? 'bg-surface-selected text-content' : 'text-content-secondary hover:bg-surface-hover hover:text-content'
                }`}
              >
                <span className="text-body font-semibold truncate">{t(ctxKey(context.id, 'title'))}</span>
              </button>
            </section>

            {guides.length > 0 && (
              <section className="flex flex-col gap-1">
                <NavLabel>{t('help.center.howTo')}</NavLabel>
                <ul className="flex flex-col gap-0.5">
                  {guides.map(g => (
                    <li key={g.id}>
                      <NavGuide guide={g} active={g.id === activeGuideId} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {context.docs.length > 0 && (
              <section className="flex flex-col gap-1 px-2">
                <NavLabel>{t('help.center.docsSection')}</NavLabel>
                <ul className="flex flex-col">
                  {context.docs.map(link => (
                    <li key={`${link.slug}#${link.anchor ?? ''}`}>
                      <HelpDocLink to={docsRoute(link)} title={docTitle(docIndex, link.slug)} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <p className="px-2 text-body text-content-muted">{t('help.center.noContext')}</p>
        )}
      </div>

      <footer className="px-4 py-4 border-t border-edge flex flex-col gap-2">
        <span className="px-1 text-caption font-semibold uppercase tracking-[0.1em] text-content-faint">{t('help.center.feedback')}</span>
        <a
          href={GITHUB_DISCUSSIONS}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl bg-accent text-accent-text px-3.5 py-2.5 hover:bg-accent-hover transition-colors"
        >
          <GitHubMark className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-body font-semibold">{t('help.center.feedbackLink')}</span>
          <ArrowUpRight className="w-4 h-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
        {/* Discord blurple is a brand colour, deliberately not a theme token. */}
        <a
          href={DISCORD}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl bg-[#5865F2] text-white px-3.5 py-2.5 hover:bg-[#4752C4] transition-colors" // theme-lint-disable
        >
          <DiscordMark className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-body font-semibold">{t('help.center.discord')}</span>
          <ArrowUpRight className="w-4 h-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </footer>
    </nav>
  )
}

/**
 * Pick which screen's help to read without leaving the one you are on. The
 * current screen is marked; choosing it again returns the dialog to following
 * the screen the reader is on.
 */
/**
 * Which screen the panel shows, and the list to pick another. Screens with
 * sub-screens (Journey and its journal, Settings and its tabs) fold: one group
 * is open at a time, and the group of the screen on show starts open.
 */
function ScreenSwitcher({ shown, currentId }: { shown: HelpContext | null; currentId: string | null }): React.ReactElement {
  const { t } = useTranslation()
  const browse = useHelpStore(s => s.browse)
  const [open, setOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const screens = topLevelHelpContexts()
  const ShownIcon = shown ? helpIcon(shown.icon) : MapPin
  const trail = shown ? helpContextTrail(shown) : []

  // Click outside or Escape closes the list; Escape must not bubble into the dialog's own close.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const choose = (id: string) => {
    browse(id === currentId ? null : id)
    setOpen(false)
  }
  const toggleList = () => {
    setOpen(o => {
      if (!o) setOpenGroup(trail.length > 1 ? trail[0].id : null)
      return !o
    })
  }

  return (
    <div ref={rootRef} className="relative px-2">
      <button
        type="button"
        onClick={toggleList}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 rounded-xl border border-edge bg-surface-card px-3 py-2.5 text-left hover:border-content-faint transition-colors"
      >
        <span className="w-7 h-7 rounded-md bg-accent text-accent-text flex items-center justify-center flex-shrink-0">
          <ShownIcon className="w-3.5 h-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-semibold text-content truncate">
            {shown ? trail.map(c => t(ctxKey(c.id, 'title'))).join(' › ') : t('help.center.noContext')}
          </span>
        </span>
        {shown && shown.id === currentId && <ThisScreenChip />}
        <ChevronsUpDown className="w-4 h-4 text-content-faint flex-shrink-0" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t('help.center.screens')}
          className="trek-help-menu absolute left-2 right-2 top-full mt-1.5 z-10 flex flex-col gap-0.5 rounded-xl border border-edge bg-surface-card p-1.5 shadow-elevated"
        >
          {screens.map(screen => {
            const children = childHelpContexts(screen.id)
            const expanded = openGroup === screen.id
            return (
              <li key={screen.id} className="flex flex-col gap-0.5">
                <ScreenRow
                  screen={screen}
                  selected={screen.id === shown?.id}
                  current={screen.id === currentId}
                  onPick={() => choose(screen.id)}
                  group={children.length > 0 ? { expanded, count: children.length, toggle: () => setOpenGroup(expanded ? null : screen.id) } : undefined}
                />
                {children.length > 0 && expanded && (
                  <ul role="group" className="flex flex-col gap-0.5 pl-3">
                    {children.map(child => (
                      <li key={child.id}>
                        <ScreenRow
                          screen={child}
                          selected={child.id === shown?.id}
                          current={child.id === currentId}
                          onPick={() => choose(child.id)}
                          nested
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** One screen in the switcher list; a group row carries the fold toggle on its right. */
function ScreenRow({
  screen, selected, current, onPick, group, nested = false,
}: {
  screen: HelpContext
  selected: boolean
  current: boolean
  onPick: () => void
  group?: { expanded: boolean; count: number; toggle: () => void }
  nested?: boolean
}): React.ReactElement {
  const { t } = useTranslation()
  const Icon = helpIcon(screen.icon)
  const Fold = group?.expanded ? ChevronDown : ChevronRight
  return (
    <div
      role="option"
      aria-selected={selected}
      className={`flex items-center rounded-lg transition-colors ${
        selected ? 'bg-surface-selected text-content' : 'text-content-secondary hover:bg-surface-hover hover:text-content'
      }`}
    >
      <button type="button" onClick={onPick} className="min-w-0 flex-1 flex items-center gap-2.5 px-2 py-2 text-left">
        {nested ? (
          <CornerDownRight className="w-3.5 h-3.5 flex-shrink-0 text-content-faint" />
        ) : (
          <Icon className="w-4 h-4 flex-shrink-0 text-content-muted" />
        )}
        <span className="min-w-0 flex-1 text-body truncate">{t(ctxKey(screen.id, 'title'))}</span>
        {current && <ThisScreenChip />}
        {selected && <Check className="w-4 h-4 flex-shrink-0" />}
      </button>
      {group && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); group.toggle() }}
          aria-expanded={group.expanded}
          aria-label={t('help.center.subScreens', { count: group.count })}
          className="flex items-center gap-1 rounded-md mr-1.5 px-1.5 py-1 text-caption font-semibold text-content-faint hover:bg-surface-tertiary hover:text-content transition-colors"
        >
          {group.count}
          <Fold className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

/** A sibling or child screen in the nav; picking it browses that screen's overview. */
function NavScreen({ screen, shown, current }: { screen: HelpContext; shown: boolean; current: boolean }): React.ReactElement {
  const { t } = useTranslation()
  const browse = useHelpStore(s => s.browse)
  const Icon = helpIcon(screen.icon)
  return (
    <button
      type="button"
      onClick={() => browse(current ? null : screen.id)}
      aria-current={shown ? 'page' : undefined}
      className={`group w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
        shown ? 'bg-surface-selected text-content' : 'text-content-secondary hover:bg-surface-hover hover:text-content'
      }`}
    >
      <span className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
        shown ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-muted group-hover:bg-accent group-hover:text-accent-text'
      }`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="min-w-0 flex-1 text-body truncate">{t(ctxKey(screen.id, 'title'))}</span>
      {current && <MapPin className="w-3.5 h-3.5 text-content-faint flex-shrink-0" aria-label={t('help.center.thisScreen')} />}
    </button>
  )
}

function NavLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return <h3 className="px-2 pb-1 text-caption font-semibold uppercase tracking-[0.1em] text-content-faint">{children}</h3>
}

function NavGuide({ guide, active }: { guide: HelpGuide; active: boolean }): React.ReactElement {
  const { t } = useTranslation()
  const openGuide = useHelpStore(s => s.openGuide)
  const Icon = helpIcon(guide.icon)
  return (
    <button
      type="button"
      onClick={() => openGuide(guide.id)}
      aria-current={active ? 'page' : undefined}
      className={`group w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
        active ? 'bg-surface-selected text-content' : 'text-content-secondary hover:bg-surface-hover hover:text-content'
      }`}
    >
      <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
        active ? 'bg-accent text-accent-text' : 'bg-surface-card text-content-muted group-hover:text-content'
      }`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <span className="min-w-0 flex-1 text-body truncate">{t(guideKey(guide.id, 'title'))}</span>
    </button>
  )
}

/** GitHub's mark, from their brand kit; lucide dropped its brand icons. */
function GitHubMark({ className }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.17c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  )
}

/** Discord's mark, the same path the navbar's profile menu uses. */
function DiscordMark({ className }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}
