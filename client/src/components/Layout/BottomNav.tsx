import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAddonStore } from '../../store/addonStore'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../i18n'
import { Plane, CalendarDays, Globe, Compass, User, Settings, Shield, LogOut, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ADDON_NAV: Record<string, { icon: LucideIcon; labelKey: string }> = {
  vacay:   { icon: CalendarDays, labelKey: 'admin.addons.catalog.vacay.name' },
  atlas:   { icon: Globe,        labelKey: 'admin.addons.catalog.atlas.name' },
  journey: { icon: Compass,      labelKey: 'admin.addons.catalog.journey.name' },
}

export default function BottomNav() {
  const { t } = useTranslation()
  const darkMode = useSettingsStore(s => s.settings.dark_mode)
  const dark = darkMode === true || darkMode === 'dark' || (darkMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const addons = useAddonStore(s => s.addons)
  const globalAddons = addons.filter(a => a.type === 'global' && a.enabled)
  const [showProfile, setShowProfile] = useState(false)

  const items: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/trips', label: t('nav.myTrips'), icon: Plane },
    ...globalAddons.flatMap(addon => {
      const nav = ADDON_NAV[addon.id]
      return nav ? [{ to: `/${addon.id}`, label: t(nav.labelKey), icon: nav.icon }] : []
    }),
  ]

  return (
    <>
      <nav
        className="md:hidden sticky bottom-0 flex justify-around items-start pt-3 z-50 mt-auto flex-shrink-0"
        style={{
          height: 'calc(84px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: dark ? 'rgba(10,10,20,0.94)' : 'rgba(250,250,255,0.94)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderTop: `1px solid ${dark ? 'rgba(129,140,248,0.1)' : 'rgba(99,102,241,0.1)'}`,
        }}
      >
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 px-3 py-1 min-w-[60px]"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text-faint)',
              transition: 'color 180ms cubic-bezier(0.23,1,0.32,1)',
            })}
          >
            <Icon size={22} strokeWidth={2} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setShowProfile(true)}
          className="flex flex-col items-center gap-1 px-3 py-1 min-w-[60px]"
          style={{ color: 'var(--text-faint)' }}
        >
          <User size={22} strokeWidth={2} />
          <span className="text-[10px] font-medium">{t("nav.profile")}</span>
        </button>
      </nav>

      {showProfile && <ProfileSheet onClose={() => setShowProfile(false)} />}
    </>
  )
}

function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleNav = (path: string) => {
    onClose()
    navigate(path)
  }

  const handleLogout = () => {
    onClose()
    logout()
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 z-[300] md:hidden" onClick={onClose}>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'var(--modal-backdrop)',
          backdropFilter: 'blur(12px) saturate(150%)',
          WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        }}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
        style={{
          animation: 'slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          background: 'var(--modal-bg)',
          backdropFilter: 'var(--glass-blur-lg)',
          WebkitBackdropFilter: 'var(--glass-blur-lg)',
          border: '1px solid var(--modal-border)',
          borderBottomWidth: 0,
          boxShadow: 'var(--glass-shadow-lg)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-primary)' }} />
        </div>

        {/* User info */}
        <div className="px-6 pb-4 pt-1">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-[16px] font-bold flex-shrink-0"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-text)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {(user?.username || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.username}</p>
              <p className="text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
            {user?.role === 'admin' && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  background: 'var(--glass-bg-subtle)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-muted)',
                }}
              >
                <Shield size={10} /> Admin
              </span>
            )}
          </div>
        </div>

        <div className="h-px mx-4" style={{ background: 'var(--modal-border)' }} />

        {/* Links */}
        <div className="py-2 px-2">
          <button
            onClick={() => handleNav('/settings')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Settings size={18} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[14px] font-medium">{t("nav.bottomSettings")}</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => handleNav('/admin')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Shield size={18} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[14px] font-medium">{t("nav.bottomAdmin")}</span>
            </button>
          )}
        </div>

        <div className="h-px mx-4" style={{ background: 'var(--modal-border)' }} />

        {/* Logout */}
        <div className="py-2 px-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={18} className="text-red-500" />
            <span className="text-[14px] font-medium text-red-500">{t("nav.bottomLogout")}</span>
          </button>
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}
