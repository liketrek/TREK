import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { findFocusDayId, findTodayDayId } from '../../../components/Planner/today'
import { takeResumeDay } from '../../../utils/resumeRoute'
import {
  CalendarDays, ChevronDown, ChevronLeft, Download, FileDown, List, Map as MapIcon, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Plane, Route, SlidersHorizontal, Trash2, Upload,
} from 'lucide-react'
import { useTripPlanner } from '../../../pages/tripPlanner/useTripPlanner'
import { pickDockTabs } from './dockTabs'
import MBadge from '../../components/MBadge'
import MIconBtn from '../../components/MIconBtn'
import { useActivePill } from '../../components/useActivePill'
import { useSharedImportStore } from '../../../native/sharedFiles'
import MPlanTimeline from './plan/MPlanTimeline'
import MMapArea from './map/MMapArea'
import MPlacesBrowser from './places/MPlacesBrowser'
import MTripTabPanel from './tabs/MTripTabPanel'
import MTripSheets from './sheets/MTripSheets'
import MReceiptScanButton from './tabs/MReceiptScanButton'
import MTripLoadingSplash from './MTripLoadingSplash'
import { usePluginDayTints, dayTintBackground } from '../../../components/Plugins/PluginDaySchedule'
import { stageOf } from '../../../components/Roadtrip/roadtripRowModel'
import { badgeLabel, distanceBadge } from './roadtrip/stageBadges'
import type { CorridorReach } from '../../../components/Roadtrip/corridorSearchModel'
import { useSettingsStore } from '../../../store/settingsStore'
import { useListsSubTab, type ListsSubTab } from '../../../hooks/useListsSubTab'
import type { Day } from '../../../types'
import { getIntlLanguage } from '@trek/shared'
import { useDayPreviewStore } from '../../dayPreviewStore'
import { useIsSplit, useIsWide } from '../../../hooks/sizeClass'
import MTripRail from './MTripRail'
import {
  CollabSegment, CompactToggle, DayRailSteps, DocSyncButton, GlassSegment, HeaderActions, PrimaryPill, ROW_AFTER_BACK, ROW_CENTRED,
} from './MTripShellParts'
import { edgeFadeClass, useEdgeFade } from '../../components/useEdgeFade'
import { useShortcuts } from '../../keyboard/useShortcuts'
import { tripCreateIntent } from '../../../components/Layout/useCreateAction'
import MDockScrim from '../../components/MDockScrim'

/**
 * Mobile trip screen frame. Owns the chrome the design shares across every
 * trip view — glass top controls (per-tab centre variants), the day-chip rail,
 * the bottom dock — plus the view/mode machine on top of the planner state.
 * All data and mutations come from useTripPlanner() (same hook the desktop
 * page wires), so WebSocket sync, offline persistence, undo and the
 * ?create=/sessionStorage contracts are inherited unchanged.
 *
 * The actual content areas (plan timeline, map, places browser, tab panels,
 * sheets) are slots: typed component props whose defaults are the real screens
 * under screens/trip/ (the non-plan tab panels route through tabs/MTripTabPanel).
 */

/** Everything useTripPlanner() returns — data, permissions, CRUD, modal state. */
export type TripPlanner = ReturnType<typeof useTripPlanner>

export type MTripView = 'plan' | 'map'
export type MTripMode = 'go' | 'edit' | 'browse'
/** The road trip tab's own two halves: the chain, or the same map showing the stage. */
export type MRtView = 'list' | 'map'
export type MTripListsTab = ListsSubTab
export type MTripCollabTab = 'chat' | 'notes' | 'links' | 'polls'

/**
 * Currently open bottom/floating sheet. Well-known ids (owned by the sheets
 * screen): 'day' (payload { dayId }), 'days', 'mehr', 'note' (payload
 * { dayId, note? }), 'accommodation' (payload { dayId?, accId?, from? }),
 * 'transport' (payload { reservationId }), 'bract'
 * (payload { placeId, dayPicker? }), 'import', 'export', 'members',
 * 'tripedit', 'bags', 'task'. The place inspector keys off the planner's
 * place selection instead of a sheet id, and planner-backed editors (place
 * form, transport, booking, expense) keep using the planner's own modal flags.
 */
export interface MTripSheetState {
  id: string
  payload?: unknown
}

/**
 * Shell-owned UI state handed to every slot. Ownership split: the planner
 * hook owns trip data + CRUD + editor-modal flags; the shell owns chrome
 * state (view/mode machine, active tab, sheet routing, header sub-states).
 */
export interface MTripShellApi {
  /** 'plan' = list chrome, 'map' = fullscreen map. Plan tab only. */
  view: MTripView
  /** The road trip tab's own list ⇄ map switch, independent of `view`. */
  rtView: MRtView
  /**
   * True whenever the map is the front layer, in either tab.
   *
   * The map is one instance shared by the plan tab and the road trip tab, so
   * everything floating over it (POI pill, compass, pills) keys off this rather
   * than off `view`, which only ever meant the plan tab.
   */
  mapFront: boolean
  /** Road trip tab: chain ⇄ map, on the same instance, without moving the camera. */
  toggleRtView: () => void
  /**
   * How much of the stage the corridor search asks about.
   *
   * Shell state rather than sheet state, because two surfaces ask the same question:
   * the bar over the stage says what the next search will cover, and the sheet is where
   * it is chosen. Kept here they cannot disagree, and it survives the sheet closing.
   */
  rtReach: CorridorReach
  setRtReach: (value: CorridorReach) => void
  /**
   * True while the trip's pane stands beside the map (split size class): the map
   * then has no chrome over it, so its own controls move up to the top edge.
   */
  paneOpen: boolean
  /** Travel/Plan/Places segment: go | edit | browse. */
  mode: MTripMode
  /** Legacy tab ids: plan · transports · buchungen · listen · finanzplan · dateien · collab · plugin:* */
  trTab: string
  /** Switch trip tab (persists to sessionStorage['trip-tab-{id}'], resets browse → go). */
  setTrTab: (tabId: string) => void
  /** Set go/edit/browse — forces the plan tab and the plan view. */
  setTravelMode: (mode: MTripMode) => void
  /** Plan ⇄ map. Leaving to the map resets browse → go. */
  toggleView: () => void
  /** True while browse was entered from edit — the places browser seeds its 'unplanned' filter. */
  browseFromEdit: boolean
  sheet: MTripSheetState | null
  openSheet: (id: string, payload?: unknown) => void
  closeSheet: () => void
  /** Lists header segment; persisted per trip like the desktop sub-tab. */
  listsTab: MTripListsTab
  setListsTab: (tab: MTripListsTab) => void
  collabTab: MTripCollabTab
  setCollabTab: (tab: MTripCollabTab) => void
  /** Header compact toggles for the transports / bookings lists. */
  transportsCompact: boolean
  bookingsCompact: boolean
  /** Header intent signals — increment-only counters, consumed by the tab panels. */
  addExpenseSignal: number
  exportCostsCsvSignal: number
  uploadFilesSignal: number
  openFilesTrashSignal: number
  openDocSyncSignal: number
}

