import SchoolHolidayCatalog from '../components/Admin/SchoolHolidayCatalog'
import React, { Fragment } from 'react'
import DevNotificationsPanel from '../components/Admin/DevNotificationsPanel'
import DefaultUserSettingsTab from '../components/Admin/DefaultUserSettingsTab'
import { useTranslation } from '../i18n'
import PageShell from '../components/Layout/PageShell'
import CategoryManager from '../components/Admin/CategoryManager'
import BackupPanel from '../components/Admin/BackupPanel'
import GitHubPanel from '../components/Admin/GitHubPanel'
import AddonManager from '../components/Admin/AddonManager'
import PackingTemplateManager from '../components/Admin/PackingTemplateManager'
import HelpAnchor from '../components/Help/HelpAnchor'
import { getHelpContext } from '../help/registry'
import AuditLogPanel from '../components/Admin/AuditLogPanel'
import AdminMcpTokensPanel from '../components/Admin/AdminMcpTokensPanel'
import AdminPluginsPanel from '../components/Admin/AdminPluginsPanel'
import AdminStoragePanel from '../components/Admin/storage/AdminStoragePanel'
import { Users, Map, Briefcase, Shield, FileText, RotateCcw, Save, SlidersHorizontal, UserCog, Puzzle, Blocks, Settings as SettingsIcon, Bell, Database, ScrollText, KeyRound, GitBranch, Bug, HardDrive } from 'lucide-react'
import PageSidebar, { type PageSidebarTab } from '../components/Layout/PageSidebar'
import { useAdmin } from './admin/useAdmin'
import AdminUpdateBanner from './admin/AdminUpdateBanner'
import AdminStatCard from './admin/AdminStatCard'
import AdminUsersTab from './admin/AdminUsersTab'
import AdminSettingsTab from './admin/AdminSettingsTab'
import AdminNotificationsTab from './admin/AdminNotificationsTab'
import AdminUserModals from './admin/AdminUserModals'
import { managedAdminTabs } from '../managed'
import { SettingsHeader, SETTINGS_BUTTON_PRIMARY } from '../components/Settings/settingsKit'
import { fs } from '../components/shared/DialogShell'

export default function AdminPage(): React.ReactElement {
  // ViewportRoute in App.tsx picks the branch now, so the phone screen is a
  // chunk of its own instead of a dead limb in this one.
  return <AdminPageDesktop />
}

