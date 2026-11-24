import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate, useLocation } from 'react-router'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useAddonStore } from '../../store/addonStore'
import { usePluginStore } from '../../store/pluginStore'
import { useTranslation } from '../../i18n'
import { Plane, LogOut, Settings, ChevronDown, Shield, ArrowLeft, ChevronLeft, Moon, Sun, Monitor, CalendarDays, Briefcase, Globe, Compass, BookOpen, Bookmark, Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import InAppNotificationBell from './InAppNotificationBell.tsx'
import HelpButton from '../Help/HelpButton'
import AssistantLauncher from '../Assistant/AssistantLauncher'
import { resolvePluginIcon } from '../shared/PluginIcon'
import { visibleManagedNavItems } from '../../managed'
import { useCollapseOnOverflow } from '../../hooks/useCollapseOnOverflow'
import { openMailInbox } from '../MailIngest/mailInboxOpener'
import { useMailInboxShell } from '../MailIngest/useMailInboxShell'
import MailInboxDialog from '../MailIngest/MailInboxDialog'

const ADDON_ICONS: Record<string, LucideIcon> = { CalendarDays, Briefcase, Globe, Compass, Bookmark }

interface NavbarProps {
  tripTitle?: string
  tripId?: number | string
  onBack?: () => void
  showBack?: boolean
  /** The trip's Settings: who is on it, its links and its journal. */
  onSettings?: () => void
}

interface Addon {
  id: string
  name: string
  icon: string
  type: string
  enabled: boolean
}

export default function Navbar({ tripTitle, tripId, onBack, showBack, onSettings }: NavbarProps): React.ReactElement {
  const { user, logout, isPrerelease, appVersion, managed } = useAuthStore()
  const { settings, updateSetting } = useSettingsStore()
  const { addons: allAddons, loadAddons } = useAddonStore()
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false)
  const [scrolled, setScrolled] = useState<boolean>(false)
  // The booking mail import's inbox: its menu entry shows only where the import is on for this person.
  const { on: mailImportOn, pending: mailPending } = useMailInboxShell(user?.id)
  const darkMode = settings.dark_mode
  const dark = darkMode === true || darkMode === 'dark' || (darkMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8 || (document.body.scrollTop || 0) > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.body.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.body.removeEventListener('scroll', onScroll)
    }
  }, [])

  // Only show 'global' type addons in the navbar — 'integration' addons have no dedicated page
  const globalAddons = allAddons.filter((a: Addon) => a.type === 'global' && a.enabled)
  const pagePlugins = usePluginStore(s => s.plugins).filter(p => p.type === 'page')

  useEffect(() => {
    if (user) loadAddons()
  }, [user, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { state: { noRedirect: true } })
  }

  // Keep track of the pending theme-transition cleanup so we can cancel it
  // on unmount. Without this the timer fires after jsdom teardown in unit
  // tests (document is gone) and triggers an unhandled ReferenceError that
  // trips vitest's exit code.
  const themeTransitionTimer = useRef<number | null>(null)
  useEffect(() => () => {
    if (themeTransitionTimer.current !== null) {
      window.clearTimeout(themeTransitionTimer.current)
      themeTransitionTimer.current = null
    }
  }, [])

  const toggleDarkMode = () => {
    document.documentElement.classList.add('trek-theme-transitioning')
    updateSetting('dark_mode', dark ? 'light' : 'dark').catch(() => {})
    if (themeTransitionTimer.current !== null) window.clearTimeout(themeTransitionTimer.current)
    themeTransitionTimer.current = window.setTimeout(() => {
      document.documentElement.classList.remove('trek-theme-transitioning')
      themeTransitionTimer.current = null
    }, 360)
  }

  const getAddonName = (addon: Addon): string => {
    const key = `admin.addons.catalog.${addon.id}.name`
    const translated = t(key)
    return translated !== key ? translated : addon.name
  }

  const tabs = [{ id: '__trips', path: '/dashboard', label: t('nav.myTrips'), Icon: Briefcase },
    ...globalAddons.map(a => ({ id: a.id, path: `/${a.id}`, label: getAddonName(a), Icon: ADDON_ICONS[a.icon] || CalendarDays })),
    ...pagePlugins.map(p => ({ id: `plugin:${p.id}`, path: `/plugins/${p.id}`, label: p.name, Icon: resolvePluginIcon(p.icon) })),
    // Empty in this repository — see client/src/managed.
    ...visibleManagedNavItems(user?.role === 'admin').map(m => ({ id: `managed:${m.id}`, path: m.path, label: m.label, Icon: m.Icon }))
  ]
  // Labels go when they no longer fit beside the logo and the actions; the
  // title and aria-label on each tab keep it named.
  const { ref: pillRef, collapsed: pillCollapsed } = useCollapseOnOverflow<HTMLDivElement>(tabs.map(tab => tab.label).join('|'))

  return (
    <nav style={{
      background: dark
        ? (scrolled ? 'rgba(9,9,11,0.78)' : 'rgba(9,9,11,0.95)')
        : (scrolled ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.95)'),
      backdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'blur(20px)',
      WebkitBackdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'blur(20px)',
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
      boxShadow: scrolled
        ? (dark ? '0 4px 24px rgba(0,0,0,0.35)' : '0 4px 24px rgba(0,0,0,0.08)')
        : (dark ? '0 1px 12px rgba(0,0,0,0.2)' : '0 1px 12px rgba(0,0,0,0.05)'),
      touchAction: 'manipulation',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      height: 'var(--nav-h)',
      transition: 'background 240ms cubic-bezier(0.23,1,0.32,1), backdrop-filter 240ms cubic-bezier(0.23,1,0.32,1), box-shadow 240ms cubic-bezier(0.23,1,0.32,1)',
    }} data-desktop-navbar="" className="hidden md:flex items-center px-4 gap-4 fixed top-0 inset-x-0 z-[200]">
      {/* Left side. flex-1 basis-0, matching the action cluster on the right, so
          the tab pill between them sits in the middle of the bar rather than
          being centred on top of both (#1983). Both columns keep at least their
          content width (min-w-max): a column squeezed below it spilled over the
          pill, so the pill is the one that gives way, first by dropping its
          labels and then by scrolling. On a trip page there is no pill, and the
          trip title truncates instead. */}
      <div className={`flex items-center gap-3 flex-1 basis-0 ${tripTitle ? 'min-w-0' : 'min-w-max'}`}>
        {showBack && !tripTitle && (
          <button type="button" onClick={onBack}
            className="trek-back-btn p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm flex-shrink-0 text-content-muted"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <ArrowLeft className="trek-back-icon w-4 h-4" />
            <span className="hidden sm:inline">{t('common.back')}</span>
          </button>
        )}

        <Link to="/dashboard" className="flex items-center transition-colors flex-shrink-0">
          <img src={dark ? '/icons/icon-white.svg' : '/icons/icon-dark.svg'} alt="TREK" className="sm:hidden" style={{ height: 22, width: 22 }} />
          <img src={dark ? '/logo-light.svg' : '/logo-dark.svg'} alt="TREK" className="hidden sm:block" style={{ height: 28 }} />
        </Link>

        {/* Prerelease badge. Beside the logo it names the build, and it stays out
            of the action cluster on the right, which has no room to spare once
            plugins add tabs to the pill. */}
        {isPrerelease && appVersion && (
          <span
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 bg-[rgba(245,158,11,0.15)] text-[#d97706] border border-[rgba(245,158,11,0.3)]"
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#f59e0b]" />
            {appVersion}
          </span>
        )}

        {/* In a trip the way back lives in the trip's own pill: arrow and name in one. */}
        {tripTitle && (showBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={`${t('common.back')}: ${tripTitle}`}
            className="trek-back-btn inline-flex min-w-0 max-w-64 items-center gap-1 rounded-full bg-surface-card py-1 ps-1.5 pe-3 text-content shadow-sm ring-1 ring-inset ring-edge-faint transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <ChevronLeft className="trek-back-icon h-4 w-4 flex-none text-content-muted" aria-hidden="true" />
            <span className="truncate text-caption font-semibold">{tripTitle}</span>
          </button>
        ) : (
          <span className="hidden sm:inline-flex min-w-0 max-w-56 items-center rounded-full bg-surface-card px-2.5 py-1 shadow-sm ring-1 ring-inset ring-edge-faint">
            <span className="truncate text-caption font-semibold text-content">{tripTitle}</span>
          </span>
        ))}

        {/* The trip's Settings sit with the trip, beside its pill: they are about this
            trip, not about the app the right side of the bar belongs to. */}
        {onSettings && (
          // The same pill as the trip's own beside it, so the two read as one pair.
          <button
            type="button"
            onClick={onSettings}
            className="inline-flex flex-none items-center gap-1.5 rounded-full bg-surface-card py-1 ps-2 pe-3 text-content shadow-sm ring-1 ring-inset ring-edge-faint transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Settings className="h-4 w-4 flex-none text-content-muted" aria-hidden="true" />
            <span className="text-caption font-semibold">{t('trip.settings.title')}</span>
          </button>
        )}
      </div>

      {/* Centred liquid-glass tab menu (design handoff).
          
          In the flow, between two equally weighted flex columns, rather than
          absolutely positioned on the centre of the bar. Out of the flow it had
          no relationship to its neighbours at all: its width grows with every
          enabled addon and every page plugin, and once it outgrew the free
          space in the middle it simply ran underneath the logo on one side and
          the user menu on the other (#1983). The only adaptation was a fixed
          1024px breakpoint that drops the labels, which was tuned for two or
          three addons and cannot know about plugins.
          
          Now the three columns share the bar, so overlap is not something that
          can happen: the pill takes the width it needs and the columns beside
          it give way. min-w-0 lets it shrink past its content and scroll rather
          than push the actions off the bar. */}
      {(globalAddons.length > 0 || pagePlugins.length > 0) && !tripTitle && (
        <div
          ref={pillRef}
          className="trek-nav-pill min-w-0"
          style={{
            display: 'flex', gap: 4, padding: 4, borderRadius: 14, flexShrink: 1,
            overflowX: 'auto', scrollbarWidth: 'none',
            background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          {tabs.map(tab => {
            const isActive = location.pathname === tab.path
            return (
              <Link key={tab.id} to={tab.path}
                title={tab.label} aria-label={tab.label}
                className="flex items-center gap-1.5 whitespace-nowrap transition-colors"
                style={{
                  padding: '5px 16px', borderRadius: 9, fontSize: 'calc(13.5px * var(--fs-scale-body, 1))', fontWeight: 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.05)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-muted)' }}>
                <tab.Icon className="w-4 h-4" />
                <span className={pillCollapsed ? 'hidden' : 'hidden lg:inline'}>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Centre slot for page-scoped notices (plugin trip warnings portal into it).
          Only mounted on trip pages, where the tab pill above is absent, so the two
          never fight over the centre. Zero-size while empty; pointer events stay off
          on the wrapper so an empty slot can't swallow clicks. */}
      {tripTitle && (
        <div
          id="trek-nav-center-slot"
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
            display: 'flex', alignItems: 'center', gap: 6, maxWidth: '42%',
            overflow: 'hidden', pointerEvents: 'none',
          }}
        />
      )}

      {/* Right side. Same weight as the left column, so whatever is between them
          is centred on the bar (#1983). Was a bare flex-1 spacer followed by
          loose siblings, which centred nothing and left the pill to fend for
          itself on top of them. */}
      <div className="flex items-center gap-4 flex-1 basis-0 min-w-max justify-end">

      {/* The assistant, only once a connection this user can use is set up */}
      {user && <AssistantLauncher variant="navbar" />}

      {/* Contextual help for the current screen — same footprint as the theme toggle beside it */}
      {user && <HelpButton />}

      {/* Dark mode toggle (light ↔ dark, overrides auto) — hidden on mobile */}
      <button type="button" onClick={toggleDarkMode} title={dark ? t('nav.lightMode') : t('nav.darkMode')}
        className="p-2 rounded-lg transition-colors flex-shrink-0 hidden sm:flex relative w-8 h-8 items-center justify-center text-content-muted"
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <Sun className="w-4 h-4 absolute transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ opacity: dark ? 1 : 0, transform: dark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.6)' }} />
        <Moon className="w-4 h-4 absolute transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ opacity: dark ? 0 : 1, transform: dark ? 'rotate(90deg) scale(0.6)' : 'rotate(0deg) scale(1)' }} />
      </button>

      {/* Notification bell — only in trip view on mobile, everywhere on desktop */}
      {user && tripId && <InAppNotificationBell />}
      {user && !tripId && <span className="hidden sm:block"><InAppNotificationBell /></span>}

      {/* User menu */}
      {user && (
        <div className="relative">
          <button type="button" onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 py-1.5 px-3 rounded-lg transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: dark ? '#e2e8f0' : '#111827', color: dark ? '#0f172a' : '#ffffff' }}>
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm hidden sm:inline max-w-40 truncate text-content-secondary">
              {user.username}
            </span>
            <ChevronDown className="w-4 h-4 text-content-faint" />
          </button>

          {userMenuOpen && createPortal(
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} role="presentation" onClick={() => setUserMenuOpen(false)} />
              <div className="trek-menu-enter w-52 rounded-xl shadow-xl border overflow-hidden bg-surface-card border-edge" style={{ position: 'fixed', top: 'var(--nav-h)', insetInlineEnd: 8, zIndex: 9999 }}>
                <div className="px-4 py-3 border-b border-edge-secondary">
                  <p className="text-sm font-medium text-content">{user.username}</p>
                  <p className="text-xs truncate text-content-muted">{user.email}</p>
                  {user.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium mt-1 text-content-secondary">
                      <Shield className="w-3 h-3" /> {t('nav.administrator')}
                    </span>
                  )}
                </div>

                <div className="py-1">
                  <Link to="/settings" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm transition-colors text-content-secondary"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Settings className="w-4 h-4" />
                    {t('nav.settings')}
                  </Link>

                  {/* Bookings from forwarded mails that wait for a decision; only where the import is on. */}
                  {mailImportOn && (
                  <button type="button" onClick={() => { setUserMenuOpen(false); openMailInbox() }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-body transition-colors text-content-secondary hover:bg-surface-hover">
                    <Inbox className="w-4 h-4" />
                    <span className="min-w-0 flex-1 truncate text-start">{t('mailInbox.title')}</span>
                    {mailPending > 0 && <span className="rounded-full bg-accent px-1.5 text-caption font-semibold text-accent-text">{mailPending}</span>}
                  </button>
                  )}

                  {!managed && (
                  <Link to="/help" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm transition-colors text-content-secondary"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <BookOpen className="w-4 h-4" />
                    {t('nav.help')}
                  </Link>
                  )}
                  <Link to="/legal" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-body transition-colors text-content-secondary"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <BookOpen className="w-4 h-4" />
                    {t('legal.title')}
                  </Link>

                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm transition-colors text-content-secondary"
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <Shield className="w-4 h-4" />
                      {t('nav.admin')}
                    </Link>
                  )}
                </div>

                <div className="py-1 border-t border-edge-secondary">
                  <button type="button" onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" />
                    {t('nav.logout')}
                  </button>
                  {appVersion && (
                    <div className="px-4 pt-2 pb-2.5 text-center border-t border-edge-secondary" style={{ marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--bg-tertiary)', borderRadius: 99, padding: '4px 12px' }}>
                          <img src={dark ? '/text-light.svg' : '/text-dark.svg'} alt="TREK" style={{ height: 10, opacity: 0.5 }} />
                          <span style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600, color: 'var(--text-faint)' }}>v{appVersion}</span>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>,
            document.body
          )}
        </div>
      )}
      </div>
      {mailImportOn && <MailInboxDialog />}
    </nav>
  )
}
