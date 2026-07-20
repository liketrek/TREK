import React from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from '../i18n'
import PageShell from '../components/Layout/PageShell'
import VacayCalendar from '../components/Vacay/VacayCalendar'
import VacayPersons from '../components/Vacay/VacayPersons'
import VacayStats from '../components/Vacay/VacayStats'
import VacaySettings from '../components/Vacay/VacaySettings'
import { Plus, Minus, ChevronLeft, ChevronRight, Settings, CalendarDays, AlertTriangle, Eye, Pencil, Trash2, Unlink, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import Modal from '../components/shared/Modal'
import { useVacay } from './vacay/useVacay'
import { useIsPhone } from '../mobile/useIsPhone'
import MVacay from '../mobile/screens/vacay/MVacay'

export default function VacayPage(): React.ReactElement {
  const isPhone = useIsPhone()
  return isPhone ? <MVacay /> : <VacayPageDesktop />
}

function VacayPageDesktop(): React.ReactElement {
  const { t } = useTranslation()
  // Page = wiring container: vacay store, live sync + UI state live in the hook.
  const {
    years, selectedYear, setSelectedYear, removeYear, loading,
    incomingInvites, acceptInvite, declineInvite, plan,
    showSettings, setShowSettings, deleteYear, setDeleteYear,
    showMobileSidebar, setShowMobileSidebar,
    handleAddNextYear, handleAddPrevYear,
  } = useVacay()

  if (loading) {
    return (
      <PageShell background="var(--vg-bg)" contentClassName="flex items-center justify-center" contentStyle={{ minHeight: 'calc(100vh - var(--nav-h))' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin border-edge border-t-content" />
      </PageShell>
    )
  }

  // Sidebar content (shared between desktop sidebar and mobile drawer)
  const sidebarContent = (
    <>
      {/* Year Selector */}
      <div className="vg-card rounded-[22px]" style={{ padding: '14px 18px' }}>
        <div className="mb-3">
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--vg-ink3)' }}>{t('vacay.year')}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-0.5">
            <button onClick={handleAddPrevYear} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--vg-ink3)' }} title={t('vacay.addPrevYear')}>
              <Plus size={14} />
            </button>
            <button onClick={() => { const idx = years.indexOf(selectedYear); if (idx > 0) setSelectedYear(years[idx - 1]) }} disabled={years.indexOf(selectedYear) <= 0} className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-20 transition-colors" style={{ color: 'var(--vg-ink3)' }}>
              <ChevronLeft size={16} />
            </button>
          </div>
          <span className="tabular-nums" style={{ fontSize: 22, fontWeight: 700, color: 'var(--vg-ink)' }}>{selectedYear}</span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => { const idx = years.indexOf(selectedYear); if (idx < years.length - 1) setSelectedYear(years[idx + 1]) }} disabled={years.indexOf(selectedYear) >= years.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-20 transition-colors" style={{ color: 'var(--vg-ink3)' }}>
              <ChevronRight size={16} />
            </button>
            <button onClick={handleAddNextYear} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--vg-ink3)' }} title={t('vacay.addYear')}>
              <Plus size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {years.map(y => (
            <div key={y} onClick={() => setSelectedYear(y)}
              className="group relative rounded-[9px] text-center cursor-pointer transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{
                padding: '7px 0',
                fontSize: 12,
                fontWeight: 600,
                background: y === selectedYear ? 'var(--vg-ink)' : 'var(--vg-surf2)',
                color: y === selectedYear ? 'var(--vg-bg)' : 'var(--vg-ink2)',
              }}>
              {y}
              {years.length > 1 && (
                <span onClick={e => { e.stopPropagation(); setDeleteYear(y); setShowMobileSidebar(false) }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[7px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Minus size={7} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <VacayPersons />

      {/* Legend */}
      {(plan?.holidays_enabled || plan?.company_holidays_enabled || plan?.block_weekends) && (
        <div className="vg-card rounded-[22px]" style={{ padding: '14px 18px' }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--vg-ink3)' }}>{t('vacay.legend')}</span>
          <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-2.5">
            {plan?.holidays_enabled && (plan?.holiday_calendars ?? []).length === 0 && (
              <LegendItem color="#fecaca" label={t('vacay.publicHoliday')} />
            )}
            {plan?.holidays_enabled && (plan?.holiday_calendars ?? []).map(cal => (
              <LegendItem key={cal.id} color={cal.color} label={cal.label || cal.region} />
            ))}
            {plan?.company_holidays_enabled && <LegendItem color="#fde68a" label={t('vacay.companyHoliday')} />}
            {plan?.block_weekends && <LegendItem color="#e5e7eb" label={t('vacay.weekend')} />}
          </div>
        </div>
      )}

      <VacayStats />
    </>
  )

  return (
    <PageShell background="var(--vg-bg)">
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 lg:px-8 py-4 lg:py-9">
          {/* Mobile + tablet header (filter toggle lives here) */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-secondary">
                <CalendarDays size={18} className="text-content" />
              </div>
              <h1 className="text-lg font-bold text-content">{t('admin.addons.catalog.vacay.name')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors bg-surface-secondary text-content-muted"
              >
                <SlidersHorizontal size={14} />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors bg-surface-secondary text-content-muted"
              >
                <Settings size={14} />
              </button>
            </div>
          </div>

          {/* Main layout */}
          <div className="flex gap-4 lg:gap-7 items-start">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex w-[300px] shrink-0 flex-col gap-[12px] sticky top-[84px]">
              {sidebarContent}
              <button
                onClick={() => setShowSettings(true)}
                className="vg-card flex items-center justify-center gap-2.5 rounded-[18px] transition-transform hover:-translate-y-px"
                style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: 'var(--vg-ink)', cursor: 'pointer' }}
              >
                <Settings size={16} strokeWidth={2.2} /> {t('vacay.settings')}
              </button>
            </div>

            {/* Calendar */}
            <div className="flex-1 min-w-0">
              <VacayCalendar />
            </div>
          </div>
        </div>

      {/* Mobile Sidebar Drawer */}
      {showMobileSidebar && ReactDOM.createPortal(
        <div className="fixed inset-0 lg:hidden" style={{ zIndex: 99980 }}>
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" onClick={() => setShowMobileSidebar(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] overflow-y-auto p-3 flex flex-col gap-3 bg-surface"
            style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.15)', animation: 'slideInLeft 0.2s ease-out' }}>
            {sidebarContent}
          </div>
        </div>,
        document.body
      )}

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title={t('vacay.settings')} size="3xl">
        <VacaySettings onClose={() => setShowSettings(false)} />
      </Modal>

      {/* Delete Year Modal */}
      <Modal isOpen={deleteYear !== null} onClose={() => setDeleteYear(null)} title={t('vacay.removeYear')} size="sm">
        <div className="space-y-4">
          <div className="flex gap-3 p-3 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)]">
            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-content">
                {t('vacay.removeYearConfirm', { year: deleteYear })}
              </p>
              <p className="text-xs mt-1 text-content-muted">
                {t('vacay.removeYearHint')}
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDeleteYear(null)} className="px-4 py-2 text-sm rounded-lg transition-colors border text-content-muted border-edge">
              {t('common.cancel')}
            </button>
            <button onClick={async () => { await removeYear(deleteYear); setDeleteYear(null) }} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
              {t('vacay.remove')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Incoming invite — forced fullscreen modal */}
      {incomingInvites.length > 0 && ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center px-4 bg-[rgba(0,0,0,0.7)]"
          style={{ zIndex: 99995, backdropFilter: 'blur(8px)' }}>
          {incomingInvites.map(inv => (
            <div key={inv.plan_id} className="trek-modal-enter w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-surface-card">
              <div className="px-6 pt-6 pb-4 text-center">
                <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-lg font-bold bg-surface-secondary text-content">
                  {inv.owner_username?.[0]?.toUpperCase()}
                </div>
                <h2 className="text-lg font-bold mb-1 text-content">
                  {t('vacay.inviteTitle')}
                </h2>
                <p className="text-sm text-content-muted">
                  <span className="font-semibold text-content">{inv.owner_username}</span> {t('vacay.inviteWantsToFuse')}
                </p>
              </div>
              <div className="px-6 pb-4 space-y-2">
                <InfoItem icon={Eye} text={t('vacay.fuseInfo1')} />
                <InfoItem icon={Pencil} text={t('vacay.fuseInfo2')} />
                <InfoItem icon={Trash2} text={t('vacay.fuseInfo3')} />
                <InfoItem icon={ShieldCheck} text={t('vacay.fuseInfo4')} />
                <InfoItem icon={Unlink} text={t('vacay.fuseInfo5')} />
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => declineInvite(inv.plan_id)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors border text-content-muted border-edge">
                  {t('vacay.decline')}
                </button>
                <button onClick={() => acceptInvite(inv.plan_id)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors bg-content text-surface-card">
                  {t('vacay.acceptFusion')}
                </button>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </PageShell>
  )
}

function InfoItem({ icon: Icon, text }: { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; text: string }): React.ReactElement {
  return (
    <div className="flex items-start gap-3 px-3 py-2 rounded-lg bg-surface-secondary">
      <Icon size={15} className="shrink-0 mt-0.5 text-content-muted" />
      <span className="text-xs text-content">{text}</span>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-[7px]">
      <span style={{ width: 18, height: 12, borderRadius: 4, flex: 'none', background: color }} />
      <span style={{ fontSize: 12, color: 'var(--vg-ink2)' }}>{label}</span>
    </span>
  )
}
