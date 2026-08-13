import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useVacay } from '../../../pages/vacay/useVacay'
import { useVacayStore } from '../../../store/vacayStore'
import { useAuthStore } from '../../../store/authStore'
import { useTranslation } from '../../../i18n'
import { useToast } from '../../../components/shared/Toast'
import { tripsApi } from '../../../api/client'
import { isWeekend } from '../../../components/Vacay/holidays'
import { currentPeriodYear, inGridWindow, windowMonths } from '../../../vacay/yearWindow'
import { FALLBACK_PERSON_COLOR, localDateStr, type DayVisualContext } from './vacayDayModel'
import { getApiErrorMessage, type Trip } from '../../../types'

export type MVacayView = 'grid' | 'edit'
export type MVacayMode = 'vacation' | 'company'
export type MVacaySheet = 'invite' | 'settings' | 'share' | null

/**
 * Screen state of the mobile Vacay experience. Data loading, WebSocket sync
 * and the per-year reloads come from the shared useVacay() page hook; this
 * hook adds the phone-only UI state (year grid vs. single-month edit, log
 * mode, sheets) plus the derived per-day render context.
 */
export function useMVacay() {
  const { t, locale } = useTranslation()
  const toast = useToast()
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
    incomingShares, sharedCalendars, setShareHidden, yearSettings,
  } = useVacayStore()
  const currentUser = useAuthStore(s => s.user)

  const [view, setView] = useState<MVacayView>('grid')
  // Index into the window's twelve months (#737), not a calendar month — with a
  // fiscal year starting in July, slot 0 is July and slot 11 is the following June.
  const [monthSlot, setMonthSlot] = useState(0)
  const [mode, setMode] = useState<MVacayMode>('vacation')
  // Half-day modifier: when on, taps log the selected person's day as 0.5 (#552).
  const [halfDay, setHalfDay] = useState(false)
  // Comp/Flex day modifier (#1074): when on, taps log the day as kind='comp' (free).
  const [compDay, setCompDay] = useState(false)
  const [sheet, setSheet] = useState<MVacaySheet>(null)
  const [tripDates, setTripDates] = useState<Set<string>>(new Set())

  // The leave-year window's shape as a primitive. loadAll() hands back a fresh
  // (deep-equal) settings object every refresh, so effects key on this instead of
  // the object and stop re-firing when nothing about the window actually changed.
  const windowShape = `${yearSettings.year_type}|${yearSettings.year_start_month}|${yearSettings.year_start_day}|${yearSettings.hire_date}`

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
            // The grid covers the leave-year window (#737), which is only the
            // calendar year while the window is unshifted.
            const date = localDateStr(d.getFullYear(), d.getMonth(), d.getDate())
            if (inGridWindow(date, selectedYear, yearSettings)) dates.add(date)
          }
        }
        if (!cancelled) setTripDates(dates)
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, windowShape])

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

  // Shared read-only calendars (#444/#667) overlay as rings; hidden ones stay out.
  const sharedMap = useMemo(() => {
    const map: Record<string, { color: string }[]> = {}
    sharedCalendars.filter(c => !c.hidden).forEach(cal => {
      const push = (date: string) => {
        if (!map[date]) map[date] = []
        map[date].push({ color: cal.color })
      }
      cal.entries.forEach(e => push(e.date))
      cal.companyHolidays.forEach(h => push(h.date))
    })
    return map
  }, [sharedCalendars])

  const dayCtx = useMemo<DayVisualContext>(() => ({
    todayStr, entryMap, companyHolidaySet, companyHolidaysEnabled, holidays, weekendDays, sharedMap,
  }), [todayStr, entryMap, companyHolidaySet, companyHolidaysEnabled, holidays, weekendDays, sharedMap])

  // The twelve months the window spans, in display order — Jan–Dec for a calendar
  // year, Jul–Jun for a fiscal one starting in July (#737).
  const months = useMemo(() => windowMonths(selectedYear, yearSettings), [selectedYear, yearSettings])
  const activeMonth = months[monthSlot] ?? months[0]

  // Land on the month the user is actually in. Keyed on the window *shape*, not on
  // the settings object: loadAll() replaces that object with a deep-equal copy on
  // every refresh, and re-running here would throw away the month the user picked.
  useEffect(() => {
    const now = new Date()
    const idx = windowMonths(currentPeriodYear(yearSettings, now), yearSettings)
      .findIndex(m => m.year === now.getFullYear() && m.month === now.getMonth())
    setMonthSlot(idx >= 0 ? idx : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowShape])

  const monthNamesShort = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'short' })
    return months.map(({ year, month }) => fmt.format(new Date(year, month, 1)))
  }, [locale, months])

  const monthNameLong = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(activeMonth.year, activeMonth.month, 1)),
    [locale, activeMonth],
  )

  const selectedUser = users.find(u => u.id === selectedUserId)
  const selectedColor = selectedUser?.color || FALLBACK_PERSON_COLOR
  const selectedStat = stats.find(s => s.user_id === selectedUserId)

  // Shared-chip tap: the optimistic hide toggle rolls back on server errors —
  // tell the user instead of letting the chip snap back silently.
  const toggleShareHidden = useCallback((shareId: number, hidden: boolean) => {
    setShareHidden(shareId, hidden).catch((err: unknown) => toast.error(getApiErrorMessage(err, t('vacay.shareFailed'))))
  }, [setShareHidden, toast, t])

  // Fusion: logging for each other — any fused member is selectable.
  const selectPerson = useCallback((id: number) => {
    if (isFused || id === currentUser?.id) {
      setSelectedUserId(id)
      setMode('vacation')
    }
  }, [isFused, currentUser?.id, setSelectedUserId])

  // Zoom the year overview into one month's editor (#1811). The overview used to
  // swallow every tap, leaving the pen FAB as the only way in; it is a way in
  // itself now, while its ~21px mini cells stay out of data changes.
  const openMonthSlot = useCallback((slot: number) => {
    setMonthSlot(slot)
    setView('edit')
  }, [])

  const handleDayTap = useCallback(async (dateStr: string) => {
    // Outside edit mode a tap navigates instead of logging: it opens the month
    // the day belongs to, where the cells are big enough to hit reliably (#1811).
    if (view !== 'edit') {
      const [year, month] = dateStr.split('-').map(Number)
      // Resolved against the window months, not the calendar month: with a
      // shifted leave year (#737) slot 0 is not January.
      const slot = months.findIndex(m => m.year === year && m.month === month - 1)
      if (slot >= 0) openMonthSlot(slot)
      return
    }
    if (mode === 'company') {
      if (!companyHolidaysEnabled) return
      await toggleCompanyHoliday(dateStr)
      return
    }
    if (blockWeekends && isWeekend(dateStr, weekendDays)) {
      // A day already logged when the weekend config changed under it (#1897) keeps
      // counting against the entitlement, so clearing it stays possible — with the
      // entry's own fraction/kind, since the server only allows the delete on a
      // blocked day, not a conversion. Logging a new one stays blocked.
      const own = entryMap[dateStr]?.find(e => e.user_id === (selectedUserId ?? currentUser?.id))
      if (!own) return
      await toggleEntry(dateStr, selectedUserId || undefined, (own.fraction ?? 1) === 0.5 ? 0.5 : 1, own.kind ?? 'vacation')
      return
    }
    if (companyHolidaysEnabled && companyHolidaySet.has(dateStr)) return
    await toggleEntry(dateStr, selectedUserId || undefined, halfDay ? 0.5 : 1, compDay ? 'comp' : 'vacation')
  }, [view, months, openMonthSlot, mode, halfDay, compDay, companyHolidaysEnabled, blockWeekends, weekendDays, companyHolidaySet, toggleEntry, toggleCompanyHoliday, selectedUserId, currentUser?.id, entryMap])

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

  // Wrapping happens on the slot, so a shifted window rolls Dec → Jan inside the
  // period instead of jumping back to January of the calendar year.
  const prevMonth = useCallback(() => setMonthSlot(s => (s + 11) % 12), [])
  const nextMonth = useCallback(() => setMonthSlot(s => (s + 1) % 12), [])
  const toggleView = useCallback(() => setView(v => (v === 'grid' ? 'edit' : 'grid')), [])
  const goBack = useCallback(() => navigate('/dashboard'), [navigate])

  const tripDotColor = users.find(u => u.id === currentUser?.id)?.color || 'var(--m-st-info)'

  return {
    loading, plan, selectedYear,
    users, isFused, currentUser,
    incomingInvites, acceptInvite, declineInvite,
    incomingShares, toggleShareHidden,
    view, months, monthSlot, activeMonth, isShiftedYear: yearSettings.year_type !== 'calendar',
    mode, halfDay, setHalfDay, compDay, setCompDay, sheet, setSheet, setMode, setMonthSlot,
    tripDates, tripDotColor,
    blockWeekends, companyHolidaysEnabled, holidaysEnabled, weekStart, weekendDays,
    dayCtx, monthNamesShort, monthNameLong,
    selectedUser, selectedColor, selectedStat, selectedUserId, selectPerson,
    handleDayTap, openMonthSlot, allowInc, allowDec,
    prevYear, nextYear, prevMonth, nextMonth, toggleView, goBack,
  }
}