/**
 * Day timeline for go/edit mode (plan tab, plan view). Renders the scrollable
 * day content below the top controls + day chips and above the dock
 * (clearance: top ~158px incl. safe-area, bottom var(--bottom-nav-h)).
 * Reads the active day from planner.selectedDayId.
 */
export interface MPlanTimelineProps {
  planner: TripPlanner
  shell: MTripShellApi
}

/**
 * Fullscreen map area (plan tab). Mounted for the whole plan-tab lifetime so
 * the map stays warm under the timeline; visible when shell.view === 'map'.
 * Marker/route data comes from planner (mapPlaces, dayPlaces, route, …).
 */
export interface MMapAreaProps {
  planner: TripPlanner
  shell: MTripShellApi
}

/**
 * Places browser overlay (mode === 'browse'). Owns its own filter/search/
 * selection state; seeds the 'unplanned' filter when shell.browseFromEdit.
 */
export interface MPlacesBrowserProps {
  planner: TripPlanner
  shell: MTripShellApi
}

/**
 * Non-plan tab panel, rendered as a full overlay above map/chips. `tab` is the
 * active legacy id (transports, buchungen, listen, finanzplan, dateien,
 * collab, plugin:*). Consumes the shell header state for its tab (compact
 * toggles, listsTab/collabTab, intent signals).
 */
export interface MTripTabPanelProps {
  planner: TripPlanner
  shell: MTripShellApi
  tab: string
}

/**
 * Sheet host — always mounted, renders whatever shell.sheet points at plus the
 * planner-flag editors (place form, transport/booking/expense, imports,
 * members, trip edit) as MSheet instances portaled to #m-sheet-root.
 */
export interface MTripSheetsProps {
  planner: TripPlanner
  shell: MTripShellApi
}

interface MTripShellProps {
  PlanTimeline?: ComponentType<MPlanTimelineProps>
  MapArea?: ComponentType<MMapAreaProps>
  PlacesBrowser?: ComponentType<MPlacesBrowserProps>
  TabPanel?: ComponentType<MTripTabPanelProps>
  Sheets?: ComponentType<MTripSheetsProps>
}

/** The two tabs that share the map instance. Everything else is a full overlay. */
const MAP_TABS = new Set(['plan', 'roadtrip'])

function dayChipLabel(day: Day, language: string, fallback: string): string {
  if (day.date) {
    const date = new Date(`${day.date.slice(0, 10)}T00:00:00`)
    if (!Number.isNaN(date.getTime())) {
      return `${new Intl.DateTimeFormat(getIntlLanguage(language), { weekday: 'short' }).format(date)} ${date.getDate()}`
    }
  }
  return fallback
}

