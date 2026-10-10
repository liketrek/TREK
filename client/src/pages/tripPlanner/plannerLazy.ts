import { lazyWithRetry } from '../../utils/lazyWithRetry'

// The tab panels are the planner's dead weight: each one mounts only while its
// own tab is active, so the page chunk carried code most sessions never run. They
// load on demand now, through the same lazyWithRetry the route chunks use.
//
// PluginFrame stays static on purpose: DayDetailPanel and PlaceInspector import it
// too and both belong to the plan tab, so splitting it here would move nothing.
export const ReservationsPanel = lazyWithRetry(() => import('../../components/Planner/ReservationsPanel'))
export const PackingListPanel = lazyWithRetry(() => import('../../components/Packing/PackingListPanel'))
export const TodoListPanel = lazyWithRetry(() => import('../../components/Todo/TodoListPanel'))
export const FileManager = lazyWithRetry(() => import('../../components/Files/FileManager'))
export const CostsPanel = lazyWithRetry(() => import('../../components/Budget/CostsPanel'))
// Named export, so it needs the extra hop. Importing it statically would keep the
// whole CostsPanel module in the page chunk and undo the split above.
export const ExpenseModal = lazyWithRetry(() =>
  import('../../components/Budget/CostsPanel').then(m => ({ default: m.ExpenseModal }))
)
export const CollabPanel = lazyWithRetry(() => import('../../components/Collab/CollabPanel'))
export const RoadtripSidebar = lazyWithRetry(() => import('../../components/Roadtrip/RoadtripSidebar'))
export const RoadtripCorridorPanel = lazyWithRetry(() => import('../../components/Roadtrip/RoadtripCorridorPanel'))
export const RoadtripLimitsCard = lazyWithRetry(() => import('../../components/Roadtrip/RoadtripLimitsCard'))
export const RoadtripStopPopup = lazyWithRetry(() => import('../../components/Roadtrip/RoadtripStopPopup'))
export const RoadtripStayModal = lazyWithRetry(() => import('../../components/Roadtrip/RoadtripStayModal'))
export const RoadtripTrackModal = lazyWithRetry(() => import('../../components/Roadtrip/RoadtripTrackModal'))
export const RoadtripAlternativesBar = lazyWithRetry(() => import('../../components/Roadtrip/RoadtripAlternativesBar'))
export const TourPlannerRail = lazyWithRetry(() =>
  import('../../components/Tours/planner/TourPlannerPanels').then(module => ({ default: module.TourPlannerRail }))
)
export const TourPlannerToursRail = lazyWithRetry(() =>
  import('../../components/Tours/planner/TourPlannerPanels').then(module => ({ default: module.TourPlannerToursRail }))
)
// Already rendered conditionally, so lazy bites immediately. Worth it beyond its
// own 63 kB: it is the only path to TransitSearchPanel, which drags in tz-lookup,
// about 200 kB of packed zone geometry that every trip used to load.
export const TransportModal = lazyWithRetry(() =>
  import('../../components/Planner/TransportModal').then(m => ({ default: m.TransportModal }))
)
