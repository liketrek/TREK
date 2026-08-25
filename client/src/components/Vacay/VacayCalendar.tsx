import { useMemo, useState, useCallback, useEffect } from 'react'
import { useVacayStore } from '../../store/vacayStore'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from '../../i18n'
import { isWeekend } from './holidays'
import { inGridWindow, windowMonths } from '../../vacay/yearWindow'
import { tripsApi } from '../../api/client'
import VacayMonthCard from './VacayMonthCard'
import type { VacayEntry } from '../../types'
import { Building2, MousePointer2 } from 'lucide-react'

type VacayMode = 'vacation' | 'company'
type HoverTip = { date: string; top: number; left: number }
export type SharedDayMark = { color: string; name: string; fraction?: number; company?: boolean; kind?: 'vacation' | 'comp' }

export default function VacayCalendar() {
  const { t, locale } = useTranslation()
  const { selectedYear, selectedUserId, entries, companyHolidays, toggleEntry, toggleCompanyHoliday, plan, users, holidays, sharedCalendars, yearSettings } = useVacayStore()
  const currentUserId = useAuthStore(s => s.user?.id)
  const [mode, setMode] = useState<VacayMode>('vacation')
  // Half-day is a per-person modifier on the vacation action, not a mode: with it
  // on, clicking a day logs (or converts) it as a 0.5 day for the selected person.
  const [halfDay, setHalfDay] = useState(false)
  // Comp/Flex day is a second per-person modifier (#1074), orthogonal to half-day:
  // with it on, clicking a day logs it as kind='comp' (does not cost the entitlement).
  const [compDay, setCompDay] = useState(false)
  const companyMode = mode === 'company'
  const [tripDates, setTripDates] = useState<Set<string>>(new Set())
  const [tip, setTip] = useState<HoverTip | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await tripsApi.list()
        const dates = new Set<string>()
        for (const trip of data.trips || []) {
          if (!trip.start_date || !trip.end_date) continue
          const start = new Date(trip.start_date + 'T00:00:00')
          const end = new Date(trip.end_date + 'T00:00:00')
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            // Keep the days the grid shows, which is the leave-year window (#737)
            // rather than the calendar year once the window is shifted.
            const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            if (inGridWindow(date, selectedYear, yearSettings)) dates.add(date)
          }
        }
        if (!cancelled) setTripDates(dates)
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [selectedYear, yearSettings])

  const companyHolidaySet = useMemo(() => {
    const s = new Set<string>()
    companyHolidays.forEach(h => s.add(h.date))
    return s
  }, [companyHolidays])

  const entryMap = useMemo(() => {
    const map: Record<string, VacayEntry[]> = {}
    entries.forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [entries])

  // Shared read-only calendars (#444/#667) render as colored rings, not fills,
  // so they never mix into the members' split logic — merged stays merged,
  // shared stays a distinct overlay.
  const sharedMap = useMemo(() => {
    const map: Record<string, SharedDayMark[]> = {}
    sharedCalendars.filter(c => !c.hidden).forEach(cal => {
      cal.entries.forEach(e => {
        if (!map[e.date]) map[e.date] = []
        map[e.date].push({ color: cal.color, name: cal.owner_name, fraction: e.fraction, kind: e.kind })
      })
      cal.companyHolidays.forEach(h => {
        if (!map[h.date]) map[h.date] = []
        map[h.date].push({ color: cal.color, name: cal.owner_name, company: true })
      })
    })
    return map
  }, [sharedCalendars])

  const blockWeekends = plan?.block_weekends !== false
  const weekendDays = useMemo<number[]>(() => (plan?.weekend_days ? String(plan.weekend_days).split(',').map(Number) : [0, 6]), [plan?.weekend_days])
  const companyHolidaysEnabled = plan?.company_holidays_enabled !== false

  const handleCellClick = useCallback(async (dateStr: string) => {
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
      const own = entryMap[dateStr]?.find(e => e.user_id === (selectedUserId ?? currentUserId))
      if (!own) return
      await toggleEntry(dateStr, selectedUserId || undefined, (own.fraction ?? 1) === 0.5 ? 0.5 : 1, own.kind ?? 'vacation')
      return
    }
    if (companyHolidaysEnabled && companyHolidaySet.has(dateStr)) return
    await toggleEntry(dateStr, selectedUserId || undefined, halfDay ? 0.5 : 1, compDay ? 'comp' : 'vacation')
  }, [mode, halfDay, compDay, toggleEntry, toggleCompanyHoliday, companyHolidaySet, blockWeekends, weekendDays, companyHolidaysEnabled, selectedUserId, currentUserId, entryMap])

  // Cells with a half day or a shared overlay report a hover, so the tooltip
  // appears exactly when there's something to explain. Fixed-positioned at the
  // root so no card clips it.
  const handleCellHover = useCallback((dateStr: string | null, el: HTMLElement | null) => {
    if (!dateStr || !el) { setTip(null); return }
    const r = el.getBoundingClientRect()
    setTip({ date: dateStr, top: r.top, left: r.left + r.width / 2 })
  }, [])

  const selectedUser = users.find(u => u.id === selectedUserId)
  // The toolbar modifiers preview what a click will put on the day, so the comp
  // hatch carries the selected person's colour just like the grid segment does.
  const markerColor = selectedUser?.color || '#6366f1'
  const tipEntries = tip ? entryMap[tip.date] : undefined
  const tipShared = tip ? sharedMap[tip.date] : undefined
  const tipHolidayRaw = tip ? holidays[tip.date] : undefined
  const tipSchool = (Array.isArray(tipHolidayRaw) ? tipHolidayRaw : tipHolidayRaw ? [tipHolidayRaw] : []).filter(h => h.type === 'school_holiday')
  const tipDate = tip ? new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date(tip.date + 'T00:00:00')) : ''

  // Label for a day's leave type + fraction (#552/#1074): full/half vacation or comp/flex.
  const dayTypeLabel = (fraction: number | undefined, kind: string | undefined) => {
    const half = (fraction ?? 1) === 0.5
    if (kind === 'comp') return half ? t('vacay.compHalf') : t('vacay.modeComp')
    return half ? t('vacay.modeHalf') : t('vacay.fullDay')
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]" style={{ paddingBottom: 'calc(var(--bottom-nav-h, 0px) + 80px)' }}>
        {/* Twelve months from the window start (#737), rolling over the calendar
            year when the leave year is shifted — Jul 2026 – Jun 2027 and so on. */}
        {windowMonths(selectedYear, yearSettings).map(({ year, month }) => (
          <VacayMonthCard
            key={`${year}-${month}`}
            year={year}
            month={month}
            holidays={holidays}
            companyHolidaySet={companyHolidaySet}
            companyHolidaysEnabled={companyHolidaysEnabled}
            entryMap={entryMap}
            sharedMap={sharedMap}
            onCellClick={handleCellClick}
            onCellHover={handleCellHover}
            companyMode={companyMode}
            blockWeekends={blockWeekends}
            weekendDays={weekendDays}
            tripDates={tripDates}
            weekStart={plan?.week_start ?? 1}
          />
        ))}
      </div>

      {/* Custom day tooltip — who is off on this date and how much (own members
          with half days, plus shared read-only calendars). Rendered fixed at the
          root (not inside a month card) so backdrop-filter stacking contexts
          can't clip or occlude it. */}
      {tip && ((tipEntries && tipEntries.length > 0) || (tipShared && tipShared.length > 0) || tipSchool.length > 0) && (
        <div
          className="vg-card rounded-xl"
          style={{ position: 'fixed', top: tip.top - 9, left: tip.left, transform: 'translate(-50%, -100%)', zIndex: 80, pointerEvents: 'none' }}
        >
          <div style={{ padding: '8px 11px', minWidth: 132 }}>
            <div className="capitalize" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--vg-ink3)', marginBottom: 5 }}>{tipDate}</div>
            {(tipEntries ?? []).map((e, i) => {
              const emphasized = (e.fraction ?? 1) === 0.5 || e.kind === 'comp'
              return (
                <div key={i} className="flex items-center gap-2" style={{ marginTop: i ? 4 : 0 }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.person_color || '#6366f1' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--vg-ink)' }}>{e.person_name}</span>
                  <span style={{ marginLeft: 'auto', paddingLeft: 12, fontSize: 11, fontWeight: 700, color: emphasized ? 'var(--vg-ink)' : 'var(--vg-ink3)' }}>
                    {dayTypeLabel(e.fraction, e.kind)}
                  </span>
                </div>
              )
            })}
            {/* Shared calendars: ring dot instead of a filled one, like the grid. */}
            {(tipShared ?? []).map((m, i) => (
              <div key={`s${i}`} className="flex items-center gap-2" style={{ marginTop: (tipEntries?.length || i) ? 4 : 0 }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ border: `2px solid ${m.color}` }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--vg-ink)' }}>{m.name}</span>
                <span style={{ marginLeft: 'auto', paddingLeft: 12, fontSize: 11, fontWeight: 700, color: 'var(--vg-ink3)' }}>
                  {m.company ? t('vacay.companyHoliday') : dayTypeLabel(m.fraction, m.kind)}
                </span>
              </div>
            ))}
            {/* School holidays fold into this tooltip under a divider instead of a
                separate native title, so a half/full day and the school break read together. */}
            {tipSchool.length > 0 && (
              <>
                {((tipEntries?.length ?? 0) > 0 || (tipShared?.length ?? 0) > 0) && (
                  <div style={{ height: 1, background: 'var(--vg-line)', margin: '7px 0 6px' }} />
                )}
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--vg-ink3)', marginBottom: 4 }}>
                  {t('vacay.schoolHolidays')}
                </div>
                {tipSchool.map((h, i) => (
                  <div key={`sch${i}`} className="flex items-center gap-2" style={{ marginTop: i ? 3 : 0 }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: h.color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--vg-ink)' }}>{h.label ? `${h.label}: ${h.localName}` : h.localName}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating toolbar — lift above the mobile bottom nav (z-60). On desktop --bottom-nav-h is 0px. */}
      <div className="sticky mt-3 sm:mt-4 flex items-center justify-center px-2" style={{ bottom: 'calc(var(--bottom-nav-h, 0px) + 12px)', zIndex: 61 }}>
        <div className="vg-card flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full">
          <button type="button"
            onClick={() => setMode('vacation')}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={mode === 'vacation'
              ? { background: 'var(--vg-ink)', color: 'var(--vg-bg)' }
              : { background: 'transparent', color: 'var(--vg-ink2)' }}>
            <MousePointer2 size={13} />
            {selectedUser && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedUser.color }} />}
            {selectedUser ? selectedUser.username : t('vacay.modeVacation')}
          </button>
          {companyHolidaysEnabled && (
            <button type="button"
              onClick={() => setMode('company')}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={companyMode
                ? { background: '#d97706', color: '#fff' }
                : { background: 'transparent', color: 'var(--vg-ink2)' }}>
              <Building2 size={13} />
              {t('vacay.modeCompany')}
            </button>
          )}

          {/* Divider — comp/flex and half-day are modifiers, not modes. */}
          <span className="w-px self-stretch my-0.5" style={{ background: 'var(--vg-line)' }} aria-hidden />

          <button type="button"
            onClick={() => setCompDay(v => !v)}
            title={t('vacay.modeCompHint')}
            aria-pressed={compDay}
            className="flex items-center gap-1.5 pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={compDay
              ? { background: 'var(--vg-ink)', color: 'var(--vg-bg)' }
              : { background: 'transparent', color: 'var(--vg-ink3)' }}>
            {/* A hatched disc in the person's colour — the same diagonal fill a comp
                day gets in the grid (#1074), so the toolbar previews the marker. */}
            <span className="rounded-full shrink-0"
              style={{
                width: 12, height: 12,
                background: `repeating-linear-gradient(45deg, ${markerColor} 0 2px, transparent 2px 4px)`,
                boxShadow: `inset 0 0 0 1px ${markerColor}`,
              }} aria-hidden />
            {t('vacay.modeComp')}
          </button>

          <button type="button"
            onClick={() => setHalfDay(v => !v)}
            title={t('vacay.modeHalfHint')}
            aria-pressed={halfDay}
            className="flex items-center gap-1.5 pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={halfDay
              ? { background: 'var(--vg-ink)', color: 'var(--vg-bg)' }
              : { background: 'transparent', color: 'var(--vg-ink3)' }}>
            {/* The same orange dot a half day carries in the grid (#552) — the
                toolbar showing the marker you are about to place reads quicker
                than a ½ glyph that appears nowhere on the calendar. */}
            <span className="rounded-full shrink-0 bg-[#f97316]" style={{ width: 12, height: 12 }} aria-hidden />
            {t('vacay.modeHalf')}
          </button>
        </div>
      </div>
    </div>
  )
}
