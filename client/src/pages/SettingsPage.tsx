import React from 'react'
import { Settings, SlidersHorizontal, Paintbrush, Map, Bell, Plug, CloudOff, User, Info, Blocks } from 'lucide-react'
import { useTranslation } from '../i18n'
import PageShell from '../components/Layout/PageShell'
import PageSidebar, { type PageSidebarTab } from '../components/Layout/PageSidebar'
import DisplaySettingsTab from '../components/Settings/DisplaySettingsTab'
import AppearanceSettingsTab from '../components/Settings/AppearanceSettingsTab'
import MapSettingsTab from '../components/Settings/MapSettingsTab'
import NotificationsTab from '../components/Settings/NotificationsTab'
import IntegrationsTab from '../components/Settings/IntegrationsTab'
import AccountTab from '../components/Settings/AccountTab'
import AboutTab from '../components/Settings/AboutTab'
import OfflineTab from '../components/Settings/OfflineTab'
import PluginSettingsTab from '../components/Settings/PluginSettingsTab'
import { usePluginStore } from '../store/pluginStore'
import { useSettings } from './settings/useSettings'

export default function SettingsPage(): React.ReactElement {
  const { t } = useTranslation()
  // Page = wiring container: addon/version loading + active-tab state in the hook.
  const { hasIntegrations, appVersion, activeTab, setActiveTab } = useSettings()
  const hasPlugins = usePluginStore(s => s.plugins.length > 0)

  const tabs: PageSidebarTab[] = [
    { id: 'display', label: t('settings.tabs.display'), icon: SlidersHorizontal },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Paintbrush },
    { id: 'map', label: t('settings.tabs.map'), icon: Map },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    ...(hasIntegrations
      ? [{ id: 'integrations', label: t('settings.tabs.integrations'), icon: Plug }]
      : []),
    ...(hasPlugins
      ? [{ id: 'plugins', label: t('settings.tabs.plugins'), icon: Blocks }]
      : []),
    { id: 'offline', label: t('settings.tabs.offline'), icon: CloudOff },
    { id: 'account', label: t('settings.tabs.account'), icon: User },
    ...(appVersion
      ? [{ id: 'about', label: t('settings.tabs.about'), icon: Info }]
      : []),
  ]

  return (
    <PageShell background="var(--bg-secondary)">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-tertiary">
              <Settings className="w-5 h-5 text-content-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-content">{t('settings.title')}</h1>
              <p className="text-sm text-content-muted">{t('settings.subtitle')}</p>
            </div>
          </div>

          {/* Sidebar layout */}
          <PageSidebar
            sidebarLabel={t('settings.title').toUpperCase()}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            footer={appVersion ? `v${appVersion} · self-hosted` : 'self-hosted'}
          >
            {activeTab === 'display' && <DisplaySettingsTab />}
            {activeTab === 'appearance' && <AppearanceSettingsTab />}
            {activeTab === 'map' && <MapSettingsTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'integrations' && hasIntegrations && <IntegrationsTab />}
            {activeTab === 'plugins' && hasPlugins && <PluginSettingsTab />}
            {activeTab === 'offline' && <OfflineTab />}
            {activeTab === 'account' && <AccountTab />}
            {activeTab === 'about' && appVersion && <AboutTab appVersion={appVersion} />}
          </PageSidebar>
        </div>
    </PageShell>
  )
}
