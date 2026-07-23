import { useMemo, useState, useCallback, useEffect } from 'react'
import { useVacayStore } from '../../store/vacayStore'
import { useTranslation } from '../../i18n'
import { isWeekend } from './holidays'
import { tripsApi } from '../../api/client'
import VacayMonthCard from './VacayMonthCard'
import type { VacayEntry } from '../../types'
import { Building2, MousePointer2 } from 'lucide-react'

type VacayMode = 'vacation' | 'company'
type HoverTip = { date: string; top: number; left: number }
export type SharedDayMark = { color: string; name: string; fraction?: number; company?: boolean }

export default function VacayCalendar() {
  const { t, locale } = useTranslation()
  const { selectedYear, selectedUserId, entries, companyHolidays, toggleEntry, toggleCompanyHoliday, plan, users, holidays, sharedCalendars } = useVacayStore()
  const [mode, setMode] = useState<VacayMode>('vacation')
  // Half-day is a per-person modifier on the vacation action, not a mode: with it
  // on, clicking a day logs (or converts) it as a 0.5 day for the selected person.
  const [halfDay, setHalfDay] = useState(false)
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
            const y = d.getFullYear()
            if (y === selectedYear) {
              dates.add(`${y}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
            }
          }
        }
        if (!cancelled) setTripDates(dates)
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [selectedYear])

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
        map[e.date].push({ color: cal.color, name: cal.owner_name, fraction: e.fraction })
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
    if (blockWeekends && isWeekend(dateStr, weekendDays)) return
    if (companyHolidaysEnabled && companyHolidaySet.has(dateStr)) return
    await toggleEntry(dateStr, selectedUserId || undefined, halfDay ? 0.5 : 1)
  }, [mode, halfDay, toggleEntry, toggleCompanyHoliday, companyHolidaySet, blockWeekends, weekendDays, companyHolidaysEnabled, selectedUserId])

  // Cells with a half day or a shared overlay report a hover, so the tooltip
  // appears exactly when there's something to explain. Fixed-positioned at the
  // root so no card clips it.
  const handleCellHover = useCallback((dateStr: string | null, el: HTMLElement | null) => {
    if (!dateStr || !el) { setTip(null); return }
    const r = el.getBoundingClientRect()
    setTip({ date: dateStr, top: r.top, left: r.left + r.width / 2 })
  }, [])

  const selectedUser = users.find(u => u.id === selectedUserId)
  const tipEntries = tip ? entryMap[tip.date] : undefined
  const tipShared = tip ? sharedMap[tip.date] : undefined
  const tipHolidayRaw = tip ? holidays[tip.date] : undefined
  const tipSchool = (Array.isArray(tipHolidayRaw) ? tipHolidayRaw : tipHolidayRaw ? [tipHolidayRaw] : []).filter(h => h.type === 'school_holiday')
  const tipDate = tip ? new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'long' }).format(new Date(tip.date + 'T00:00:00')) : ''

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[18px]" style={{ paddingBottom: 'calc(var(--bottom-nav-h, 0px) + 80px)' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <VacayMonthCard
            key={i}
            year={selectedYear}
            month={i}
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
              const isHalf = (e.fraction ?? 1) === 0.5
              return (
                <div key={i} className="flex items-center gap-2" style={{ marginTop: i ? 4 : 0 }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.person_color || '#6366f1' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--vg-ink)' }}>{e.person_name}</span>
                  <span style={{ marginLeft: 'auto', paddingLeft: 12, fontSize: 11, fontWeight: 700, color: isHalf ? 'var(--vg-ink)' : 'var(--vg-ink3)' }}>
                    {isHalf ? t('vacay.modeHalf') : t('vacay.fullDay')}
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
                  {m.company ? t('vacay.companyHoliday') : (m.fraction ?? 1) === 0.5 ? t('vacay.modeHalf') : t('vacay.fullDay')}
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
          <button
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
            <button
              onClick={() => setMode('company')}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={companyMode
                ? { background: '#d97706', color: '#fff' }
                : { background: 'transparent', color: 'var(--vg-ink2)' }}>
              <Building2 size={13} />
              {t('vacay.modeCompany')}
            </button>
          )}

          {/* Divider — the half-day switch is a modifier, not a mode. */}
          <span className="w-px self-stretch my-0.5" style={{ background: 'var(--vg-line)' }} aria-hidden />

          <button
            onClick={() => setHalfDay(v => !v)}
            title={t('vacay.modeHalfHint')}
            aria-pressed={halfDay}
            className="flex items-center gap-1.5 pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={halfDay
              ? { background: 'var(--vg-ink)', color: 'var(--vg-bg)' }
              : { background: 'transparent', color: 'var(--vg-ink3)' }}>
            <span className="flex items-center justify-center rounded-full shrink-0 transition-colors"
              style={{
                width: 15, height: 15, fontSize: 10, fontWeight: 800, lineHeight: 1,
                background: halfDay ? 'var(--vg-bg)' : 'color-mix(in srgb, var(--vg-ink3) 22%, transparent)',
                color: halfDay ? 'var(--vg-ink)' : 'var(--vg-ink2)',
              }} aria-hidden>½</span>
            {t('vacay.modeHalf')}
          </button>
        </div>
      </div>
    </div>
  )
}
