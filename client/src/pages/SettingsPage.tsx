import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Settings, Palette, Map, Bell, Plug, CloudOff, User, Info } from 'lucide-react'
import { useTranslation } from '../i18n'
import { authApi } from '../api/client'
import { useAddonStore } from '../store/addonStore'
import Navbar from '../components/Layout/Navbar'
import PageSidebar, { type PageSidebarTab } from '../components/Layout/PageSidebar'
import DisplaySettingsTab from '../components/Settings/DisplaySettingsTab'
import MapSettingsTab from '../components/Settings/MapSettingsTab'
import NotificationsTab from '../components/Settings/NotificationsTab'
import IntegrationsTab from '../components/Settings/IntegrationsTab'
import AccountTab from '../components/Settings/AccountTab'
import AboutTab from '../components/Settings/AboutTab'
import OfflineTab from '../components/Settings/OfflineTab'

export default function SettingsPage(): React.ReactElement {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { isEnabled: addonEnabled, loadAddons } = useAddonStore()

  const memoriesEnabled = addonEnabled('memories')
  const mcpEnabled = addonEnabled('mcp')
  const hasIntegrations = memoriesEnabled || mcpEnabled

  const [appVersion, setAppVersion] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('display')

  useEffect(() => {
    loadAddons()
    authApi.getAppConfig?.().then(c => setAppVersion(c?.version)).catch(() => {})
  }, [])

  // Auto-switch to account tab when MFA is required
  useEffect(() => {
    if (searchParams.get('mfa') === 'required') {
      setActiveTab('account')
    }
  }, [searchParams])

  const tabs: PageSidebarTab[] = [
    { id: 'display', label: t('settings.tabs.display'), icon: Palette },
    { id: 'map', label: t('settings.tabs.map'), icon: Map },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    ...(hasIntegrations
      ? [{ id: 'integrations', label: t('settings.tabs.integrations'), icon: Plug }]
      : []),
    { id: 'offline', label: t('settings.tabs.offline'), icon: CloudOff },
    { id: 'account', label: t('settings.tabs.account'), icon: User },
    ...(appVersion
      ? [{ id: 'about', label: t('settings.tabs.about'), icon: Info }]
      : []),
  ]

  return (
    <div className="min-h-screen page-bg" style={{ background: 'var(--bg-secondary)' }}>
      <Navbar />

      <div style={{ paddingTop: 'var(--nav-h)' }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              <Settings className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('settings.title')}</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('settings.subtitle')}</p>
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
            {activeTab === 'map' && <MapSettingsTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'integrations' && hasIntegrations && <IntegrationsTab />}
            {activeTab === 'offline' && <OfflineTab />}
            {activeTab === 'account' && <AccountTab />}
            {activeTab === 'about' && appVersion && <AboutTab appVersion={appVersion} />}
          </PageSidebar>
        </div>
      </div>
    </div>
  )
}
