import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useVacayStore } from '../../store/vacayStore'
import { addListener, removeListener } from '../../api/websocket'
import { useToast } from '../../components/shared/Toast'
import { useTranslation } from '../../i18n'
import { getApiErrorMessage } from '../../utils/apiError'

/** How long vacay events are collected before the page reads once. */
const WS_RELOAD_SETTLE_MS = 400
/** The longest a steady stream of events can put the read off. */
const WS_RELOAD_MAX_WAIT_MS = 2000

/** What a vacay event makes the page read again: the plan year, the whole state, the shares. */
type VacayReload = 'plan' | 'all' | 'shares'

/** The year a link opens Vacay on (`/vacay?year=2026`, from the assistant); none for anything else. */
function linkedYear(value: string | null): number | undefined {
  const year = Number(value)
  return value !== null && Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : undefined
}

const VACAY_RELOADS: Record<string, readonly VacayReload[]> = {
  'vacay:update': ['plan'],
  'vacay:settings': ['plan', 'all'],
  'vacay:invite': ['all'],
  'vacay:accepted': ['all'],
  'vacay:declined': ['all'],
  'vacay:cancelled': ['all'],
  'vacay:dissolved': ['all'],
  'vacay:share': ['shares'],
  'vacay:share-removed': ['shares'],
  'vacay:shared-update': ['shares'],
}

/**
 * Vacay page logic — pulls the vacay store, owns the page-local UI state
 * (settings modal, delete-year prompt, mobile drawer), wires the WebSocket live
 * sync and the per-year (re)loads, and exposes the add-prev/next-year helpers.
 * VacayPage stays a wiring container around its sidebar/calendar JSX.
 * Behaviour is identical to the previous in-component logic.
 */
export function useVacay() {
  const { years, selectedYear, setSelectedYear, addYear, removeYear, loadAll, loadPlan, loadEntries, loadStats, loadHolidays, loadShares, loadSharedCalendars, loading, incomingInvites, acceptInvite, declineInvite, plan, sharedCalendars } = useVacayStore()
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [deleteYear, setDeleteYear] = useState<number | null>(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false)
  const toast = useToast()
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  // Read once: the first load opens the linked year when the plan has it, later reloads keep the viewer's.
  const [preferredYear] = useState(() => linkedYear(searchParams.get('year')))

  useEffect(() => { loadAll(preferredYear) }, [])

  // Live sync via WebSocket. An agent marking days one by one over MCP sends one
  // event per day, so the reads wait until the events stop (or two seconds pass)
  // and then run once, for whatever year is selected by that time (#2559).
  const pendingReloads = useRef<Set<VacayReload>>(new Set())
  const wsReloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const burstStartedAt = useRef<number | null>(null)

  // An effect event sees the latest render, so the year is the one selected now.
  const flushReloads = useEffectEvent(() => {
    const due = pendingReloads.current
    pendingReloads.current = new Set()
    const year = selectedYear
    if (due.has('plan')) {
      loadPlan()
      loadEntries(year)
      loadStats(year)
    }
    if (due.has('all')) loadAll()
    if (due.has('shares')) {
      loadShares()
      loadSharedCalendars(year)
    }
  })

  useEffect(() => {
    const handleWsMessage = (msg: { type: string }) => {
      const reloads = VACAY_RELOADS[msg.type]
      if (!reloads) return
      reloads.forEach(r => pendingReloads.current.add(r))
      // Each event restarts the wait, but never past the cap counted from the
      // burst's first event, so events closer than the settle time still land.
      const now = Date.now()
      burstStartedAt.current ??= now
      const wait = Math.max(0, Math.min(WS_RELOAD_SETTLE_MS, burstStartedAt.current + WS_RELOAD_MAX_WAIT_MS - now))
      if (wsReloadTimer.current !== null) clearTimeout(wsReloadTimer.current)
      wsReloadTimer.current = setTimeout(() => {
        wsReloadTimer.current = null
        burstStartedAt.current = null
        flushReloads()
      }, wait)
    }
    addListener(handleWsMessage)
    return () => {
      removeListener(handleWsMessage)
      if (wsReloadTimer.current !== null) clearTimeout(wsReloadTimer.current)
    }
  }, [])
  useEffect(() => {
    if (selectedYear) { loadEntries(selectedYear); loadStats(selectedYear); loadHolidays(selectedYear); loadSharedCalendars(selectedYear) }
  }, [selectedYear])

  // The confirm closes as it is answered, so a removal that fails says so here.
  const removeYearReported = async (year: number | null) => {
    if (year == null) return
    try {
      await removeYear(year)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
  }

  const handleAddNextYear = () => {
    const nextYear = years.length > 0 ? Math.max(...years) + 1 : new Date().getFullYear()
    addYear(nextYear)
  }

  const handleAddPrevYear = () => {
    const prevYear = years.length > 0 ? Math.min(...years) - 1 : new Date().getFullYear()
    addYear(prevYear)
  }

  return {
    years, selectedYear, setSelectedYear, removeYear: removeYearReported, loading,
    incomingInvites, acceptInvite, declineInvite, plan, sharedCalendars,
    showSettings, setShowSettings, deleteYear, setDeleteYear,
    showMobileSidebar, setShowMobileSidebar,
    handleAddNextYear, handleAddPrevYear,
  }
}
