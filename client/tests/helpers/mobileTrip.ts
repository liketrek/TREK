import { vi } from 'vitest';
import type { TripPlanner, MTripShellApi } from '../../src/mobile/screens/trip/MTripShell';
import { buildTrip } from './factories';

/**
 * Fixtures for the mobile trip screens. Every tab panel, sheet and overlay
 * under src/mobile/screens/trip receives the same two props — the planner
 * context from useTripPlanner() and the shell api from MTripShell — so tests
 * render them directly with these builders instead of mounting the whole shell.
 *
 * Defaults are the empty-but-valid state: a trip exists, every list is empty,
 * every callback is a spy. Pass overrides for the slice under test.
 */

/** Mirrors useTripStore's action surface as spies. */
export function buildTripActions(): Record<string, ReturnType<typeof vi.fn>> {
  const names = [
    'addCategory', 'addDayNote', 'addFile', 'addPackingContributor', 'addPackingItem',
    'addPlace', 'addReservation', 'addTodoItem', 'assignPlaceToDay', 'clonePackingItem',
    'deleteBudgetItem', 'deleteDayNote', 'deleteFile', 'deletePackingItem', 'deletePlace',
    'deletePlacesMany', 'deleteReservation', 'deleteTodoItem', 'insertDay', 'loadBudgetItems',
    'loadFiles', 'loadReservations', 'loadTrip', 'moveAssignment', 'moveDayNote', 'ratePlace',
    'refreshDays', 'removeAssignment', 'removePackingContributor', 'reorderAssignments',
    'reorderDays', 'setAssignments', 'setPackingItemSharing', 'setSelectedDay',
    'toggleBudgetMemberPaid', 'togglePackingItem', 'toggleReservationStatus', 'toggleTodoItem',
    'updateDayNote', 'updateDayTitle', 'updatePackingItem', 'updatePlace', 'updatePlacesMany',
    'updateReservation', 'updateTodoItem', 'updateTrip', 'uploadPlaceImage',
  ];
  const actions: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const name of names) actions[name] = vi.fn(async () => undefined);
  return actions;
}