function AdminPageDesktop(): React.ReactElement {
  const { t, locale } = useTranslation()
  // Page = wiring container: all admin data slices + handlers live in the hook,
  // each tab/section renders from a dedicated sub-component.
  const admin = useAdmin()
  const {
    demoMode, mcpEnabled, devMode, managed,
    activeTab, setActiveTab, stats,
    bagTrackingEnabled, collabFeatures,
    serverTimezone,
    updateInfo, setShowUpdateModal,
    saveDemoBaseline, toggleBagTracking, toggleCollabFeature,
  } = admin

  const gUsers = t('admin.group.users')
  const gConfig = t('admin.group.config')
  const gIntegration = t('admin.group.integration')
  const gMaintenance = t('admin.group.maintenance')
  const GROUP_LABELS = { users: gUsers, config: gConfig, integration: gIntegration, maintenance: gMaintenance }
  const TABS: PageSidebarTab[] = [
    { id: 'users', label: t('admin.tabs.users'), icon: Users, group: gUsers },
    { id: 'defaults', label: t('admin.tabs.defaults'), icon: UserCog, group: gUsers },
    { id: 'config', label: t('admin.tabs.config'), icon: SlidersHorizontal, group: gConfig },
    { id: 'settings', label: t('admin.tabs.settings'), icon: SettingsIcon, group: gConfig },
    { id: 'addons', label: t('admin.tabs.addons'), icon: Puzzle, group: gConfig },
    { id: 'plugins', label: t('admin.tabs.plugins'), icon: Blocks, group: gConfig },
    // Storage backends and their credentials are hoster-level configuration —
    // the server refuses the whole surface in managed mode (MANAGED_FORBIDDEN).
    ...(managed ? [] : [{ id: 'storage', label: t('admin.tabs.storage'), icon: HardDrive, group: gConfig }]),
    { id: 'notifications', label: t('admin.tabs.notifications'), icon: Bell, group: gIntegration },
    ...(mcpEnabled ? [{ id: 'mcp-tokens', label: t('admin.tabs.mcpTokens'), icon: KeyRound, group: gIntegration }] : []),
    // Releases and update cadence belong to whoever operates the install.
    ...(managed ? [] : [{ id: 'github', label: t('admin.tabs.github'), icon: GitBranch, group: gIntegration }]),
    // Backups run off-volume on a managed install; the tab would offer a
    // schedule that competes with the real one.
    ...(managed ? [] : [{ id: 'backup', label: t('admin.tabs.backup'), icon: Database, group: gMaintenance }]),
    { id: 'audit', label: t('admin.tabs.audit'), icon: ScrollText, group: gMaintenance },
    ...(devMode ? [{ id: 'dev-notifications', label: 'Dev: Notifications', icon: Bug, group: gMaintenance }] : []),
    // Empty in this repository — see client/src/managed. Appended per group
    // rather than inserted, because the sidebar needs a group's tabs contiguous.
    ...managedAdminTabs.map(tab => ({
      id: tab.id,
      label: tab.label,
      icon: tab.Icon,
      group: GROUP_LABELS[tab.group ?? 'config'],
    })),
  ]

  // Every tab is its own help screen; a tab without one falls back to the admin overview.
  const helpId = getHelpContext(`admin-${activeTab}`) ? `admin-${activeTab}` : 'admin'
  return (
    <PageShell background="var(--bg-primary)">
      <HelpAnchor id={helpId} />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Header: the page's bar, with the four counts as tiles on its right */}
          <SettingsHeader
            icon={Shield}
            title={t('admin.title')}
            subtitle={t('admin.subtitle')}
            actions={stats ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: t('admin.stats.users', { count: stats.totalUsers }), value: stats.totalUsers, icon: Users },
                  { label: t('admin.stats.trips', { count: stats.totalTrips }), value: stats.totalTrips, icon: Briefcase },
                  { label: t('admin.stats.places', { count: stats.totalPlaces }), value: stats.totalPlaces, icon: Map },
                  { label: t('admin.stats.files', { count: stats.totalFiles || 0 }), value: stats.totalFiles || 0, icon: FileText },
                ].map(({ label, value, icon: Icon }) => (
                  <AdminStatCard key={label} label={label} value={value} icon={Icon} />
                ))}
              </div>
            ) : undefined}
          />

          {/* Update Banner */}
          {updateInfo && (
            <AdminUpdateBanner updateInfo={updateInfo} t={t} onHowTo={() => setShowUpdateModal(true)} />
          )}

          {/* Demo Baseline Button */}
          {demoMode && (
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-edge-faint bg-surface-secondary px-4 py-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-[12px] bg-warning-soft text-warning">
                <RotateCcw size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 basis-64">
                <p className="m-0 font-bold text-content" style={fs(14, 'body')}>Demo Baseline</p>
                <p className="m-0 mt-0.5 text-content-muted" style={fs(12.5, 'body')}>Save current state as the hourly reset point. All admin trips and settings will be preserved.</p>
              </div>
              <button type="button"
                onClick={saveDemoBaseline}
                className={`${SETTINGS_BUTTON_PRIMARY} flex-none`}
                style={fs(13, 'body')}
              >
                <Save size={14} strokeWidth={2.1} />
                Save Baseline
              </button>
            </div>
          )}

          {/* Sidebar layout — nav on the left, active panel on the right */}
          <PageSidebar
            sidebarLabel={t('admin.title').toUpperCase()}
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            footer=""
          >
            {/* Tab content */}
          {activeTab === 'users' && (
            <AdminUsersTab admin={admin} t={t} locale={locale} />
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              <PackingTemplateManager />
              <CategoryManager />
              <SchoolHolidayCatalog />
            </div>
          )}

          {activeTab === 'addons' && (
            <div className="space-y-6">
              <AddonManager bagTrackingEnabled={bagTrackingEnabled} onToggleBagTracking={toggleBagTracking} collabFeatures={collabFeatures} onToggleCollabFeature={toggleCollabFeature} />
            </div>
          )}

          {activeTab === 'settings' && (
            <AdminSettingsTab admin={admin} t={t} />
          )}

          {activeTab === 'notifications' && (
            <AdminNotificationsTab admin={admin} t={t} />
          )}

          {activeTab === 'backup' && <BackupPanel />}

          {activeTab === 'audit' && <AuditLogPanel serverTimezone={serverTimezone} />}

          {activeTab === 'mcp-tokens' && <AdminMcpTokensPanel />}

          {activeTab === 'plugins' && <AdminPluginsPanel />}

          {activeTab === 'storage' && <AdminStoragePanel />}

          {activeTab === 'github' && <GitHubPanel isPrerelease={updateInfo?.is_prerelease ?? false} />}

          {activeTab === 'defaults' && <DefaultUserSettingsTab />}

          {activeTab === 'dev-notifications' && <DevNotificationsPanel />}

          {/* Empty in this repository — see client/src/managed. */}
          {managedAdminTabs.map(tab => (
            activeTab === tab.id ? <Fragment key={tab.id}>{tab.element}</Fragment> : null
          ))}
          </PageSidebar>
        </div>

      <AdminUserModals admin={admin} t={t} />
    </PageShell>
  )
}
