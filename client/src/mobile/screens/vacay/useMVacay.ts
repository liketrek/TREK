import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVacay } from '../../../pages/vacay/useVacay'
import { useVacayStore } from '../../../store/vacayStore'
import { useAuthStore } from '../../../store/authStore'
import { useTranslation } from '../../../i18n'
import { tripsApi } from '../../../api/client'
import { isWeekend } from '../../../components/Vacay/holidays'
import { FALLBACK_PERSON_COLOR, localDateStr, type DayVisualContext } from './vacayDayModel'
import type { Trip } from '../../../types'

export type MVacayView = 'grid' | 'edit'
export type MVacayMode = 'vacation' | 'company'
export type MVacaySheet = 'invite' | 'settings' | null

/**
 * Screen state of the mobile Vacay experience. Data loading, WebSocket sync
 * and the per-year reloads come from the shared useVacay() page hook; this
 * hook adds the phone-only UI state (year grid vs. single-month edit, log
 * mode, sheets) plus the derived per-day render context.
 */
export function useMVacay() {
  const { locale } = useTranslation()
  const navigate = useNavigate()
  const {
    years, selectedYear, setSelectedYear, loading,
    incomingInvites, acceptInvite, declineInvite, plan,
    handleAddNextYear, handleAddPrevYear,
  } = useVacay()
  const {
    entries, companyHolidays, stats, users, holidays,
    selectedUserId, setSelectedUserId, isFused,
    toggleEntry, toggleCompanyHoliday, updateVacationDays,
  } = useVacayStore()
  const currentUser = useAuthStore(s => s.user)

  const [view, setView] = useState<MVacayView>('grid')
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [mode, setMode] = useState<MVacayMode>('vacation')
  // Half-day modifier: when on, taps log the selected person's day as 0.5 (#552).
  const [halfDay, setHalfDay] = useState(false)
  const [sheet, setSheet] = useState<MVacaySheet>(null)
  const [tripDates, setTripDates] = useState<Set<string>>(new Set())

  // Default the active person to the current user (same as the persons panel).
  useEffect(() => {
    if (!selectedUserId && currentUser) setSelectedUserId(currentUser.id)
  }, [currentUser, selectedUserId, setSelectedUserId])

  // Trip-overlap dots: collect every day of the year covered by an own trip.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await tripsApi.list()
        const dates = new Set<string>()
        for (const trip of (data.trips || []) as Trip[]) {
          if (!trip.start_date || !trip.end_date) continue
          const start = new Date(trip.start_date + 'T00:00:00')
          const end = new Date(trip.end_date + 'T00:00:00')
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (d.getFullYear() === selectedYear) {
              dates.add(localDateStr(d.getFullYear(), d.getMonth(), d.getDate()))
            }
          }
        }
        if (!cancelled) setTripDates(dates)
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [selectedYear])

  const blockWeekends = plan?.block_weekends !== false
  const companyHolidaysEnabled = plan?.company_holidays_enabled !== false
  const holidaysEnabled = plan?.holidays_enabled === true
  const weekStart = plan?.week_start ?? 1
  const weekendDays = useMemo<number[]>(
    () => (plan?.weekend_days ? String(plan.weekend_days).split(',').map(Number) : [0, 6]),
    [plan?.weekend_days],
  )

  const companyHolidaySet = useMemo(() => new Set(companyHolidays.map(h => h.date)), [companyHolidays])

  const entryMap = useMemo(() => {
    const map: DayVisualContext['entryMap'] = {}
    entries.forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [entries])

  const todayStr = useMemo(() => {
    const d = new Date()
    return localDateStr(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])

  const dayCtx = useMemo<DayVisualContext>(() => ({
    todayStr, entryMap, companyHolidaySet, companyHolidaysEnabled, holidays, weekendDays,
  }), [todayStr, entryMap, companyHolidaySet, companyHolidaysEnabled, holidays, weekendDays])

  const monthNamesShort = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'short' })
    return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2026, i, 1)))
  }, [locale])

  const monthNameLong = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(selectedYear, month, 1)),
    [locale, selectedYear, month],
  )

  const selectedUser = users.find(u => u.id === selectedUserId)
  const selectedColor = selectedUser?.color || FALLBACK_PERSON_COLOR
  const selectedStat = stats.find(s => s.user_id === selectedUserId)

  // Fusion: logging for each other — any fused member is selectable.
  const selectPerson = useCallback((id: number) => {
    if (isFused || id === currentUser?.id) {
      setSelectedUserId(id)
      setMode('vacation')
    }
  }, [isFused, currentUser?.id, setSelectedUserId])

  const handleDayTap = useCallback(async (dateStr: string) => {
    // The year overview is read-only — logging only happens in edit mode
    // (neither vacation days nor company holidays can be set while viewing).
    if (view !== 'edit') return
    if (mode === 'company') {
      if (!companyHolidaysEnabled) return
      await toggleCompanyHoliday(dateStr)
      return
    }
    if (blockWeekends && isWeekend(dateStr, weekendDays)) return
    if (companyHolidaysEnabled && companyHolidaySet.has(dateStr)) return
    await toggleEntry(dateStr, selectedUserId || undefined, halfDay ? 0.5 : 1)
  }, [view, mode, halfDay, companyHolidaysEnabled, blockWeekends, weekendDays, companyHolidaySet, toggleEntry, toggleCompanyHoliday, selectedUserId])

  // Entitlement stepper: never below what is already used this year
  // (carried-over days cover the difference when used > entitlement).
  const allowInc = useCallback(() => {
    if (!selectedStat || !selectedUserId) return
    updateVacationDays(selectedYear, Math.min(365, selectedStat.vacation_days + 1), selectedUserId)
  }, [selectedStat, selectedUserId, selectedYear, updateVacationDays])

  const allowDec = useCallback(() => {
    if (!selectedStat || !selectedUserId) return
    const min = Math.max(0, selectedStat.used - selectedStat.carried_over)
    if (selectedStat.vacation_days > min) {
      updateVacationDays(selectedYear, selectedStat.vacation_days - 1, selectedUserId)
    }
  }, [selectedStat, selectedUserId, selectedYear, updateVacationDays])

  // Year switcher; stepping past the newest/oldest plan creates that year.
  const prevYear = useCallback(async () => {
    const idx = years.indexOf(selectedYear)
    if (idx > 0) setSelectedYear(years[idx - 1])
    else { await handleAddPrevYear(); setSelectedYear(selectedYear - 1) }
  }, [years, selectedYear, setSelectedYear, handleAddPrevYear])

  const nextYear = useCallback(async () => {
    const idx = years.indexOf(selectedYear)
    if (idx >= 0 && idx < years.length - 1) setSelectedYear(years[idx + 1])
    else { await handleAddNextYear(); setSelectedYear(selectedYear + 1) }
  }, [years, selectedYear, setSelectedYear, handleAddNextYear])

  const prevMonth = useCallback(() => setMonth(m => (m + 11) % 12), [])
  const nextMonth = useCallback(() => setMonth(m => (m + 1) % 12), [])
  const toggleView = useCallback(() => setView(v => (v === 'grid' ? 'edit' : 'grid')), [])
  const goBack = useCallback(() => navigate('/dashboard'), [navigate])

  const tripDotColor = users.find(u => u.id === currentUser?.id)?.color || 'var(--m-st-info)'

  return {
    loading, plan, selectedYear,
    users, isFused, currentUser,
    incomingInvites, acceptInvite, declineInvite,
    view, month, mode, halfDay, setHalfDay, sheet, setSheet, setMode, setMonth,
    tripDates, tripDotColor,
    blockWeekends, companyHolidaysEnabled, holidaysEnabled, weekStart, weekendDays,
    dayCtx, monthNamesShort, monthNameLong,
    selectedUser, selectedColor, selectedStat, selectedUserId, selectPerson,
    handleDayTap, allowInc, allowDec,
    prevYear, nextYear, prevMonth, nextMonth, toggleView, goBack,
  }
}
