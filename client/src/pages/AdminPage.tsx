import React, { Fragment } from 'react'
import { adminApi } from '../api/client'
import DevNotificationsPanel from '../components/Admin/DevNotificationsPanel'
import DefaultUserSettingsTab from '../components/Admin/DefaultUserSettingsTab'
import { useTranslation } from '../i18n'
import PageShell from '../components/Layout/PageShell'
import CategoryManager from '../components/Admin/CategoryManager'
import BackupPanel from '../components/Admin/BackupPanel'
import GitHubPanel from '../components/Admin/GitHubPanel'
import AddonManager from '../components/Admin/AddonManager'
import PackingTemplateManager from '../components/Admin/PackingTemplateManager'
import AuditLogPanel from '../components/Admin/AuditLogPanel'
import AdminMcpTokensPanel from '../components/Admin/AdminMcpTokensPanel'
import AdminPluginsPanel from '../components/Admin/AdminPluginsPanel'
import AdminStoragePanel from '../components/Admin/storage/AdminStoragePanel'
import { Users, Map, Briefcase, Shield, FileText, SlidersHorizontal, UserCog, Puzzle, Blocks, Settings as SettingsIcon, Bell, Database, ScrollText, KeyRound, GitBranch, Bug, HardDrive } from 'lucide-react'
import PageSidebar, { type PageSidebarTab } from '../components/Layout/PageSidebar'
import { useAdmin } from './admin/useAdmin'
import AdminUpdateBanner from './admin/AdminUpdateBanner'
import AdminStatCard from './admin/AdminStatCard'
import AdminUsersTab from './admin/AdminUsersTab'
import AdminSettingsTab from './admin/AdminSettingsTab'
import AdminNotificationsTab from './admin/AdminNotificationsTab'
import AdminUserModals from './admin/AdminUserModals'
import { managedAdminTabs } from '../managed'

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
    demoMode, mcpEnabled, devMode, managed, toast,
    activeTab, setActiveTab, stats,
    bagTrackingEnabled, setBagTrackingEnabled,
    collabFeatures, setCollabFeatures,
    serverTimezone,
    updateInfo, setShowUpdateModal,
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

  return (
    <PageShell background="var(--bg-secondary)">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t('admin.title')}</h1>
              <p className="text-slate-500 text-sm">{t('admin.subtitle')}</p>
            </div>
          </div>

          {/* Update Banner */}
          {updateInfo && (
            <AdminUpdateBanner updateInfo={updateInfo} t={t} onHowTo={() => setShowUpdateModal(true)} />
          )}

          {/* Demo Baseline Button */}
          {demoMode && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-900">Demo Baseline</p>
                <p className="text-xs text-amber-700">Save current state as the hourly reset point. All admin trips and settings will be preserved.</p>
              </div>
              <button type="button"
                onClick={async () => {
                  try {
                    await adminApi.saveDemoBaseline()
                    toast.success('Baseline saved! Resets will restore to this state.')
                  } catch (e) {
                    toast.error(e.response?.data?.error || 'Failed to save baseline')
                  }
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors flex-shrink-0 ml-4"
              >
                Save Baseline
              </button>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: t('admin.stats.users'), value: stats.totalUsers, icon: Users },
                { label: t('admin.stats.trips'), value: stats.totalTrips, icon: Briefcase },
                { label: t('admin.stats.places'), value: stats.totalPlaces, icon: Map },
                { label: t('admin.stats.files'), value: stats.totalFiles || 0, icon: FileText },
              ].map(({ label, value, icon: Icon }) => (
                <AdminStatCard key={label} label={label} value={value} icon={Icon} />
              ))}
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
            </div>
          )}

          {activeTab === 'addons' && (
            <div className="space-y-6">
              <AddonManager bagTrackingEnabled={bagTrackingEnabled} onToggleBagTracking={async () => {
                const next = !bagTrackingEnabled
                setBagTrackingEnabled(next)
                try { await adminApi.updateBagTracking(next) } catch { setBagTrackingEnabled(!next) }
              }} collabFeatures={collabFeatures} onToggleCollabFeature={async (key: string) => {
                const previous = collabFeatures[key]
                setCollabFeatures({ ...collabFeatures, [key]: !previous })
                try {
                  await adminApi.updateCollabFeatures({ [key]: !previous })
                } catch {
                  // Only this key rolls back — a slower request must not undo a toggle
                  // the admin made in the meantime.
                  setCollabFeatures(prev => ({ ...prev, [key]: previous }))
                }
              }} />
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
