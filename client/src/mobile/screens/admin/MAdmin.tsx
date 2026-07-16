import { useState } from 'react'
import {
  ArrowUp,
  Bell,
  Blocks,
  Briefcase,
  Bug,
  ChevronDown,
  ChevronLeft,
  Database,
  FileText,
  Github,
  Map,
  Plug,
  Puzzle,
  ScrollText,
  Settings as SettingsIcon,
  Shield,
  SlidersHorizontal,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { adminApi } from '../../../api/client'
import { useTranslation } from '../../../i18n'
import { useCountUp } from '../../../hooks/useCountUp'
import { useAdmin } from '../../../pages/admin/useAdmin'
import AddonManager from '../../../components/Admin/AddonManager'
import AdminMcpTokensPanel from '../../../components/Admin/AdminMcpTokensPanel'
import AdminPluginsPanel from '../../../components/Admin/AdminPluginsPanel'
import AuditLogPanel from '../../../components/Admin/AuditLogPanel'
import BackupPanel from '../../../components/Admin/BackupPanel'
import CategoryManager from '../../../components/Admin/CategoryManager'
import DefaultUserSettingsTab from '../../../components/Admin/DefaultUserSettingsTab'
import DevNotificationsPanel from '../../../components/Admin/DevNotificationsPanel'
import GitHubPanel from '../../../components/Admin/GitHubPanel'
import PackingTemplateManager from '../../../components/Admin/PackingTemplateManager'
import MAdminNotificationsSection from './MAdminNotificationsSection'
import MAdminSettingsSection from './MAdminSettingsSection'
import MAdminSheets from './MAdminSheets'
import MAdminUsersSection from './MAdminUsersSection'
import { MAdminButton } from './MAdminUi'

// Stat card of the 2×2 grid (design §6.3): 34px icon tile, 19px/800 number,
// small tracking label. Count-up animation matches the desktop stat cards.
function MAdminStat({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  const animated = useCountUp(value, 900)
  return (
    <div className="flex items-center gap-[11px] rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[14px] py-[13px]">
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px] bg-[color:var(--m-ic)] text-m-ink">
        <Icon size={16} strokeWidth={2} />
      </span>
      <div>
        <div className="text-[1.1875rem] font-extrabold leading-none text-m-ink">{animated}</div>
        <div className="mt-[2px] font-geist text-[0.59375rem] font-bold tracking-[0.06em] text-m-faint">{label}</div>
      </div>
    </div>
  )
}

/**
 * Mobile admin screen (design §6): section switcher pill with the 11-entry
 * dropdown, update banner, stats grid and the users section; every other
 * desktop admin section stays reachable through the dropdown.
 */
export default function MAdmin() {
  const { t, locale } = useTranslation()
  const admin = useAdmin()
  const {
    demoMode, mcpEnabled, devMode, toast, navigate,
    activeTab, setActiveTab, stats, serverTimezone,
    bagTrackingEnabled, setBagTrackingEnabled,
    collabFeatures, setCollabFeatures,
    setShowCreateUser,
    updateInfo, setShowUpdateModal,
  } = admin
  const [sectionsOpen, setSectionsOpen] = useState(false)

  // Same sections and gating as the desktop sidebar, ordered and iconed like
  // the design's dropdown (§6.1).
  const sections: { id: string; label: string; icon: LucideIcon }[] = [
    { id: 'users', label: t('admin.tabs.users'), icon: Users },
    { id: 'defaults', label: t('admin.tabs.defaults'), icon: UserCog },
    { id: 'config', label: t('admin.tabs.config'), icon: SlidersHorizontal },
    { id: 'settings', label: t('admin.tabs.settings'), icon: SettingsIcon },
    { id: 'addons', label: t('admin.tabs.addons'), icon: Blocks },
    { id: 'plugins', label: t('admin.tabs.plugins'), icon: Puzzle },
    { id: 'notifications', label: t('admin.tabs.notifications'), icon: Bell },
    ...(mcpEnabled ? [{ id: 'mcp-tokens', label: t('admin.tabs.mcpTokens'), icon: Plug }] : []),
    { id: 'github', label: t('admin.tabs.github'), icon: Github },
    { id: 'backup', label: t('admin.tabs.backup'), icon: Database },
    { id: 'audit', label: t('admin.tabs.audit'), icon: ScrollText },
    ...(devMode ? [{ id: 'dev-notifications', label: 'Dev: Notifications', icon: Bug }] : []),
  ]
  const activeSection = sections.find((s) => s.id === activeTab) ?? sections[0]

  const saveDemoBaseline = async () => {
    try {
      await adminApi.saveDemoBaseline()
      toast.success('Baseline saved! Resets will restore to this state.')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save baseline')
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 pb-[calc(var(--bottom-nav-h,84px)+16px)] pt-[var(--m-safe-top,12px)]">
      {/* Header: back · section switcher · create user */}
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
          aria-label={t('admin.title')}
          aria-expanded={sectionsOpen}
          onClick={() => setSectionsOpen((v) => !v)}
          className="flex h-[38px] min-w-0 flex-1 items-center gap-[7px] rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] px-[14px] text-[0.8125rem] font-bold text-m-ink shadow-[0_5px_12px_-8px_rgba(0,0,0,.18)]"
        >
          <Shield size={14} strokeWidth={2.2} className="flex-none" />
          <span className="min-w-0 flex-1 truncate text-left">{activeSection.label}</span>
          <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />
        </button>
        <button
          type="button"
          aria-label={t('admin.createUser')}
          onClick={() => setShowCreateUser(true)}
          className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-m-act text-m-actfg shadow-[0_5px_12px_-8px_rgba(0,0,0,.3)]"
        >
          <UserPlus size={16} strokeWidth={2.2} />
        </button>
      </div>

      {/* Section dropdown */}
      {sectionsOpen && (
        <div className="-mt-[6px] mb-3 rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-[6px] shadow-[0_16px_40px_-20px_rgba(0,0,0,.4)]">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setActiveTab(section.id)
                setSectionsOpen(false)
              }}
              className={`flex w-full items-center gap-[10px] rounded-[11px] p-[10px] text-left text-[0.8125rem] font-semibold text-m-ink ${
                section.id === activeSection.id ? 'bg-[color:var(--m-ic)]' : ''
              }`}
            >
              <section.icon size={15} strokeWidth={2} />
              {section.label}
            </button>
          ))}
        </div>
      )}

      {/* Update banner (§6.2) — real update check, shown on every section */}
      {updateInfo && (
        <div className="mb-3 flex items-center gap-[10px] rounded-2xl border border-[color:color-mix(in_srgb,var(--m-st-pending)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--m-st-pending)_10%,transparent)] px-[14px] py-3">
          <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-[color:var(--m-st-pending)] text-white">
            <ArrowUp size={17} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[0.78125rem] font-extrabold text-m-ink">{t('admin.update.available')}</div>
            <div className="font-geist text-[0.625rem] text-m-muted">
              {t('mobileAdmin.updateLine', { version: `v${updateInfo.latest}`, current: `v${updateInfo.current}` })}
            </div>
          </div>
          <MAdminButton onClick={() => setShowUpdateModal(true)}>{t('mobileAdmin.updateAction')}</MAdminButton>
        </div>
      )}

      {/* Demo baseline (demo instances only) */}
      {demoMode && (
        <div className="mb-3 flex items-center gap-[10px] rounded-2xl border border-[color:color-mix(in_srgb,var(--m-st-pending)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--m-st-pending)_10%,transparent)] px-[14px] py-3">
          <div className="min-w-0 flex-1">
            <div className="text-[0.78125rem] font-extrabold text-m-ink">Demo Baseline</div>
            <div className="font-geist text-[0.625rem] leading-relaxed text-m-muted">
              Save current state as the hourly reset point. All admin trips and settings will be preserved.
            </div>
          </div>
          <MAdminButton onClick={saveDemoBaseline}>Save Baseline</MAdminButton>
        </div>
      )}

      {/* Stats grid (§6.3) */}
      {stats && (
        <div className="mb-3 grid grid-cols-2 gap-[10px]">
          <MAdminStat label={t('admin.stats.users')} value={stats.totalUsers} icon={Users} />
          <MAdminStat label={t('admin.stats.trips')} value={stats.totalTrips} icon={Briefcase} />
          <MAdminStat label={t('admin.stats.places')} value={stats.totalPlaces} icon={Map} />
          <MAdminStat label={t('admin.stats.files')} value={stats.totalFiles || 0} icon={FileText} />
        </div>
      )}

      {/* Active section */}
      {activeTab === 'users' && <MAdminUsersSection admin={admin} t={t} locale={locale} />}
      {activeTab === 'settings' && <MAdminSettingsSection admin={admin} t={t} />}
      {activeTab === 'notifications' && <MAdminNotificationsSection admin={admin} t={t} />}
      {activeTab === 'defaults' && <DefaultUserSettingsTab />}
      {activeTab === 'config' && (
        <div className="space-y-4">
          <PackingTemplateManager />
          <CategoryManager />
        </div>
      )}
      {activeTab === 'addons' && (
        <AddonManager
          bagTrackingEnabled={bagTrackingEnabled}
          onToggleBagTracking={async () => {
            const next = !bagTrackingEnabled
            setBagTrackingEnabled(next)
            try {
              await adminApi.updateBagTracking(next)
            } catch {
              setBagTrackingEnabled(!next)
            }
          }}
          collabFeatures={collabFeatures}
          onToggleCollabFeature={async (key: string) => {
            const next = { ...collabFeatures, [key]: !collabFeatures[key] }
            setCollabFeatures(next)
            try {
              await adminApi.updateCollabFeatures({ [key]: next[key] })
            } catch {
              setCollabFeatures(collabFeatures)
            }
          }}
        />
      )}
      {activeTab === 'plugins' && <AdminPluginsPanel />}
      {activeTab === 'mcp-tokens' && <AdminMcpTokensPanel />}
      {activeTab === 'github' && <GitHubPanel isPrerelease={updateInfo?.is_prerelease ?? false} />}
      {activeTab === 'backup' && <BackupPanel />}
      {activeTab === 'audit' && <AuditLogPanel serverTimezone={serverTimezone} />}
      {activeTab === 'dev-notifications' && <DevNotificationsPanel />}

      <MAdminSheets admin={admin} t={t} />
    </div>
  )
}