export function buildToast(): Record<string, ReturnType<typeof vi.fn>> {
  return { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
}

/**
 * `t` echoes the key so assertions stay independent of the English copy.
 * Pass a real translation fn through overrides when a test needs visible text.
 */
const echoT = (key: string, params?: Record<string, string | number>): string =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

export function buildPlanner(overrides: Partial<TripPlanner> = {}): TripPlanner {
  const trip = buildTrip({ id: 1, title: 'Japan 2026', currency: 'EUR' });

  const base = {
    tripId: 1,
    navigate: vi.fn(),
    toast: buildToast(),
    t: echoT,
    language: 'en',
    settings: { time_format: '24h', date_format: 'DD.MM.YYYY', default_currency: 'EUR', distance_unit: 'km' },
    placesPhotosEnabled: false,

    trip,
    days: [],
    places: [],
    assignments: [],
    packingItems: [],
    todoItems: [],
    categories: [],
    reservations: [],
    budgetItems: [],
    files: [],

    selectedDayId: null,
    isLoading: false,
    tripActions: buildTripActions(),
    can: vi.fn(() => true),
    canUploadFiles: true,

    pushUndo: vi.fn(),
    undo: vi.fn(),
    canUndo: false,
    lastActionLabel: null,
    handleUndo: vi.fn(),

    enabledAddons: { packing: true, budget: true, documents: true, collab: true, vacay: true, atlas: true },
    collabFeatures: { chat: true, notes: true, polls: true },
    tripAccommodations: [],
    setTripAccommodations: vi.fn(),
    allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    tripMembers: [],
    setTripMembers: vi.fn(),
    refreshMembers: vi.fn(),
    loadAccommodations: vi.fn(),

    TRANSPORT_TYPES: new Set(['flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transit', 'transport_other']),
    TRIP_TABS: [],
    activeTab: 'plan',
    setActiveTab: vi.fn(),
    handleTabChange: vi.fn(),

    leftWidth: 320,
    rightWidth: 320,
    leftCollapsed: false,
    rightCollapsed: false,
    setLeftCollapsed: vi.fn(),
    setRightCollapsed: vi.fn(),
    startResizeLeft: vi.fn(),
    startResizeRight: vi.fn(),

    selectedPlaceId: null,
    selectedAssignmentId: null,
    setSelectedPlaceId: vi.fn(),
    selectAssignment: vi.fn(),

    showDayDetail: false,
    setShowDayDetail: vi.fn(),
    dayDetailCollapsed: false,
    setDayDetailCollapsed: vi.fn(),
    showPlaceForm: false,
    setShowPlaceForm: vi.fn(),
    editingPlace: null,
    setEditingPlace: vi.fn(),
    prefillCoords: null,
    setPrefillCoords: vi.fn(),
    placeFormDayId: null,
    setPlaceFormDayId: vi.fn(),
    reservationModalDayId: null,
    setReservationModalDayId: vi.fn(),
    editingAssignmentId: null,
    setEditingAssignmentId: vi.fn(),
    showTripForm: false,
    setShowTripForm: vi.fn(),
    showMembersModal: false,
    setShowMembersModal: vi.fn(),
    showReservationModal: false,
    setShowReservationModal: vi.fn(),
    editingReservation: null,
    setEditingReservation: vi.fn(),
    showBookingImport: false,
    setShowBookingImport: vi.fn(),
    bookingImportAvailable: true,
    airTrailAvailable: false,
    showAirTrailImport: false,
    setShowAirTrailImport: vi.fn(),
    bookingForAssignmentId: null,
    setBookingForAssignmentId: vi.fn(),

    showTransportModal: false,
    setShowTransportModal: vi.fn(),
    editingTransport: null,
    setEditingTransport: vi.fn(),
    transportModalDayId: null,
    setTransportModalDayId: vi.fn(),
    transportModalAutomated: false,
    setTransportModalAutomated: vi.fn(),
    transitPrefill: null,
    setTransitPrefill: vi.fn(),
    transitJourney: null,
    setTransitJourney: vi.fn(),
    reservationPrefill: null,
    transportPrefill: null,
    importReviewActive: false,
    startImportReview: vi.fn(),
    advanceImportReview: vi.fn(),

    routeShown: false,
    setRouteShown: vi.fn(),
    autoShowRoute: vi.fn(),
    routeProfile: 'driving',
    setRouteProfile: vi.fn(),
    routeVias: [],
    fitKey: 0,
    setFitKey: vi.fn(),

    mobileSidebarOpen: false,
    setMobileSidebarOpen: vi.fn(),
    mobilePlanScrollTopRef: { current: 0 },
    mobilePlacesScrollTopRef: { current: 0 },

    deletePlaceId: null,
    setDeletePlaceId: vi.fn(),
    deletePlaceIds: null,
    setDeletePlaceIds: vi.fn(),

    // resolveVisibleConnectionIds returns an array, and consumers call .includes().
    visibleConnections: [] as number[],
    toggleConnection: vi.fn(),
    allConnectionsShown: false,
    toggleAllConnections: vi.fn(),
    mapTransportDetail: null,
    setMapTransportDetail: vi.fn(),

    isMobile: true,
    isTouch: true,

    expandedDayIds: new Set<number>(),
    setExpandedDayIds: vi.fn(),
    mapPlaces: [],

    route: null,
    routeSegments: [],
    routeInfo: null,
    setRoute: vi.fn(),
    setRouteInfo: vi.fn(),
    updateRouteForDay: vi.fn(),

    handleSelectDay: vi.fn(),
    handlePlaceClick: vi.fn(),
    handleMarkerClick: vi.fn(),
    handleMapClick: vi.fn(),
    handleMapContextMenu: vi.fn(),
    openAddPlaceFromPoi: vi.fn(),
    handleSavePlace: vi.fn(),
    openPlaceEditor: vi.fn(),
    handleDeletePlace: vi.fn(),
    confirmDeletePlace: vi.fn(),
    confirmDeletePlaces: vi.fn(),
    confirmChangeCategory: vi.fn(),
    handleAssignToDay: vi.fn(),
    handleRemoveAssignment: vi.fn(),
    handleReorder: vi.fn(),
    handleReorderDays: vi.fn(),
    handleAddDay: vi.fn(),
    handleUpdateDayTitle: vi.fn(),
    handleSaveReservation: vi.fn(),
    handleSaveTransport: vi.fn(),
    handleDeleteReservation: vi.fn(),

    selectedPlace: null,
    dayOrderMap: new Map<number, number>(),
    dayPlaces: [],

    mapTileUrl: 'https://tile.example/{z}/{x}/{y}.png',
    fontStyle: {},
    splashDone: true,
  };

  return { ...base, ...overrides } as unknown as TripPlanner;
}

export function buildShell(overrides: Partial<MTripShellApi> = {}): MTripShellApi {
  const base: MTripShellApi = {
    view: 'plan',
    mode: 'go',
    trTab: 'plan',
    setTrTab: vi.fn(),
    setTravelMode: vi.fn(),
    toggleView: vi.fn(),
    browseFromEdit: false,
    sheet: null,
    openSheet: vi.fn(),
    closeSheet: vi.fn(),
    listsTab: 'packing',
    setListsTab: vi.fn(),
    collabTab: 'chat',
    setCollabTab: vi.fn(),
    transportsCompact: false,
    bookingsCompact: false,
    addExpenseSignal: 0,
    exportCostsCsvSignal: 0,
    uploadFilesSignal: 0,
    openFilesTrashSignal: 0,
  };
  return { ...base, ...overrides };
}
