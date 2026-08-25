import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Clock, Pencil } from 'lucide-react'
import { useVacayStore } from '../../store/vacayStore'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../i18n'
import { windowMonths } from '../../vacay/yearWindow'
import type { VacayStat, TranslationFn } from '../../types'
import { NumericInput } from '../shared/NumericInput'
import VacayBadge from './VacayBadge'

// Used/remaining can be fractional once half days (#552) are in play; entry
// fractions are exact multiples of 0.5, so one decimal is enough and never drifts.
const fmtDays = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

// The sidebar card can be folded away; the choice is a personal view preference,
// so it lives in localStorage rather than on the plan.
const COLLAPSED_KEY = 'vacay-stats-collapsed'


export default function VacayStats() {
  const { t, locale } = useTranslation()
  const { stats, selectedYear, loadStats, updateVacationDays, isFused, yearSettings } = useVacayStore()
  const { user: currentUser } = useAuthStore()
  const isShiftedYear = yearSettings.year_type !== 'calendar'
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === '1' } catch { return false }
  })

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0') } catch { /* storage unavailable */ }
      return next
    })
  }

  useEffect(() => { loadStats(selectedYear) }, [selectedYear])

  // A shifted leave year (#737) doesn't line up with the year number, so spell the
  // period out — "2026" alone would read as Jan–Dec.
  const windowLabel = useMemo(() => {
    if (!isShiftedYear) return null
    const months = windowMonths(selectedYear, yearSettings)
    const fmt = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' })
    return `${fmt.format(new Date(months[0].year, months[0].month, 1))} – ${fmt.format(new Date(months[11].year, months[11].month, 1))}`
  }, [isShiftedYear, selectedYear, yearSettings, locale])

  return (
    <div className="vg-card rounded-[22px]" style={{ padding: '14px 18px' }}>
      {/* The whole header is the fold handle — the sidebar gets long once several
          people are fused in, and this card is the one you stop needing. */}
      <button type="button"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        className={`w-full flex items-start gap-2 text-left ${collapsed ? '' : 'mb-2.5'}`}
        style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', font: 'inherit' }}
      >
        <span className="min-w-0 flex-1">
          <span className="block" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--vg-ink3)' }}>
            {t('vacay.entitlement')} {selectedYear}
          </span>
          {windowLabel && (
            <span className="block mt-0.5" style={{ fontSize: 10.5, color: 'var(--vg-ink3)' }}>{windowLabel}</span>
          )}
        </span>
        <ChevronDown
          size={14}
          className="shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ color: 'var(--vg-ink3)', marginTop: 1, transform: collapsed ? 'rotate(-90deg)' : 'none' }}
        />
      </button>

      {!collapsed && (stats.length === 0 ? (
        <p className="text-[11px] text-center py-3" style={{ color: 'var(--vg-ink3)' }}>{t('vacay.noData')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {stats.map(s => (
            <StatCard
              key={s.user_id}
              stat={s}
              isMe={s.user_id === currentUser?.id}
              canEdit={s.user_id === currentUser?.id || isFused}
              selectedYear={selectedYear}
              isShiftedYear={isShiftedYear}
              onSave={updateVacationDays}
              t={t}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

interface StatCardProps {
  stat: VacayStat
  isMe: boolean
  canEdit: boolean
  selectedYear: number
  isShiftedYear: boolean
  onSave: (year: number, days: number, targetUserId: number) => Promise<void>
  t: TranslationFn
}

function StatCard({ stat: s, isMe, canEdit, selectedYear, isShiftedYear, onSave, t }: StatCardProps) {
  const [editing, setEditing] = useState(false)
  // Holds the entitlement-day value while editing: a number on load, a string
  // once the user types into the number input.
  const [localDays, setLocalDays] = useState<number | string>(s.vacation_days)
  const pct = s.total_available > 0 ? Math.min(100, (s.used / s.total_available) * 100) : 0

  // Sync local state when stats reload from server
  useEffect(() => {
    if (!editing) setLocalDays(s.vacation_days)
  }, [s.vacation_days, editing])

  const handleSave = () => {
    setEditing(false)
    const days = Number.parseInt(String(localDays))
    if (!Number.isNaN(days) && days >= 0 && days <= 365 && days !== s.vacation_days) {
      onSave(selectedYear, days, s.user_id)
    }
  }

  const remainingColor = s.remaining < 0 ? '#ef4444' : s.remaining <= 3 ? '#f59e0b' : '#22c55e'
  const compUsed = s.comp_used ?? 0
  // Each member can be on their own leave year (#737), so the row is labelled from
  // the window the server counted THIS row over. Only when that is missing (an
  // older server) does it fall back to the viewer's own setting.
  const rowShifted = s.window_start
    ? !s.window_start.endsWith('-01-01')
    : isShiftedYear
  // With a shifted leave year the carry-over comes from the previous period, which
  // is not the previous calendar year — name it that way instead.
  const carriedOverLabel = rowShifted
    ? t('vacay.carriedOverPrevPeriod')
    : t('vacay.carriedOver', { year: selectedYear - 1 })
  const tileValue = { fontFamily: 'var(--font-subtext)', fontSize: 14, fontWeight: 700, height: 16, lineHeight: '16px' } as const

  return (
    <div style={{ padding: 10, borderRadius: 14, border: '1px solid var(--vg-line)' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.person_color }} />
        <span className="truncate min-w-0" style={{ fontSize: 13, fontWeight: 700, color: 'var(--vg-ink)' }}>
          {s.person_name}
        </span>
        {isMe && <VacayBadge label={t('vacay.you')} />}
        <span className="tabular-nums ml-auto" style={{ fontFamily: 'var(--font-subtext)', fontSize: 10.5, color: 'var(--vg-ink3)' }}>{fmtDays(s.used)}/{s.total_available}</span>
      </div>
      <div className="overflow-hidden" style={{ height: 6, borderRadius: 99, background: 'var(--vg-surf2)', marginBottom: 7 }}>
        <div
          className="trek-bar-fill h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ width: `${pct}%`, backgroundColor: s.person_color }}
        />
      </div>
      <div className="grid grid-cols-3" style={{ gap: 7 }}>
        {/* Days — editable */}
        <div
          className="group/days"
          style={{ padding: '6px 9px', borderRadius: 10, background: 'var(--vg-surf2)', cursor: canEdit ? 'pointer' : 'default' }}
          onClick={() => { if (canEdit && !editing) setEditing(true) }}
          role={canEdit && !editing ? 'button' : undefined}
          tabIndex={canEdit && !editing ? 0 : undefined}
          onKeyDown={canEdit && !editing ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setEditing(true) } } : undefined}
        >
          <div style={{ fontSize: 10, marginBottom: 2, color: 'var(--vg-ink3)', height: 13, lineHeight: '13px' }}>
            {t('vacay.entitlementDays')} {canEdit && !editing && <Pencil size={9} className="inline opacity-0 group-hover/days:opacity-100 transition-opacity" style={{ verticalAlign: 'middle', color: 'var(--vg-ink3)' }} />}
          </div>
          {editing ? (
            <NumericInput
              value={localDays}
              onValueChange={setLocalDays}
              onBlur={handleSave}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setLocalDays(s.vacation_days) } }}
              autoFocus
              className="w-full bg-transparent outline-none p-0 m-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              style={{ ...tileValue, color: 'var(--vg-ink)' }}
            />
          ) : (
            <div style={{ ...tileValue, color: 'var(--vg-ink)' }}>{s.vacation_days}</div>
          )}
        </div>
        {/* Used */}
        <div style={{ padding: '6px 9px', borderRadius: 10, background: 'var(--vg-surf2)' }}>
          <div style={{ fontSize: 10, marginBottom: 2, color: 'var(--vg-ink3)', height: 13, lineHeight: '13px' }}>{t('vacay.used')}</div>
          <div style={{ ...tileValue, color: 'var(--vg-ink)' }}>{fmtDays(s.used)}</div>
        </div>
        {/* Remaining */}
        <div style={{ padding: '6px 9px', borderRadius: 10, background: 'var(--vg-surf2)' }}>
          <div style={{ fontSize: 10, marginBottom: 2, color: 'var(--vg-ink3)', height: 13, lineHeight: '13px' }}>{t('vacay.remaining')}</div>
          <div style={{ ...tileValue, color: remainingColor }}>{fmtDays(s.remaining)}</div>
        </div>
      </div>
      {(s.carried_over > 0 || compUsed > 0) && (
        <div className="flex flex-wrap items-center gap-1.5" style={{ marginTop: 10 }}>
          {s.carried_over > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)]">
              <span className="text-[10px] text-[#d97706]">+{s.carried_over} {carriedOverLabel}</span>
            </div>
          )}
          {/* Comp / flex days (#1074) are logged but never deducted, so they sit
              beside the tiles rather than inside the used/left arithmetic. */}
          {compUsed > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: 'var(--vg-surf2)', border: '1px solid var(--vg-line)' }}>
              <Clock size={9} style={{ color: 'var(--vg-ink3)' }} />
              <span className="text-[10px]" style={{ color: 'var(--vg-ink2)' }}>{t('vacay.compUsedCount', { count: fmtDays(compUsed) })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
