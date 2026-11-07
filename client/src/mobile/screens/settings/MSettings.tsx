import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  CloudOff,
  Info,
  Map,
  Palette,
  Plug,
  Puzzle,
  Settings2,
  SlidersHorizontal,
  User,
} from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useSettings } from '../../../pages/settings/useSettings'
import MSettingsPlugins from './MSettingsPlugins'
import MSettingsOffline from './MSettingsOffline'
import MSettingsGeneral from './MSettingsGeneral'
import MSettingsAppearance from './MSettingsAppearance'
import MSettingsMap from './MSettingsMap'
import MSettingsNotifications from './MSettingsNotifications'
import MSettingsIntegrations from './MSettingsIntegrations'
import MSettingsAccount from './MSettingsAccount'
import MSettingsAbout from './MSettingsAbout'
import MSettingsServer from './MSettingsServer'
import { useIsSplit } from '../../../hooks/sizeClass'
import MSectionNav, { MSectionRow, SECTION_SCREEN, type MSection } from '../../components/MSectionNav'

/**
 * Mobile settings screen: back + section-switcher pill on top, the section
 * dropdown panel in flow below it, then the active section's cards. Shares the
 * desktop page's useSettings() hook (tab state, ?tab=/?mfa= deep links, addon
 * gating, app version).
 */
export default function MSettings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasIntegrations, hasPlugins, appVersion, activeTab, setActiveTab, managed } = useSettings()
  const [dropOpen, setDropOpen] = useState(false)
  // With room for two panes the sections stand in a list of their own beside
  // the page, the way Settings on an iPad does, instead of behind a dropdown.
  const split = useIsSplit()

  const tabs: MSection[] = [
    { id: 'display', label: t('settings.tabs.display'), icon: SlidersHorizontal },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Palette },
    { id: 'map', label: t('settings.tabs.map'), icon: Map },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    ...(hasIntegrations ? [{ id: 'integrations', label: t('settings.tabs.integrations'), icon: Plug }] : []),
    ...(hasPlugins && !managed ? [{ id: 'plugins', label: t('settings.tabs.plugins'), icon: Puzzle }] : []),
    { id: 'offline', label: t('settings.tabs.offline'), icon: CloudOff },
    { id: 'account', label: t('settings.tabs.account'), icon: User },
    // Same call as the desktop page: About is about the project — what TREK is,
    // where to file a bug, where to support it — and a customer of a hosted
    // instance is the audience for none of it. The version and the source link
    // move to the footer below, because AGPL §13 wants those offered wherever
    // people reach the software over a network.
    ...(appVersion && !managed ? [{ id: 'about', label: t('settings.tabs.about'), icon: Info }] : []),
  ]

  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  return (
    // The same frame as administration's: beside the sections the page runs to
    // the same width there and here.
    <div className={SECTION_SCREEN}>
      {split && (
        <MSectionNav
          title={t('settings.title')}
          backLabel={t('common.back')}
          onBack={() => void navigate('/dashboard')}
          sections={tabs}
          activeId={active.id}
          onPick={setActiveTab}
        />
      )}
      <div className="min-w-0">
      {/* Header: back + section switcher pill */}
      {!split && (
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={() => navigate('/dashboard')}
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] text-m-ink shadow-[0_5px_12px_-8px_rgba(0,0,0,.18)]"
        >
          <ChevronLeft size={18} strokeWidth={2.2} className="rtl:-scale-x-100" />
        </button>
        <button
          type="button"
          aria-expanded={dropOpen}
          onClick={() => setDropOpen((v) => !v)}
          className="flex h-[38px] min-w-0 flex-1 items-center gap-[7px] rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] px-[14px] text-[0.8125rem] font-bold text-m-ink shadow-[0_5px_12px_-8px_rgba(0,0,0,.18)]"
        >
          <Settings2 size={14} strokeWidth={2.2} className="flex-none" />
          <span className="min-w-0 flex-1 truncate text-start">{active.label}</span>
          <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />
        </button>
      </div>
      )}

      {/* Section dropdown, in flow (pushes the content down like the demo) */}
      {dropOpen && !split && (
        <div className="m-pop-in -mt-[6px] mb-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[6px] shadow-[0_16px_40px_-20px_rgba(0,0,0,.4)]">
          {tabs.map((tab) => (
            <MSectionRow
              key={tab.id}
              section={tab}
              active={tab.id === active.id}
              onPick={() => {
                setActiveTab(tab.id)
                setDropOpen(false)
              }}
            />
          ))}
        </div>
      )}

      {active.id === 'display' && <MSettingsGeneral />}
      {active.id === 'appearance' && <MSettingsAppearance />}
      {active.id === 'map' && <MSettingsMap />}
      {active.id === 'notifications' && <MSettingsNotifications />}
      {active.id === 'integrations' && hasIntegrations && <MSettingsIntegrations />}
      {/* Per-plugin settings still reuse the existing responsive tab. */}
      {active.id === 'plugins' && hasPlugins && !managed && <MSettingsPlugins />}
      {active.id === 'offline' && <MSettingsOffline />}
      {active.id === 'account' && <MSettingsServer />}
      {active.id === 'account' && <MSettingsAccount />}
      {active.id === 'about' && appVersion && <MSettingsAbout appVersion={appVersion} />}

      {managed && appVersion && (
        <p className="mt-8 text-center text-caption text-m-muted">
          <a
            href="https://github.com/liketrek/TREK"
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
          >
            v{appVersion}
          </a>
        </p>
      )}
      </div>
    </div>
  )
}