export default function MTripShell({
  PlanTimeline = MPlanTimeline,
  MapArea = MMapArea,
  PlacesBrowser = MPlacesBrowser,
  TabPanel = MTripTabPanel,
  Sheets = MTripSheets,
}: MTripShellProps) {
  const planner = useTripPlanner()
  const { t, language, tripId, days, trip, navigate, packingItems, todoItems, isLoading } = planner

  // Per-day colours from the dayTintProvider plugin hook — the mobile counterpart
  // of the desktop day-card wash, carried on the day chips. Empty without a plugin.
  const dayTints = usePluginDayTints(tripId)
  const distanceUnit = useSettingsStore(s => s.settings.distance_unit)

  const [view, setView] = useState<MTripView>('plan')
  // Its own state rather than a share of `view`: the two tabs carry different
  // things on the same map, and forcing one into the other's half is the kind of
  // coupling nobody can predict from the outside.
  const [rtView, setRtView] = useState<MRtView>('list')
  const [rtReach, setRtReach] = useState<CorridorReach>('ahead')
  const [mode, setMode] = useState<MTripMode>('go')
  const [browseFromEdit, setBrowseFromEdit] = useState(false)
  const [sheet, setSheet] = useState<MTripSheetState | null>(null)
  const [listsTab, setListsTab] = useListsSubTab(tripId, { onlyKnownTabs: true })
  const [collabTab, setCollabTab] = useState<MTripCollabTab>('chat')
  const [transportsCompact, setTransportsCompact] = useState(false)
  const [bookingsCompact, setBookingsCompact] = useState(false)
  const [addExpenseSignal, setAddExpenseSignal] = useState(0)
  const [exportCostsCsvSignal, setExportCostsCsvSignal] = useState(0)
  const [uploadFilesSignal, setUploadFilesSignal] = useState(0)
  const [openFilesTrashSignal, setOpenFilesTrashSignal] = useState(0)
  const [openDocSyncSignal, setOpenDocSyncSignal] = useState(0)
  // Size class (hooks/sizeClass.ts). Wide: a rail on the leading edge holds the
  // trip's sections instead of the dock. Split: the plan, the places or the
  // road trip's chain sit in a pane beside the map rather than over it.
  const wide = useIsWide()
  const split = useIsSplit()

  // The mobile plan is single-day: make sure a day is active once days arrive.
  // Only seed once so an intentional deselect elsewhere is not fought. Open on
  // today while the trip is running, otherwise on the next day that is still
  // ahead — a gap in the dates should not throw you back to day 1 — and fall
  // back to the first day once the whole trip is behind us.
  const seededDayRef = useRef(false)
  useEffect(() => {
    // Re-entering the same trip from the dashboard starts with that trip's old
    // selection still in the store. The first render treats it as seeded, then
    // loadTrip clears it. Reset the guard with that load cycle so the freshly
    // loaded days get their normal today/Day 1 selection.
    if (isLoading) {
      seededDayRef.current = false
      return
    }
    if (seededDayRef.current) return
    // A day that is already active counts as seeded: a later deselect is the
    // user's, and re-seeding it here would be exactly the fight this guard
    // exists to avoid.
    if (planner.selectedDayId != null) { seededDayRef.current = true; return }
    if (days.length === 0) return
    seededDayRef.current = true
    // Off the same helper file as the desktop day plan (#1567), so the two
    // cannot drift on what "today" means.
    // A relaunch after the system closed the app goes back to the day it was on (#666).
    const resumed = takeResumeDay(tripId)
    const resumedDay = resumed != null && days.some(d => d.id === resumed) ? resumed : null
    planner.tripActions.setSelectedDay(resumedDay ?? findFocusDayId(days) ?? days[0].id)
  }, [isLoading, planner.selectedDayId, days, planner.tripActions, tripId])

  // Swiping the day panel (#2051) can move the day well past the chips on
  // screen — the rail overflows from roughly six days on — so the active chip
  // pulls itself back into view. Only when it is really clipped, so tapping a
  // chip you can already see never shifts the rail under your thumb.
  // The opening day is chosen while the splash still covers the shell (#2880),
  // so the rail itself is a dependency: the chip is lined up when the rail
  // appears, in place rather than gliding across a rail nobody has seen yet.
  // The rail lights the day a swipe is heading for before the plan switches (dayPreviewStore).
  const previewDayId = useDayPreviewStore(s => s.dayId)
  const clearDayPreview = useDayPreviewStore(s => s.setDayId)
  useEffect(() => { clearDayPreview(null) }, [planner.selectedDayId, clearDayPreview])
  const railDayId = previewDayId ?? planner.selectedDayId
  const chipRefs = useRef(new Map<number, HTMLButtonElement>())
  const [dayRail, setDayRail] = useState<HTMLDivElement | null>(null)
  const alignedRailRef = useRef<HTMLDivElement | null>(null)
  useLayoutEffect(() => {
    const chip = railDayId != null ? chipRefs.current.get(railDayId) : undefined
    if (!chip || !dayRail) return
    const firstView = alignedRailRef.current !== dayRail
    alignedRailRef.current = dayRail
    const c = chip.getBoundingClientRect()
    const r = dayRail.getBoundingClientRect()
    if (c.left >= r.left - 1 && c.right <= r.right + 1) return
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    // block:'nearest' is not optional: the shell root is `fixed inset-0`, and
    // 'center' would scroll the document behind it instead.
    chip.scrollIntoView({
      behavior: firstView || reducedMotion ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [railDayId, days, dayRail])
  // The active day's pill glides to the next chip rather than jumping there.
  // A booking document shared to TREK, and this trip picked for it: open the import.
  const sharedTripId = useSharedImportStore(s => s.tripId)
  const { setBookingImportKind, setShowBookingImport } = planner
  useEffect(() => {
    if (sharedTripId == null || sharedTripId !== Number(tripId)) return
    setBookingImportKind('bookings')
    setShowBookingImport(true)
  }, [sharedTripId, tripId, setBookingImportKind, setShowBookingImport])
  // The day strip says when it runs on past an edge (a long trip, a narrow pane).
  const dayFade = useEdgeFade(dayRail)
  const dayPill = useActivePill(dayRail, '[aria-current="true"]', `${railDayId}:${days.map(d => d.id).join(',')}:${language}`)

  const trTab = planner.activeTab

  useEffect(() => {
    if (trTab === 'tour-planner') planner.handleTabChange('plan')
  }, [trTab, planner.handleTabChange])

  const setTrTab = (tabId: string) => {
    planner.handleTabChange(tabId)
    if (mode === 'browse') setMode('go')
  }

  const setTravelMode = (next: MTripMode) => {
    setBrowseFromEdit(next === 'browse' && mode === 'edit')
    setMode(next)
    setView('plan')
    if (trTab !== 'plan') planner.handleTabChange('plan')
    // The timeline shows one day and renders empty without one. Beside the map
    // the places keep the all-days switch, so leaving them for the plan brings
    // back the day an "all days" put away.
    if (next !== 'browse' && planner.selectedDayId == null) {
      const back = dayToRestore()
      if (back != null) planner.handleSelectDay(back, true)
    }
  }

  // Map focus on the selected day. Drives the same declutter the desktop sidebar's
  // collapse chevron drives (#216) rather than adding a second filter — the phone
  // lost that affordance when this shell replaced DayPlanSidebar, so a day's pins
  // could not be told apart from the rest of the trip at all (#1962). Unplanned
  // places stay visible either way, which is what the collapse path has always done.
  const focusMapOnDay = (dayId: number | null) => {
    planner.setExpandedDayIds(dayId == null ? null : new Set([dayId]))
  }

  // The map's day selection: frame the day, draw its route, drop the other days'
  // pins. Shared by the chip tap and the all-days toggle so the two cannot drift.
  const selectDayOnMap = (dayId: number) => {
    planner.handleSelectDay(dayId, false)
    planner.autoShowRoute()
    focusMapOnDay(dayId)
  }

  // The day an "all days" deselect came from, so the toggle can put it back.
  // A remote day:deleted can retire it while it is parked here, hence the
  // membership check before it is trusted.
  const lastDayRef = useRef<number | null>(null)
  const dayToRestore = (): number | null =>
    (lastDayRef.current != null && days.some(d => d.id === lastDayRef.current)
      ? lastDayRef.current
      : findFocusDayId(days) ?? days[0]?.id) ?? null

  // Whole trip ⇄ one day on the map (#2257). Its own control rather than a
  // second tap on the active chip: that tap already opens the day sheet, the
  // only route to it that also exists in map view. Never skipFit — changing
  // what the map is filtered to is exactly when it should reframe.
  const toggleAllDays = () => {
    if (planner.selectedDayId != null) {
      lastDayRef.current = planner.selectedDayId
      focusMapOnDay(null)
      planner.handleSelectDay(null, false)
      return
    }
    const back = dayToRestore()
    if (back != null) selectDayOnMap(back)
  }

  const toggleView = () => {
    const next = view === 'plan' ? 'map' : 'plan'
    setView(next)
    if (mode === 'browse') setMode('go')
    // Entering the map: draw the current day's route and frame it — the
    // BoundsController re-fits to include the polyline once OSRM resolves.
    if (next === 'map') {
      planner.autoShowRoute()
      if (planner.selectedDayId != null) planner.handleSelectDay(planner.selectedDayId, false)
      focusMapOnDay(planner.selectedDayId)
    } else {
      // Leaving the map: nothing is filtered while the timeline is up, so the next
      // visit starts from the whole trip unless a day is picked again. Beside the
      // pane the map stays in view, so there it keeps showing the day.
      if (!split) focusMapOnDay(null)
      // The timeline is single-day and renders empty without one, so an "all days"
      // deselect on the map must not follow the user back into the plan. Same day
      // the toggle would restore, so the two ways back agree.
      if (planner.selectedDayId == null) {
        const back = dayToRestore()
        if (back != null) planner.handleSelectDay(back, true)
      }
    }
  }

  /**
   * The road trip tab's own list ⇄ map switch.
   *
   * Deliberately quieter than `toggleView`: no reframe on the way in and no day
   * restore on the way out. The stage is always one day, the chain and the map show
   * the same one, and the camera belongs to whoever looked at it last. What does
   * reframe is a stage change, through the day chips, which both halves share.
   */
  const toggleRtView = () => {
    setRtView(prev => {
      const next = prev === 'list' ? 'map' : 'list'
      if (next === 'map') planner.autoShowRoute()
      return next
    })
  }

  // Beside a pane the map is on screen in both halves, so whatever floats over
  // it (POI pill, compass, the all-days switch) stays, and "show on map" has
  // nowhere to switch to.
  const mapFront = (trTab === 'plan' && (view === 'map' || split)) || (trTab === 'roadtrip' && (rtView === 'map' || split))
  // The pane is open while the plan tab shows its timeline or the places, or the
  // road trip tab its chain. The list/map switch closes it for the whole map.
  const paneOpen = split && ((trTab === 'plan' && (view === 'plan' || mode === 'browse')) || (trTab === 'roadtrip' && rtView === 'list'))
  // The whole trip at once is a question for the map alone: beside the plan or the
  // road trip chain, both of which show one day, the switch would empty the pane.
  // The places beside the map list the whole trip, so they keep it.
  const allDaysOffered = mapFront && !(paneOpen && (trTab === 'roadtrip' || mode !== 'browse'))

  // With the plan beside the map, the map shows the day the plan shows: its
  // places framed, its route drawn, the other days' pins put away, exactly as
  // a phone does when it switches over to the map.
  // Not before the splash has gone: the map is not there to frame until then.
  const mapReady = !planner.isLoading && planner.splashDone
  const followDayId = mapReady && split && trTab === 'plan' && view === 'plan' && mode !== 'browse' ? planner.selectedDayId : null
  const { autoShowRoute, setExpandedDayIds } = planner
  const selectDayRef = useRef(planner.handleSelectDay)
  useEffect(() => {
    selectDayRef.current = planner.handleSelectDay
  })
  useEffect(() => {
    if (followDayId == null) return
    autoShowRoute()
    setExpandedDayIds(new Set([followDayId]))
    // Framed as the map toggle frames it, without touching the plan's scroll.
    selectDayRef.current(followDayId, false)
  }, [followDayId, autoShowRoute, setExpandedDayIds])

  // The map's box changes with the pane (opening, hiding, a rotation or a fold
  // crossing the split size), and a frame fitted to the old box leaves the day
  // half outside the new one. Once the box has settled, frame the day again.
  const frameDayId = MAP_TABS.has(trTab) ? planner.selectedDayId : null
  const boxKey = `${split}:${paneOpen}`
  const lastBoxRef = useRef(boxKey)
  useEffect(() => {
    if (lastBoxRef.current === boxKey) return
    lastBoxRef.current = boxKey
    if (frameDayId == null) return
    const timer = setTimeout(() => selectDayRef.current(frameDayId, false), 340)
    return () => clearTimeout(timer)
  }, [boxKey, frameDayId])

  const openSheet = (id: string, payload?: unknown) => setSheet({ id, payload })
  const closeSheet = () => setSheet(null)

  // A hardware keyboard: ⌘1 to ⌘9 for the trip's sections in rail order, ⌥← and
  // ⌥→ through the days, ⌃⌘S for the pane beside the map (as Show Sidebar does
  // in every iPad app), ⌘[ back to the trips.
  const keyTabs = planner.TRIP_TABS.filter(tab => !tab.desktopOnly).slice(0, 9)
  const stepDay = (delta: number) => {
    const at = days.findIndex(d => d.id === planner.selectedDayId)
    const next = days[at + delta]
    if (at === -1 || !next) return
    if (mapFront && !split) selectDayOnMap(next.id)
    else planner.handleSelectDay(next.id, true)
  }
  const dayKeys = trTab === 'plan' || trTab === 'roadtrip'
  // ⌘N creates what the tab on show creates, as the "+" does (MShellShortcuts lets go of it here).
  const createIntent = tripCreateIntent(String(tripId), trTab)
  useShortcuts('trip', [
    ...keyTabs.map((tab, i) => ({ id: `tab-${tab.id}`, title: tab.label, key: String(i + 1), mod: true, run: () => setTrTab(tab.id) })),
    ...(dayKeys && days.length > 1
      ? [
          { id: 'day-prev', title: t('mobileTrip.previousDay'), key: 'ArrowLeft', alt: true, run: () => stepDay(-1) },
          { id: 'day-next', title: t('mobileTrip.nextDay'), key: 'ArrowRight', alt: true, run: () => stepDay(1) },
        ]
      : []),
    ...(split && MAP_TABS.has(trTab)
      ? [{ id: 'pane', title: paneOpen ? t('mobileTrip.hidePane') : t('mobileTrip.showPane'), key: 's', ctrl: true, run: trTab === 'roadtrip' ? toggleRtView : toggleView }]
      : []),
    { id: 'create', title: t(createIntent.labelKey), key: 'n', mod: true, run: () => void navigate(createIntent.to) },
    { id: 'back', title: t('common.back'), key: '[', mod: true, run: () => void navigate('/dashboard') },
  ])

  const shell: MTripShellApi = {
    view, rtView, mapFront, paneOpen, toggleRtView, rtReach, setRtReach, mode, trTab, setTrTab, setTravelMode, toggleView, browseFromEdit,
    sheet, openSheet, closeSheet,
    listsTab, setListsTab, collabTab, setCollabTab,
    transportsCompact, bookingsCompact,
    addExpenseSignal, exportCostsCsvSignal, uploadFilesSignal, openFilesTrashSignal,
    openDocSyncSignal,
  }

  // Splash — same gate as the desktop page, in the mobile design language.
  if (planner.isLoading || !planner.splashDone) {
    return <MTripLoadingSplash title={trip?.title || ''} />
  }
  if (!trip) return null

  const mobileTabs = planner.TRIP_TABS.filter(tab => !tab.desktopOnly)
  const enabledTabIds = new Set(mobileTabs.map(tab => tab.id))
  const dockTabs = pickDockTabs(enabledTabIds)
  const tabLabel = (id: string) => mobileTabs.find(tab => tab.id === id)?.label ?? id

  // While the trip runs, today's chip carries a ring and a dot (#2392). That mark
  // is the whole of it: a second button beside the rail only crowded the chrome.
  // Null outside the trip's dates.
  const todayDayId = findTodayDayId(days)

  // Beside a pane the switch shows or hides the pane, the way a sidebar button does.
  const splitToggleLabel = split ? (paneOpen ? t('mobileTrip.hidePane') : t('mobileTrip.showPane')) : null

  const onDayChipTap = (dayId: number) => {
    if (dayId === planner.selectedDayId) openSheet('day', { dayId })
    // In map mode a day tap fits to that day's places, draws its route and drops
    // the other days' pins, so the day it framed is the day it shows.
    else if (view === 'map') selectDayOnMap(dayId)
    else planner.handleSelectDay(dayId, true)
  }

  const packedCount = packingItems.filter(i => i.checked).length
  const todoOpenCount = todoItems.filter(i => !i.checked).length

  // The stage header: the day on screen and what it costs, or the whole drive while
  // the day filter is off. A figure nothing has measured yet is left out rather than
  // printed as 0 m, and with neither figure the pill falls back to the addon's own name,
  // so it never reads as an empty one.
  const rtStage = stageOf(planner.roadtripRoutes.days, planner.selectedDayId)
  const rtStageDay = rtStage ? days.find(d => d.id === rtStage.dayId) : undefined
  let rtHeaderDay: string | null = null
  if (rtStage) {
    const dayN = t('planner.dayN', { n: rtStage.dayNumber })
    rtHeaderDay = rtStageDay ? dayChipLabel(rtStageDay, language, dayN) : dayN
  }
  const rtHeaderDistance = distanceBadge(
    rtStage ? rtStage.distance : planner.roadtripRoutes.totalDistance,
    distanceUnit,
  )
  const rtHeaderLabel = badgeLabel([rtHeaderDay, rtHeaderDistance])

  // The chrome over the content (top controls, day chips) spans the pane while
  // one is open, otherwise the page column after the rail.
  const chromeSpan = paneOpen ? 'split:end-auto split:w-[calc(var(--trip-pane)-32px)]' : ''
  const paneBox = 'absolute inset-y-0 start-0 end-0 wide:start-[var(--m-rail-w)] split:end-auto split:w-[var(--trip-pane)]'
  // Where the map begins. Beside an open pane, after it; while the map is the
  // whole screen it runs under the floating rail to the window's edge, with its
  // controls kept clear of the rail (--trip-map-inset); behind a full-width
  // list it waits after the rail, out of sight.
  const mapUnderRail = wide && mapFront && !paneOpen
  const mapStart = paneOpen ? 'calc(var(--m-rail-w) + var(--trip-pane-open))' : mapUnderRail ? '0px' : 'var(--m-rail-w)'

  return (
    <div
      className="m-trip fixed inset-0 z-50 overflow-hidden bg-[color:var(--m-bg)] bg-[image:var(--m-scr)] text-m-ink"
      style={{
        ['--trip-pane' as string]: paneOpen ? 'var(--trip-pane-open)' : '0px',
        ['--trip-map-start' as string]: mapStart,
        ['--trip-map-inset' as string]: mapUnderRail ? 'var(--m-rail-w)' : '0px',
      }}
    >
      {/* ── Content layers ─────────────────────────────────────────────── */}
      {/*
        One expression for both map tabs, and it has to stay one: written as two
        (`{trTab === 'plan' && <MapArea/>}{trTab === 'roadtrip' && <MapArea/>}`)
        React sees two positions and remounts the map on every tab switch, which
        tears down the WebGL context and reloads every tile. The symptom is a flash
        on the device, not a failing test.
      */}
      {MAP_TABS.has(trTab) && (
        <div className="absolute inset-0">
          {/* The map's own box ends where the pane begins, so its controls and the
              framing of a day stay in the part of it that can be seen. */}
          <div className="absolute inset-y-0 end-0 start-[var(--trip-map-start)] transition-[inset-inline-start] duration-300 ease-out motion-reduce:transition-none">
            <MapArea planner={planner} shell={shell} />
          </div>
          {trTab === 'plan' && view === 'plan' && mode !== 'browse' && (
            <div className={`${paneBox} z-10 bg-[color:var(--m-bg)] bg-[image:var(--m-scr)] split:border-e split:border-[color:var(--m-rowbr)]`}>
              <PlanTimeline planner={planner} shell={shell} />
            </div>
          )}
          {trTab === 'plan' && mode === 'browse' && (
            <div className={`${paneBox} z-30 bg-[color:var(--m-bg)] bg-[image:var(--m-scr)] split:border-e split:border-[color:var(--m-rowbr)]`}>
              <PlacesBrowser planner={planner} shell={shell} />
            </div>
          )}
          {/*
            The stage lives at z-20, below the day chips at z-25, which is the whole
            of the stage picker: the chips belong to the shell and were only ever
            hidden because non-plan panels cover them at z-30.
          */}
          {trTab === 'roadtrip' && rtView === 'list' && (
            <div className={`${paneBox} z-20 bg-[color:var(--m-bg)] bg-[image:var(--m-scr)] split:border-e split:border-[color:var(--m-rowbr)]`}>
              <TabPanel planner={planner} shell={shell} tab={trTab} />
            </div>
          )}
          {trTab === 'roadtrip' && rtView === 'map' && (
            // The stage's bars keep to the page column while the map runs under the rail.
            <div className="pointer-events-none absolute inset-0 wide:start-[var(--m-rail-w)]">
              <TabPanel planner={planner} shell={shell} tab={trTab} />
            </div>
          )}
        </div>
      )}
      {!MAP_TABS.has(trTab) && (
        <div className="absolute inset-0 z-30 bg-[color:var(--m-bg)] bg-[image:var(--m-scr)] wide:start-[var(--m-rail-w)]">
          <TabPanel planner={planner} shell={shell} tab={trTab} />
        </div>
      )}

      {/* ── Day chips (z-25 — covered by non-plan tab overlays, stays mounted) ── */}
      {days.length > 0 && (
        <div className={`absolute end-4 start-[calc(var(--m-rail-w,0px)+16px)] z-[25] flex gap-[6px] top-[calc(var(--m-safe-top,12px)+50px)] ${chromeSpan}`}>
          {/* The glass is the outer box, the scroller sits inside its padding: that way
              the fade at an edge that runs on takes the chips, not the glass's rim. */}
          <div className="relative flex min-w-0 flex-1 rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[3px] backdrop-blur-[24px] backdrop-saturate-[1.7]">
          <DayRailSteps rail={dayRail} fade={dayFade} />
          <div ref={setDayRail} className={`relative flex min-w-0 flex-1 items-center gap-[2px] overflow-x-auto rounded-full wide:[--m-fade-reach:52px] ${edgeFadeClass(dayFade)}`}>
            {dayPill && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 top-0 rounded-full bg-m-act shadow-[0_6px_16px_-6px_rgba(0,0,0,.4)]" // rtl-lint-disable: moved by the measured offsetLeft (useActivePill)
                style={dayPill}
              />
            )}
            {days.map((day, idx) => {
              const active = day.id === railDayId
              const isToday = day.id === todayDayId
              const tint = dayTints[day.id]
              return (
                <button
                  key={day.id}
                  ref={el => { if (el) chipRefs.current.set(day.id, el); else chipRefs.current.delete(day.id) }}
                  type="button"
                  onClick={() => onDayChipTap(day.id)}
                  aria-current={active ? 'true' : undefined}
                  title={tint?.label || undefined}
                  // The chip is mobile's day-number badge, so it follows badgeTone.
                  // Inactive chips only — an inline background would otherwise beat
                  // the active chip's bg-m-act class.
                  style={active ? undefined : { background: dayTintBackground(tint, 'badge', '--day-tint-chip') }}
                  data-today={isToday || undefined}
                  className={`relative flex flex-1 items-center justify-center gap-[3px] whitespace-nowrap rounded-full px-3 py-[5px] text-center text-[0.75rem] font-semibold transition-colors duration-200 wide:scroll-mx-[48px] ${
                    active ? `text-m-actfg ${dayPill ? '' : 'bg-m-act'}` : 'text-m-ink'
                  } ${isToday && !active ? 'ring-[1.5px] ring-inset ring-[color:var(--m-st-info)]' : ''}`}
                >
                  {isToday && (
                    <span aria-hidden="true" className={`h-[5px] w-[5px] flex-none rounded-full ${active ? 'bg-m-actfg' : 'bg-[color:var(--m-st-info)]'}`} />
                  )}
                  {dayChipLabel(day, language, t('planner.dayN', { n: day.day_number ?? idx + 1 }))}
                  {isToday && <span className="sr-only">{t('mobileTrip.today')}</span>}
                  {/* Marks the second tap as "opens the day", the only day-sheet
                      route that also exists in map view. */}
                  {active && <ChevronDown size={11} strokeWidth={2.6} aria-hidden="true" className="flex-none opacity-70" />}
                </button>
              )
            })}
          </div>
          </div>
          {/* Drop the day filter and show the whole trip (#2257). Map only: the
              plan timeline and the road trip chain are both single-day, so there is
              nothing to widen there. Stays mounted while a day is active rather than
              appearing on selection, which would shove the rail sideways under the
              thumb. On the road trip map it means the whole drive in its day colours. */}
          {allDaysOffered && (
            <button
              type="button"
              onClick={toggleAllDays}
              aria-pressed={planner.selectedDayId == null}
              aria-label={t('mobileTrip.allDays')}
              title={t('mobileTrip.allDays')}
              className={`flex w-9 flex-none items-center justify-center rounded-full border border-[color:var(--m-gbr)] backdrop-blur-[24px] backdrop-saturate-[1.7] ${
                planner.selectedDayId == null
                  ? 'bg-m-act text-m-actfg shadow-[0_6px_16px_-6px_rgba(0,0,0,.4)]'
                  : 'bg-[color:var(--m-glass)] text-m-ink'
              }`}
            >
              <CalendarDays size={15} strokeWidth={2.4} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* ── Top controls (z-42 — above every layer incl. tab overlays) ── */}
      <div className={`absolute end-4 start-[calc(var(--m-rail-w,0px)+16px)] z-[42] flex h-10 items-center justify-between top-[var(--m-safe-top,12px)] ${chromeSpan}`}>
        <MIconBtn ariaLabel={t('common.back')} onClick={() => navigate('/dashboard')} className="backdrop-blur-[24px] backdrop-saturate-[1.7]">
          <ChevronLeft size={19} strokeWidth={2.2} />
        </MIconBtn>

        {trTab === 'plan' && (
          <GlassSegment activeKey={`${mode}:${view}:${language}`}>
            {([
              { value: 'go' as const, label: t('mobileTrip.travel') },
              { value: 'edit' as const, label: t('trip.mobilePlan') },
              { value: 'browse' as const, label: t('trip.mobilePlaces') },
            ]).map(seg => (
              <button
                key={seg.value}
                type="button"
                onClick={() => setTravelMode(seg.value)}
                aria-pressed={mode === seg.value && view !== 'map'}
                className={`flex-none whitespace-nowrap rounded-full px-4 py-2 text-[0.8125rem] ${
                  mode === seg.value && view !== 'map' ? 'bg-m-act font-semibold text-m-actfg' : 'font-medium text-m-ink'
                }`}
              >
                {seg.label}
              </button>
            ))}
          </GlassSegment>
        )}

        {trTab === 'transports' && (
          <HeaderActions
            phone={ROW_AFTER_BACK}
            primary={<PrimaryPill
              label={t('transport.addTransport')}
              onClick={() => {
                planner.setEditingTransport(null)
                planner.setTransitPrefill(null)
                planner.setTransportModalAutomated(false)
                planner.setShowTransportModal(true)
              }}
            />}
          >
            {planner.bookingImportAvailable && (
              <MIconBtn ariaLabel={t('reservations.import.title')} onClick={() => { planner.setBookingImportKind('transports'); planner.setShowBookingImport(true) }} size={40} className="text-m-muted backdrop-blur-[24px] backdrop-saturate-[1.7]">
                <Download size={15} strokeWidth={2} />
              </MIconBtn>
            )}
            {planner.airTrailAvailable && (
              <MIconBtn ariaLabel={t('reservations.airtrail.title')} onClick={() => planner.setShowAirTrailImport(true)} size={40} className="text-m-muted backdrop-blur-[24px] backdrop-saturate-[1.7]">
                <Plane size={15} strokeWidth={2} />
              </MIconBtn>
            )}
            <CompactToggle active={transportsCompact} onToggle={() => setTransportsCompact(v => !v)} label={t('mobileTrip.compactView')} />
          </HeaderActions>
        )}

        {trTab === 'buchungen' && (
          <HeaderActions
            phone={ROW_AFTER_BACK}
            primary={<PrimaryPill
              label={t('mobileTrip.newReservation')}
              onClick={() => { planner.setEditingReservation(null); planner.setShowReservationModal(true) }}
            />}
          >
            {planner.bookingImportAvailable && (
              <MIconBtn ariaLabel={t('reservations.import.title')} onClick={() => { planner.setBookingImportKind('bookings'); planner.setShowBookingImport(true) }} size={40} className="text-m-muted backdrop-blur-[24px] backdrop-saturate-[1.7]">
                <Download size={15} strokeWidth={2} />
              </MIconBtn>
            )}
            <CompactToggle active={bookingsCompact} onToggle={() => setBookingsCompact(v => !v)} label={t('mobileTrip.compactView')} />
          </HeaderActions>
        )}

        {trTab === 'finanzplan' && (
          <HeaderActions phone={ROW_CENTRED} primary={<PrimaryPill label={t('costs.addExpense')} onClick={() => setAddExpenseSignal(s => s + 1)} />}>
            <MReceiptScanButton tripId={tripId} canEdit={planner.can('budget_edit', trip)} />
            <MIconBtn ariaLabel={t('budget.exportCsv')} onClick={() => setExportCostsCsvSignal(s => s + 1)} size={40} className="text-m-muted backdrop-blur-[24px] backdrop-saturate-[1.7]">
              <FileDown size={15} strokeWidth={2} />
            </MIconBtn>
          </HeaderActions>
        )}

        {trTab === 'listen' && (
          <GlassSegment activeKey={`${listsTab}:${language}:${packedCount}:${todoOpenCount}`}>
            {([
              { value: 'packing' as const, label: t('todo.subtab.packing'), count: `${packedCount}/${packingItems.length}` },
              { value: 'todo' as const, label: t('todo.subtab.todo'), count: t('mobileTrip.todoOpenCount', { count: todoOpenCount }) },
            ]).map(seg => (
              <button
                key={seg.value}
                type="button"
                onClick={() => setListsTab(seg.value)}
                aria-pressed={listsTab === seg.value}
                className={`flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full px-4 py-2 text-[0.8125rem] ${
                  listsTab === seg.value ? 'bg-m-act font-semibold text-m-actfg' : 'font-medium text-m-ink'
                }`}
              >
                {seg.label}
                <span className="inline-flex rounded-full bg-[rgba(127,127,130,.22)] px-[7px] py-px font-geist text-[0.5625rem] font-bold leading-[1.6]">
                  {seg.count}
                </span>
              </button>
            ))}
          </GlassSegment>
        )}

        {trTab === 'collab' && <CollabSegment active={collabTab} onPick={setCollabTab} features={planner.collabFeatures} split={split} t={t} />}

        {/* The stage's own header: the day it shows, and a way into the figures
            behind it. A button rather than the plugin tabs' inert pill, because it
            is the only entry to the driving settings, and the right slot belongs to
            the list ⇄ map switch, same as in the plan tab.

            The day and the distance are badges rather than one line joined with a
            dot, so each reads as a figure of its own. Both stay neutral: the active
            day chip right below is already the filled pill with the same label, and
            a second one here would compete with it. The button names itself, because
            a screen reader runs the texts of pills side by side together. */}
        {trTab === 'roadtrip' && (
          <button
            type="button"
            onClick={() => openSheet('rtinfo')}
            aria-label={rtHeaderLabel || undefined}
            className="absolute inset-x-[52px] top-1/2 mx-auto flex h-[34px] w-fit max-w-full -translate-y-1/2 items-center gap-[5px] rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-[10px] backdrop-blur-[24px] backdrop-saturate-[1.7]"
          >
            <Route size={14} strokeWidth={2} className="flex-none text-m-muted" aria-hidden="true" />
            {rtHeaderLabel ? (
              <>
                {rtHeaderDay && <MBadge size="sm">{rtHeaderDay}</MBadge>}
                {/* Unit symbols keep their case: m and M are different units. */}
                {rtHeaderDistance && <MBadge size="sm" caps={false}>{rtHeaderDistance}</MBadge>}
              </>
            ) : (
              <span className="min-w-0 truncate text-[0.8125rem] font-semibold text-m-ink">{t('roadtrip.title')}</span>
            )}
            <SlidersHorizontal size={13} strokeWidth={2} className="flex-none text-m-faint" aria-hidden="true" />
          </button>
        )}

        {trTab === 'dateien' && (
          <HeaderActions
            phone={ROW_CENTRED}
            primary={<PrimaryPill icon={<Upload size={13} strokeWidth={2.2} />} label={t('common.upload')} onClick={() => setUploadFilesSignal(s => s + 1)} />}
          >
            <DocSyncButton tripId={tripId} trip={trip} label={t('docsync.title')} onOpen={() => setOpenDocSyncSignal(s => s + 1)} />
            <MIconBtn ariaLabel={t('files.trash')} onClick={() => setOpenFilesTrashSignal(s => s + 1)} size={40} className="text-m-muted backdrop-blur-[24px] backdrop-saturate-[1.7]">
              <Trash2 size={15} strokeWidth={2} />
            </MIconBtn>
          </HeaderActions>
        )}

        {/* A plugin tab is the only one that used to arrive without a name: it is
            not in the dock, so nothing was lit up there either, and the screen
            gave no clue which plugin was open. Same treatment as the others, from
            the tab entry the planner already builds (id, label, icon). */}
        {trTab.startsWith('plugin:') && (() => {
          const tab = planner.TRIP_TABS.find(x => x.id === trTab)
          if (!tab) return null
          const Icon = tab.icon
          return (
            <div className="pointer-events-none absolute inset-x-[52px] top-1/2 flex -translate-y-1/2 items-center justify-center gap-[7px]">
              <div className="flex min-w-0 items-center gap-[7px] rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-[13px] py-[7px] backdrop-blur-[24px] backdrop-saturate-[1.7]">
                {Icon && <Icon size={14} strokeWidth={2} className="flex-none text-m-muted" />}
                <span className="truncate text-[0.8125rem] font-semibold text-m-ink">{tab.label}</span>
              </div>
            </div>
          )
        })()}

        {/* Same slot, same markup, same icons in both map tabs, so the switch does
            not move or change shape when the tab does. The two views stay separate
            states: coupling them would drag one tab into the other's half. */}
        {MAP_TABS.has(trTab) ? (
          <MIconBtn
            ariaLabel={splitToggleLabel ?? (mapFront ? t('mobileTrip.listView') : t('mobileTrip.mapView'))}
            onClick={trTab === 'roadtrip' ? toggleRtView : toggleView}
            className="backdrop-blur-[24px] backdrop-saturate-[1.7]"
          >
            {split
              ? (paneOpen ? <PanelLeftClose size={18} strokeWidth={2} className="rtl:-scale-x-100" /> : <PanelLeftOpen size={18} strokeWidth={2} className="rtl:-scale-x-100" />)
              : mapFront ? <List size={18} strokeWidth={2} /> : <MapIcon size={18} strokeWidth={2} />}
          </MIconBtn>
        ) : (
          <span className="w-[38px] flex-none" />
        )}
      </div>

      {/* ── Section rail on a wide window, where an iPad keeps its sidebar ── */}
      {wide && (
        <MTripRail
          tabs={mobileTabs}
          active={trTab}
          onSelect={setTrTab}
          onMore={() => openSheet('mehr')}
          labelOf={tabLabel}
        />
      )}

      {/* ── Bottom dock (replaces the global bottom nav on this screen) ── */}
      {/* A tab's list fades out under the dock rather than showing in the gap below it; a map runs to the edge. */}
      {!wide && !MAP_TABS.has(trTab) && <MDockScrim />}
      {!wide && <nav className="absolute inset-x-4 z-40 flex h-[62px] items-center justify-around rounded-[31px] border border-[color:var(--m-gbr)] bg-[color:var(--m-dock)] px-[14px] shadow-[0_16px_44px_-14px_rgba(0,0,0,.35)] backdrop-blur-[30px] backdrop-saturate-[1.4] bottom-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        {dockTabs.map(({ id, icon: Icon }) => {
          // While More is open the dock points at More, not at the tab under it.
          const active = trTab === id && sheet?.id !== 'mehr'
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTrTab(id)}
              aria-label={tabLabel(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full ${
                active ? 'bg-m-act text-m-actfg' : 'text-m-muted'
              }`}
            >
              <Icon size={19} strokeWidth={2} />
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => openSheet('mehr')}
          aria-label={t('mobileTrip.more')}
          aria-expanded={sheet?.id === 'mehr'}
          className={`flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full ${
            sheet?.id === 'mehr' ? 'bg-m-act text-m-actfg' : 'text-m-muted'
          }`}
        >
          <MoreHorizontal size={19} strokeWidth={2.2} />
        </button>
      </nav>}

      <Sheets planner={planner} shell={shell} />
    </div>
  )
}
