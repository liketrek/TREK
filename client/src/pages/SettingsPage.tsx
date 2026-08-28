import { Bell, Blocks, CloudOff, Map, Paintbrush, Plug, Settings, SlidersHorizontal, User } from 'lucide-react';
import React from 'react';
import PageShell from '../components/Layout/PageShell';
import PageSidebar, { type PageSidebarTab } from '../components/Layout/PageSidebar';
import AccountTab from '../components/Settings/AccountTab';
import AppearanceSettingsTab from '../components/Settings/AppearanceSettingsTab';
import DisplaySettingsTab from '../components/Settings/DisplaySettingsTab';
import IntegrationsTab from '../components/Settings/IntegrationsTab';
import MapSettingsTab from '../components/Settings/MapSettingsTab';
import NotificationsTab from '../components/Settings/NotificationsTab';
import OfflineTab from '../components/Settings/OfflineTab';
import PluginSettingsTab from '../components/Settings/PluginSettingsTab';
import { useTranslation } from '../i18n';
import { usePluginStore } from '../store/pluginStore';
import { useSettings } from './settings/useSettings';

export default function SettingsPage(): React.ReactElement {
  // ViewportRoute in App.tsx picks the branch now, so the phone screen is a
  // chunk of its own instead of a dead limb in this one.
  return <SettingsPageDesktop />;
}

function SettingsPageDesktop(): React.ReactElement {
  const { t } = useTranslation();
  // Page = wiring container: addon/version loading + active-tab state in the hook.
  const { hasIntegrations, appVersion, activeTab, setActiveTab } = useSettings();
  const hasPlugins = usePluginStore((s) => s.plugins.length > 0);

  const tabs: PageSidebarTab[] = [
    { id: 'display', label: t('settings.tabs.display'), icon: SlidersHorizontal },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Paintbrush },
    { id: 'map', label: t('settings.tabs.map'), icon: Map },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    ...(hasIntegrations ? [{ id: 'integrations', label: t('settings.tabs.integrations'), icon: Plug }] : []),
    ...(hasPlugins ? [{ id: 'plugins', label: t('settings.tabs.plugins'), icon: Blocks }] : []),
    { id: 'offline', label: t('settings.tabs.offline'), icon: CloudOff },
    { id: 'account', label: t('settings.tabs.account'), icon: User },
  ];

  return (
    <PageShell background="var(--bg-secondary)">
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-tertiary">
            <Settings className="h-5 w-5 text-content-secondary" />
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
          footer={
            appVersion ? (
              <a href="/legal" className="text-content-faint no-underline hover:text-content-secondary">
                {t('legal.title')} · v{appVersion}
              </a>
            ) : (
              ''
            )
          }
        >
          {activeTab === 'display' && <DisplaySettingsTab />}
          {activeTab === 'appearance' && <AppearanceSettingsTab />}
          {activeTab === 'map' && <MapSettingsTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'integrations' && hasIntegrations && <IntegrationsTab />}
          {activeTab === 'plugins' && hasPlugins && <PluginSettingsTab />}
          {activeTab === 'offline' && <OfflineTab />}
          {activeTab === 'account' && <AccountTab />}
        </PageSidebar>
      </div>
    </PageShell>
  );
}
