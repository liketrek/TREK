import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import type { LucideIcon } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import { useSettings } from '../../../pages/settings/useSettings'
import { usePluginStore } from '../../../store/pluginStore'
import OfflineTab from '../../../components/Settings/OfflineTab'
import PluginSettingsTab from '../../../components/Settings/PluginSettingsTab'
import MSettingsGeneral from './MSettingsGeneral'
import MSettingsAppearance from './MSettingsAppearance'
import MSettingsMap from './MSettingsMap'
import MSettingsNotifications from './MSettingsNotifications'
import MSettingsIntegrations from './MSettingsIntegrations'
import MSettingsAccount from './MSettingsAccount'
import MSettingsAbout from './MSettingsAbout'

interface SectionTab {
  id: string
  label: string
  icon: LucideIcon
}

/**
 * Mobile settings screen: back + section-switcher pill on top, the section
 * dropdown panel in flow below it, then the active section's cards. Shares the
 * desktop page's useSettings() hook (tab state, ?tab=/?mfa= deep links, addon
 * gating, app version).
 */
export default function MSettings() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { hasIntegrations, appVersion, activeTab, setActiveTab } = useSettings()
  const hasPlugins = usePluginStore((s) => s.plugins.length > 0)
  const [dropOpen, setDropOpen] = useState(false)

  const tabs: SectionTab[] = [
    { id: 'display', label: t('settings.tabs.display'), icon: SlidersHorizontal },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Palette },
    { id: 'map', label: t('settings.tabs.map'), icon: Map },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    ...(hasIntegrations ? [{ id: 'integrations', label: t('settings.tabs.integrations'), icon: Plug }] : []),
    ...(hasPlugins ? [{ id: 'plugins', label: t('settings.tabs.plugins'), icon: Puzzle }] : []),
    { id: 'offline', label: t('settings.tabs.offline'), icon: CloudOff },
    { id: 'account', label: t('settings.tabs.account'), icon: User },
    ...(appVersion ? [{ id: 'about', label: t('settings.tabs.about'), icon: Info }] : []),
  ]

  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  return (
    <div className="px-4 pb-[calc(var(--bottom-nav-h,84px)+16px)] pt-[var(--m-safe-top,12px)]">
      {/* Header: back + section switcher pill */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={() => navigate('/dashboard')}
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] text-m-ink shadow-[0_5px_12px_-8px_rgba(0,0,0,.18)]"
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          aria-expanded={dropOpen}
          onClick={() => setDropOpen((v) => !v)}
          className="flex h-[38px] min-w-0 flex-1 items-center gap-[7px] rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] px-[14px] text-[0.8125rem] font-bold text-m-ink shadow-[0_5px_12px_-8px_rgba(0,0,0,.18)]"
        >
          <Settings2 size={14} strokeWidth={2.2} className="flex-none" />
          <span className="min-w-0 flex-1 truncate text-left">{active.label}</span>
          <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />
        </button>
      </div>

      {/* Section dropdown, in flow (pushes the content down like the demo) */}
      {dropOpen && (
        <div className="m-pop-in -mt-[6px] mb-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[6px] shadow-[0_16px_40px_-20px_rgba(0,0,0,.4)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                setDropOpen(false)
              }}
              className={`flex w-full items-center gap-[10px] rounded-[11px] p-[10px] text-left text-[0.8125rem] font-semibold text-m-ink ${
                tab.id === active.id ? 'bg-[color:var(--m-ic)]' : ''
              }`}
            >
              <tab.icon size={15} strokeWidth={2} className="flex-none" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {active.id === 'display' && <MSettingsGeneral />}
      {active.id === 'appearance' && <MSettingsAppearance />}
      {active.id === 'map' && <MSettingsMap />}
      {active.id === 'notifications' && <MSettingsNotifications />}
      {active.id === 'integrations' && hasIntegrations && <MSettingsIntegrations />}
      {/* Offline and per-plugin settings reuse the existing responsive tabs. */}
      {active.id === 'plugins' && hasPlugins && <PluginSettingsTab />}
      {active.id === 'offline' && <OfflineTab />}
      {active.id === 'account' && <MSettingsAccount />}
      {active.id === 'about' && appVersion && <MSettingsAbout appVersion={appVersion} />}
    </div>
  )
}
